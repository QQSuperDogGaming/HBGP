// Apply background images from data-bg (iOS friendly)
document.querySelectorAll(".panel[data-bg]").forEach((el) => {
  const url = el.getAttribute("data-bg");
  if (url) el.style.backgroundImage = `url("${url}")`;
});

// Start button scrolls to next section
document.getElementById("startBtn")?.addEventListener("click", () => {
  document.querySelector(".panel:nth-child(2)")?.scrollIntoView({
    behavior: "smooth",
  });
});

// Flip to reveal blessing + confetti
const card = document.getElementById("blessingCard");
card.addEventListener("click", () => {
  card.classList.toggle("revealed");
  burstConfetti(120);
});
card.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    card.click();
  }
});

// Background switcher cycles three provided images
const bgs = [
  "assets/bg_clouds_black.jpg",
  "assets/bg_waves_red.jpg",
  "assets/bg_mountains_red.jpg",
];
document.querySelectorAll('[data-action="switch-bg"]').forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.closest(".panel");
    const match =
      section.style.backgroundImage.match(/assets\/[^)"']+/)?.[0] ||
      section.getAttribute("data-bg");
    const next = bgs[(bgs.indexOf(match) + 1) % bgs.length];
    section.style.backgroundImage = `url("${next}")`;
  });
});

// -------- gold confetti (tiny canvas particle system) --------
const canvas = document.getElementById("fx");
const ctx = canvas.getContext("2d", { alpha: true });
let particles = [];
const DPR = Math.max(1, window.devicePixelRatio || 1);

function resize() {
  canvas.width = innerWidth * DPR;
  canvas.height = innerHeight * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
addEventListener("resize", resize);
resize();

function burstConfetti(n = 80) {
  const rect = card.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * (2 + Math.random() * 4),
      vy: Math.sin(a) * (2 + Math.random() * 4) - 2,
      life: 80 + Math.random() * 60,
      size: 1 + Math.random() * 2,
      g: 0.05 + Math.random() * 0.05,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.2,
      color:
        Math.random() > 0.1
          ? "rgba(247,216,137,.9)" // gold
          : "rgba(255,255,255,.9)", // white sparkle
    });
  }
}

document
  .querySelectorAll('[data-action="confetti"]')
  .forEach((b) => b.addEventListener("click", () => burstConfetti(100)));

function tick() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  particles = particles.filter((p) => p.life > 0);
  particles.forEach((p) => {
    p.life--;
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
    ctx.restore();
  });
  requestAnimationFrame(tick);
}
tick();

// -------- minimal PWA install prompt --------
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installBtn")?.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
});
