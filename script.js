/* ===== helper state ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ===== background interactivity ===== */
const root = document.documentElement;
let allowParallax = true;

const speedEl = $("#speed");
const goldEl = $("#gold");
const burstEl = $("#burst");
const paraEl  = $("#parallax");

function setVar(name, val){ root.style.setProperty(name, val); }

speedEl.addEventListener("input", e => setVar("--speed", e.target.value));
goldEl.addEventListener("input", e => setVar("--gold-mul", e.target.value));
paraEl.addEventListener("change", e => allowParallax = e.target.checked);

/* pointer-driven parallax for CSS light sweep + particle source */
function updatePointer(e){
  if(!allowParallax) return;
  const x = (e.touches ? e.touches[0].clientX : e.clientX) / innerWidth * 100;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) / innerHeight * 100;
  setVar("--mx", x.toFixed(2));
  setVar("--my", y.toFixed(2));
}
addEventListener("pointermove", updatePointer, {passive:true});
addEventListener("touchmove", updatePointer, {passive:true});

/* device-tilt parallax (mobile) */
addEventListener("deviceorientation", (e) => {
  if(!allowParallax || e.beta == null) return;
  const x = 50 + (e.gamma || 0) / 3;  // left/right
  const y = 50 + (e.beta  || 0) / 6;  // forward/back
  setVar("--mx", Math.max(0, Math.min(100, x)));
  setVar("--my", Math.max(0, Math.min(100, y)));
});

/* ===== sections ===== */
$("#startBtn")?.addEventListener("click", () =>
  document.querySelector(".panel:nth-child(2)")
    ?.scrollIntoView({behavior:"smooth"})
);

/* ===== blessing card: flip + 3D tilt + haptics ===== */
const card = $("#blessingCard");
const vmax = 10; // max tilt deg

function tilt(e){
  const r = card.getBoundingClientRect();
  const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
  const py = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
  const rx = ((py / r.height) - .5) * -2 * vmax;
  const ry = ((px / r.width)  - .5) *  2 * vmax;
  card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  card.classList.add("tilt");
}
function untilt(){ card.style.transform = ""; card.classList.remove("tilt"); }
["pointermove","touchmove"].forEach(ev => card.addEventListener(ev, tilt));
["pointerleave","touchend","touchcancel"].forEach(ev => card.addEventListener(ev, untilt));

function flip(){
  card.classList.toggle("revealed");
  burstConfetti(parseInt(burstEl.value,10));
  navigator.vibrate?.(80);
}
card.addEventListener("click", flip);
card.addEventListener("keydown", e=>{
  if(e.key === "Enter" || e.key === " "){ e.preventDefault(); flip(); }
});

/* ===== confetti (drag to paint) ===== */
const canvas = $("#fx");
const ctx = canvas.getContext("2d", {alpha:true});
let particles = [];
const DPR = Math.max(1, devicePixelRatio || 1);
function resize(){
  canvas.width = innerWidth * DPR;
  canvas.height = innerHeight * DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
addEventListener("resize", resize); resize();

function addParticles(x, y, n = 60){
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2;
    particles.push({
      x,y,
      vx: Math.cos(a)* (1+Math.random()*3),
      vy: Math.sin(a)* (1+Math.random()*3) - 1,
      life: 70 + Math.random()*50,
      size: 1 + Math.random()*2,
      g: .05 + Math.random()*.05,
      rot: Math.random()*Math.PI*2,
      vr: (Math.random()-.5)*.2,
      color: Math.random()>.12 ? `rgba(247,216,137,${.6+.4*Math.random()})`
                               : `rgba(255,255,255,${.7+.3*Math.random()})`
    });
  }
}
function burstConfetti(n=120){
  const rect = card.getBoundingClientRect();
  addParticles(rect.left + rect.width/2, rect.top + rect.height/2, n);
}
$$('[data-action="confetti"]').forEach(b=>b.addEventListener("click",
  ()=> burstConfetti(parseInt(burstEl.value,10))
));
/* paint mode while dragging */
let painting = false;
addEventListener("pointerdown", e => { painting = true; updatePointer(e); sprinkle(e); });
addEventListener("pointerup",   ()=> painting = false);
addEventListener("pointermove", e => { if(painting) sprinkle(e); });
function sprinkle(e){
  const x = (e.clientX || e.touches?.[0]?.clientX || 0);
  const y = (e.clientY || e.touches?.[0]?.clientY || 0);
  addParticles(x,y, 8);
}
function tick(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  particles = particles.filter(p=>p.life>0);
  for(const p of particles){
    p.life--; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
    ctx.fillStyle = p.color; ctx.fillRect(-p.size,-p.size,p.size*2,p.size*2);
    ctx.restore();
  }
  requestAnimationFrame(tick);
}
tick();

/* ===== haptics button ===== */
$("#shakeBtn").addEventListener("click", ()=>{
  navigator.vibrate?.([40,30,40]);
});

/* ===== lightbox ===== */
const box = $("#lightbox"), boxImg = $("#lightbox img"), closeBox = $("#closeBox");
$$(".photos img").forEach(img=>{
  img.addEventListener("click", ()=>{
    boxImg.src = img.src; box.showModal();
  });
});
closeBox.addEventListener("click", ()=> box.close());
box.addEventListener("click", (e)=>{ if(e.target === box) box.close(); });