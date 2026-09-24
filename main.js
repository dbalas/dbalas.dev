const canvas = document.getElementById("sky");
const core = document.querySelector(".core");
const heading = document.querySelector("h1");
const bio = document.querySelector("p");
const badges = [...document.querySelectorAll(".badge")];
const mark = document.querySelector(".mark");
const orbiters = [...badges, mark];
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const stars = Array.from({ length: 460 }, () => ({
  a: Math.random() * Math.PI * 2,
  rf: Math.random() ** 0.72,
  s: Math.random() < 0.06 ? 1.8 : 0.45 + Math.random() * 0.7,
  b: 0.2 + Math.random() * 0.8,
  violet: Math.random() < 0.22,
}));

function fit() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  const pw = Math.floor(w * dpr);
  const ph = Math.floor(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

let layoutCache = null;

function measure(w, h) {
  if (layoutCache && layoutCache.w === w && layoutCache.h === h) return layoutCache;
  const narrow = w < 720;
  const badgeHalf = Math.max(...orbiters.map((badge) => badge.offsetWidth), 72) / 2 + (narrow ? 8 : 12);
  let scale = 1;
  let R = 120;
  let orbit = 180;
  for (let pass = 0; pass < 10; pass += 1) {
    const block = (narrow ? Math.min(230, w * 0.62) : Math.min(480, w * 0.4)) * scale;
    core.style.width = block + "px";
    heading.style.fontSize = (narrow ? 24 : 50) * scale + "px";
    bio.style.fontSize = (narrow ? 13 : 17.5) * scale + "px";
    const box = core.getBoundingClientRect();
    const pad = (narrow ? 34 : 52) * Math.max(scale, 0.7);
    R = Math.hypot(box.width, box.height) / 2 + pad;
    orbit = R * (narrow ? 1.28 : 1.46);
    const limit = Math.min(w, h) / 2 - badgeHalf;
    if (orbit <= limit && R <= Math.min(w, h) * 0.44) break;
    scale *= 0.88;
  }
  layoutCache = { R, orbit, cx: w / 2, cy: h / 2, w, h };
  return layoutCache;
}

function diskSpeed(R, rad) {
  const t = Math.max(0, (rad / R - 1.06) / 2.15);
  return 0.00013 / (0.45 + t * 2.6);
}

const palettes = [
  {
    id: "quasar",
    sky: "#07040c",
    star: "230, 180, 255",
    nebula: ["130, 36, 170", "90, 48, 16"],
    wash: ["196, 90, 230", "190, 120, 40"],
    inner: "255, 246, 255",
    mid: "232, 180, 255",
    outer: "206, 124, 48",
    rim: "255, 220, 255",
    fade: "186, 78, 220",
  },
  {
    id: "pulsar",
    sky: "#04080c",
    star: "160, 230, 255",
    nebula: ["20, 110, 160", "120, 70, 16"],
    wash: ["80, 200, 230", "210, 140, 40"],
    inner: "240, 252, 255",
    mid: "150, 230, 255",
    outer: "220, 150, 48",
    rim: "210, 245, 255",
    fade: "40, 160, 210",
  },
  {
    id: "blazar",
    sky: "#06040e",
    star: "170, 190, 255",
    nebula: ["40, 60, 190", "140, 24, 90"],
    wash: ["110, 130, 255", "210, 60, 140"],
    inner: "244, 246, 255",
    mid: "176, 190, 255",
    outer: "220, 70, 150",
    rim: "220, 226, 255",
    fade: "80, 90, 220",
  },
  {
    id: "seyfert",
    sky: "#060410",
    star: "190, 170, 255",
    nebula: ["70, 36, 160", "130, 62, 24"],
    wash: ["140, 90, 230", "210, 110, 48"],
    inner: "248, 244, 255",
    mid: "196, 160, 255",
    outer: "214, 112, 52",
    rim: "230, 214, 255",
    fade: "120, 70, 210",
  },
  {
    id: "tidal",
    sky: "#0c0608",
    star: "255, 186, 200",
    nebula: ["160, 36, 64", "16, 90, 96"],
    wash: ["230, 90, 120", "48, 170, 160"],
    inner: "255, 240, 244",
    mid: "255, 170, 190",
    outer: "56, 186, 170",
    rim: "255, 214, 224",
    fade: "200, 60, 96",
  },
  {
    id: "nova",
    sky: "#06080c",
    star: "186, 220, 255",
    nebula: ["30, 80, 150", "150, 48, 36"],
    wash: ["120, 180, 240", "230, 100, 70"],
    inner: "246, 250, 255",
    mid: "176, 214, 255",
    outer: "232, 112, 78",
    rim: "220, 236, 255",
    fade: "70, 130, 210",
  },
  {
    id: "radio",
    sky: "#08060a",
    star: "220, 200, 255",
    nebula: ["90, 70, 150", "140, 48, 18"],
    wash: ["170, 150, 230", "210, 90, 36"],
    inner: "250, 246, 255",
    mid: "214, 196, 255",
    outer: "214, 96, 40",
    rim: "236, 226, 255",
    fade: "140, 100, 210",
  },
  {
    id: "magnetar",
    sky: "#040c0a",
    star: "160, 240, 210",
    nebula: ["16, 120, 100", "120, 28, 48"],
    wash: ["70, 210, 170", "190, 50, 80"],
    inner: "240, 255, 250",
    mid: "150, 235, 200",
    outer: "200, 64, 96",
    rim: "214, 255, 236",
    fade: "36, 170, 140",
  },
];

const rgba = (rgb, alpha) => `rgba(${rgb}, ${alpha})`;
const spin = document.querySelector(".spin");
const spinIcon = spin.querySelector("svg");
const theme = document.querySelector('meta[name="theme-color"]');
let tone = palettes[0];
let turns = 0;

function dayIndex() {
  const now = new Date();
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  return ((day % palettes.length) + palettes.length) % palettes.length;
}

function applyTone(index) {
  tone = palettes[index];
  document.documentElement.style.background = tone.sky;
  document.body.style.background = tone.sky;
  theme.setAttribute("content", tone.sky);
}

applyTone(dayIndex());

spin.addEventListener("click", () => {
  turns += 1;
  spinIcon.style.transform = `rotate(${turns * 180}deg)`;
  applyTone((palettes.indexOf(tone) + 1) % palettes.length);
});

function paint(ctx, w, h, cx, cy, R, now) {
  ctx.fillStyle = tone.sky;
  ctx.fillRect(0, 0, w, h);

  const reach = Math.hypot(w, h) * 0.62;
  ctx.save();
  ctx.translate(cx, cy);

  const nebula = ctx.createRadialGradient(-R * 1.3, -R * 0.15, R * 0.2, 0, 0, reach);
  nebula.addColorStop(0, rgba(tone.nebula[0], 0.3));
  nebula.addColorStop(0.5, rgba(tone.nebula[1], 0.12));
  nebula.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = nebula;
  ctx.fillRect(-w, -h, w * 2, h * 2);

  stars.forEach((star) => {
    const rad = Math.max(R * 1.2, star.rf * reach);
    const speed = reduced ? 0 : (0.000054 * (R * 3.2)) / rad;
    const a = star.a + now * speed;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    const color = star.violet ? rgba(tone.star, star.b) : rgba("255, 252, 248", star.b);
    const streak = rad < R * 2.8 ? 5 * (1 - rad / (R * 2.8)) : 0;
    if (streak > 1.2) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.sin(a) * (star.s + streak), y + Math.cos(a) * (star.s + streak));
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, star.s * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const wash = ctx.createRadialGradient(0, 0, R * 0.96, 0, 0, R * 3.1);
  wash.addColorStop(0, "rgba(0,0,0,0)");
  wash.addColorStop(0.34, rgba(tone.wash[0], 0.22));
  wash.addColorStop(0.55, rgba(tone.wash[1], 0.14));
  wash.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = wash;
  ctx.beginPath();
  ctx.arc(0, 0, R * 3.1, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 56; i += 1) {
    const t = i / 56;
    const rad = R * (1.06 + t * 2.15);
    const rot = reduced ? i * 0.37 : now * diskSpeed(R, rad) + i * 0.37;
    ctx.save();
    ctx.rotate(rot);
    const alpha = (1 - t) ** 1.6 * 0.55;
    ctx.strokeStyle =
      t < 0.1 ? rgba(tone.inner, 0.45 + alpha) : t < 0.32 ? rgba(tone.mid, alpha) : rgba(tone.outer, alpha * 0.75);
    ctx.lineWidth = t < 0.12 ? 1.7 : 1.1;
    const segs = 4 + (i % 5);
    for (let s = 0; s < segs; s += 1) {
      const a0 = (s / segs) * Math.PI * 2 + ((i * 13) % 7) * 0.08;
      const len = 0.28 + ((i * 5 + s * 3) % 8) * 0.06;
      ctx.beginPath();
      ctx.arc(0, 0, rad, a0, a0 + len);
      ctx.stroke();
    }
    ctx.restore();
  }

  const rim = ctx.createRadialGradient(0, 0, R * 0.96, 0, 0, R * 1.22);
  rim.addColorStop(0, "rgba(255,255,255,0)");
  rim.addColorStop(0.12, rgba(tone.inner, 0.96));
  rim.addColorStop(0.34, rgba(tone.rim, 0.5));
  rim.addColorStop(1, rgba(tone.fade, 0));
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = rgba(tone.inner, 0.9);
  ctx.shadowBlur = Math.max(18, R * 0.1);
  ctx.strokeStyle = rgba(tone.inner, 0.95);
  ctx.lineWidth = Math.max(4, R * 0.045);
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.01, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function frame(now) {
  const { ctx, w, h } = fit();
  const { R, orbit, cx, cy } = measure(w, h);
  const clock = reduced ? 0 : now;
  paint(ctx, w, h, cx, cy, R, clock);
  const speed = diskSpeed(R, orbit) * 0.8;
  const center = clock * speed - Math.PI / 2;
  const gap = w < 720 ? 10 : 16;
  const widths = badges.map((badge) => badge.offsetWidth);
  const offsets = [0];
  for (let i = 1; i < widths.length; i += 1) {
    const need = (widths[i - 1] + widths[i]) / 2 + gap;
    offsets.push(offsets[i - 1] + 2 * Math.asin(Math.min(0.98, need / (2 * orbit))));
  }
  const mid = offsets[offsets.length - 1] / 2;
  badges.forEach((badge, i) => {
    const ang = center + offsets[i] - mid;
    badge.style.left = cx + Math.cos(ang) * orbit + "px";
    badge.style.top = cy + Math.sin(ang) * orbit + "px";
  });
  const markAng = center + Math.PI;
  mark.style.left = cx + Math.cos(markAng) * orbit + "px";
  mark.style.top = cy + Math.sin(markAng) * orbit + "px";
  if (!reduced) requestAnimationFrame(frame);
}

document.fonts.ready.then(() => requestAnimationFrame(frame));
window.addEventListener("resize", () => {
  if (reduced) requestAnimationFrame(frame);
});
