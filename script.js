/* ===== utilities ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const root = document.documentElement;
function setVar(name, val){ root.style.setProperty(name, val); }

/* ===== reduced motion + perf guard ===== */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let perfCap = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ? 0.7 : 1;

/* ===== pointer/gyro parallax (toggleable) ===== */
let allowParallax = true;
function updatePointer(e){
  if(!allowParallax) return;
  const p = ('touches' in e) ? e.touches[0] : e;
  setVar("--mx", (p.clientX / innerWidth * 100).toFixed(2));
  setVar("--my", (p.clientY / innerHeight * 100).toFixed(2));
}
addEventListener("pointermove", updatePointer, {passive:true});
addEventListener("touchmove", updatePointer, {passive:true});
addEventListener("deviceorientation", (e)=>{
  if(!allowParallax || e.beta == null) return;
  const x = Math.max(0, Math.min(100, 50 + (e.gamma||0)/3));
  const y = Math.max(0, Math.min(100, 50 + (e.beta ||0)/6));
  setVar("--mx", x); setVar("--my", y);
});

/* ===== swipe navigation (one finger) ===== */
let startY=0, startX=0;
addEventListener("touchstart", e=>{ const t=e.touches[0]; startY=t.clientY; startX=t.clientX; }, {passive:true});
addEventListener("touchend", e=>{
  const t = e.changedTouches[0];
  const dx = t.clientX - startX, dy = t.clientY - startY;
  if(Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)){
    const dir = dy>0 ? -1 : 1;
    scrollBy({top: dir*innerHeight*0.95, behavior:"smooth"});
  }
});

/* ===== controls: bottom sheet + toolbar ===== */
const sheet = $("#settings");
$("#tb-settings").addEventListener("click", ()=> showSheet(true));
$("#closeSheet").addEventListener("click", ()=> showSheet(false));
function showSheet(show){
  sheet.classList.toggle("show", show);
  sheet.setAttribute("aria-hidden", show ? "false" : "true");
}

$("#startBtn")?.addEventListener("click", ()=> goTo(1));
$("#tb-start").addEventListener("click", ()=> goTo(0));
$("#tb-photos").addEventListener("click", ()=> goTo(2));
$("#tb-reveal").addEventListener("click", revealBlessing);
$("#tb-confetti").addEventListener("click", ()=> burstConfetti(burstVal()));

function goTo(idx){
  const s = $$(".panel")[idx];
  s?.scrollIntoView({behavior:"smooth"});
}

/* ===== blessing card: simple flip (tap big toolbar button) ===== */
const card = $("#blessingCard");
function revealBlessing(){
  card.classList.toggle("revealed");
  burstConfetti(burstVal());
  navigator.vibrate?.(60);
}
card.addEventListener("click", revealBlessing);
card.addEventListener("keydown", e=>{
  if(e.key==="Enter"||e.key===" "){ e.preventDefault(); revealBlessing(); }
});

/* ===== settings sliders ===== */
const speedEl=$("#speed"), goldEl=$("#gold"), burstEl=$("#burst"), paraEl=$("#parallax");
const burstVal = ()=> Math.floor(parseInt(burstEl.value,10) * (reduceMotion?0.5:1) * perfCap);
speedEl.addEventListener("input", e=> setVar("--speed", e.target.value));
goldEl.addEventListener("input", e=> setVar("--gold-mul", e.target.value));
paraEl.addEventListener("change", e=> allowParallax = e.target.checked);

/* ===== confetti (optimized) ===== */
const canvas = $("#fx");
const ctx = canvas.getContext("2d", {alpha:true, desynchronized:true});
let particles = [];
const DPR = Math.max(1, devicePixelRatio || 1);
function resize(){
  canvas.width = innerWidth * DPR;
  canvas.height = innerHeight * DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
addEventListener("resize", resize); resize();

function makeParticle(x,y){
  const a = Math.random()*Math.PI*2, sp = 1 + Math.random()*3;
  return {
    x,y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - 1,
    life: 60 + Math.random()*50,
    size: 1 + Math.random()*2,
    g: .05 + Math.random()*.05,
    rot: Math.random()*Math.PI*2,
    vr: (Math.random()-.5)*.2,
    color: Math.random()>.12 ? `rgba(247,216,137,${.6+.4*Math.random()})`
                             : `rgba(255,255,255,${.7+.3*Math.random()})`
  };
}

function addParticles(x,y,n=80){
  for(let i=0;i<n;i++) particles.push(makeParticle(x,y));
}

function burstConfetti(n=120){
  const rect = card.getBoundingClientRect();
  addParticles(rect.left + rect.width/2, rect.top + rect.height/2, n);
}

/* paint by dragging anywhere (big targets) */
let paint=false;
addEventListener("pointerdown", e=>{ paint=true; sprinkle(e); }, {passive:true});
addEventListener("pointerup",   ()=>{ paint=false; });
addEventListener("pointermove", e=>{ if(paint) sprinkle(e); }, {passive:true});
function sprinkle(e){
  const x = e.clientX || e.touches?.[0]?.clientX || 0;
  const y = e.clientY || e.touches?.[0]?.clientY || 0;
  addParticles(x,y, 6);
}

/* animation loop with throttling for battery */
let last=0, step=1000/75; // 75fps cap baseline
function tick(ts){
  if(ts - last > step){
    last = ts;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    particles = particles.filter(p=>p.life>0);
    for(const p of particles){
      p.life--; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size,-p.size,p.size*2,p.size*2);
      ctx.restore();
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* ===== lightbox (tap photo) ===== */
const box = $("#lightbox"), boxImg = $("#lightbox img"), closeBox = $("#closeBox");
$$(".photos img").forEach(img=>{
  img.addEventListener("click", ()=>{
    boxImg.src = img.src; box.showModal();
  });
});
closeBox.addEventListener("click", ()=> box.close());
box.addEventListener("click", (e)=>{ if(e.target === box) box.close(); });