const canvas = document.getElementById("sky");
const core = document.querySelector(".core");
const heading = document.querySelector("h1");
const bio = document.querySelector("p");
const badges = [...document.querySelectorAll(".badge")];
const mark = document.querySelector(".mark");
const orbiters = [...badges, mark];
const ctx = canvas.getContext("2d", { alpha: false });
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reduced = motionQuery.matches;
const stars = Array.from({ length: 460 }, () => ({
  a: Math.random() * Math.PI * 2,
  rf: Math.random() ** 0.72,
  s: Math.random() < 0.06 ? 1.8 : 0.45 + Math.random() * 0.7,
  b: 0.2 + Math.random() * 0.8,
  violet: Math.random() < 0.22,
}));

function pixelRatio() {
  return Math.min(2, window.devicePixelRatio || 1);
}

function fit() {
  const dpr = pixelRatio();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const pw = Math.floor(w * dpr);
  const ph = Math.floor(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  return { dpr, w, h };
}

let layoutCache = null;

function measure(w, h) {
  if (layoutCache && layoutCache.w === w && layoutCache.h === h) return layoutCache;
  const narrow = w < 720;
  const badgeHalf = Math.max(...orbiters.map((badge) => badge.offsetWidth), 72) / 2 + 12;
  let R = 120;
  let orbit = 180;
  if (narrow) {
    const orbitMult = 1.2;
    const textPad = 16;
    const edgePad = 10;
    const maxOrbit = Math.min(w, h) / 2 - badgeHalf - edgePad;
    const rCap = maxOrbit / orbitMult;
    core.style.width = Math.min(258, w * 0.72) + "px";
    let hPx = 31;
    let pPx = 16;
    heading.style.fontSize = hPx + "px";
    bio.style.fontSize = pPx + "px";
    for (let step = 0; step < 24; step += 1) {
      const box = core.getBoundingClientRect();
      const nextR = Math.hypot(box.width, box.height) / 2 + textPad;
      if (nextR >= rCap * 0.86) break;
      hPx *= 1.04;
      pPx *= 1.04;
      heading.style.fontSize = hPx + "px";
      bio.style.fontSize = pPx + "px";
    }
    const box = core.getBoundingClientRect();
    let textR = Math.hypot(box.width, box.height) / 2 + textPad;
    R = Math.min(textR, rCap);
    orbit = Math.min(R * orbitMult, maxOrbit);
    R = orbit / orbitMult;
    for (let step = 0; step < 16 && textR > R + 2; step += 1) {
      hPx *= 0.96;
      pPx *= 0.96;
      heading.style.fontSize = hPx + "px";
      bio.style.fontSize = pPx + "px";
      const shrunk = core.getBoundingClientRect();
      textR = Math.hypot(shrunk.width, shrunk.height) / 2 + textPad;
    }
  } else {
    let scale = 1;
    const textPad = 52;
    for (let pass = 0; pass < 10; pass += 1) {
      const block = Math.min(480, w * 0.4) * scale;
      core.style.width = block + "px";
      heading.style.fontSize = 50 * scale + "px";
      bio.style.fontSize = 17.5 * scale + "px";
      const box = core.getBoundingClientRect();
      const pad = textPad * Math.max(scale, 0.7);
      R = Math.hypot(box.width, box.height) / 2 + pad;
      orbit = R * 1.46;
      const limit = Math.min(w, h) / 2 - badgeHalf;
      if (orbit <= limit && R <= Math.min(w, h) * 0.44) break;
      scale *= 0.88;
    }
  }
  const gap = narrow ? 10 : 16;
  const widths = badges.map((badge) => badge.offsetWidth);
  const offsets = [0];
  for (let i = 1; i < widths.length; i += 1) {
    const need = (widths[i - 1] + widths[i]) / 2 + gap;
    offsets.push(offsets[i - 1] + 2 * Math.asin(Math.min(0.98, need / (2 * orbit))));
  }
  layoutCache = {
    R,
    orbit,
    cx: w / 2,
    cy: h / 2,
    w,
    h,
    offsets,
    mid: offsets[offsets.length - 1] / 2,
    speed: diskSpeed(R, orbit) * 0.8,
  };
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
    id: "violet",
    sky: "#06040c",
    star: "214, 186, 255",
    nebula: ["92, 48, 140", "48, 24, 82"],
    wash: ["186, 150, 230", "120, 70, 176"],
    inner: "255, 250, 255",
    mid: "226, 206, 255",
    outer: "150, 96, 196",
    rim: "226, 208, 255",
    fade: "160, 120, 220",
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
    id: "jet",
    sky: "#03060c",
    star: "160, 210, 255",
    nebula: ["28, 88, 170", "10, 36, 78"],
    wash: ["120, 190, 255", "36, 90, 180"],
    inner: "240, 250, 255",
    mid: "170, 220, 255",
    outer: "56, 128, 220",
    rim: "190, 230, 255",
    fade: "70, 140, 230",
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
    id: "redshift",
    sky: "#0c0406",
    star: "255, 170, 186",
    nebula: ["150, 28, 48", "72, 10, 22"],
    wash: ["220, 90, 110", "150, 28, 48"],
    inner: "255, 236, 240",
    mid: "255, 170, 184",
    outer: "186, 42, 70",
    rim: "255, 200, 210",
    fade: "190, 48, 78",
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
    id: "hawking",
    sky: "#05070a",
    star: "190, 214, 230",
    nebula: ["78, 108, 138", "28, 44, 62"],
    wash: ["176, 198, 216", "88, 118, 148"],
    inner: "248, 252, 255",
    mid: "200, 220, 235",
    outer: "110, 142, 172",
    rim: "220, 235, 245",
    fade: "140, 170, 198",
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
    id: "ember",
    sky: "#070403",
    star: "255, 196, 140",
    nebula: ["150, 64, 18", "72, 28, 8"],
    wash: ["220, 130, 48", "150, 58, 16"],
    inner: "255, 244, 230",
    mid: "255, 196, 130",
    outer: "196, 82, 28",
    rim: "255, 214, 170",
    fade: "210, 110, 36",
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
    id: "copper",
    sky: "#0a0704",
    star: "230, 180, 130",
    nebula: ["120, 70, 28", "64, 36, 14"],
    wash: ["200, 130, 70", "140, 80, 36"],
    inner: "255, 244, 228",
    mid: "230, 176, 120",
    outer: "160, 96, 48",
    rim: "255, 220, 180",
    fade: "180, 110, 50",
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
    id: "sage",
    sky: "#040806",
    star: "176, 220, 170",
    nebula: ["36, 100, 64", "16, 48, 32"],
    wash: ["110, 180, 120", "48, 110, 70"],
    inner: "244, 255, 242",
    mid: "176, 220, 170",
    outer: "70, 140, 90",
    rim: "214, 240, 210",
    fade: "60, 130, 80",
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

const layers = { key: "", back: { alpha: false }, wash: { alpha: true }, front: { alpha: true } };
let field = null;
let fieldKey = "";

function layerContext(slot, dpr, w, h) {
  if (!slot.canvas) slot.canvas = document.createElement("canvas");
  const pw = Math.floor(w * dpr);
  const ph = Math.floor(h * dpr);
  if (slot.canvas.width !== pw || slot.canvas.height !== ph) {
    slot.canvas.width = pw;
    slot.canvas.height = ph;
    slot.ctx = null;
  }
  if (!slot.ctx) slot.ctx = slot.canvas.getContext("2d", { alpha: slot.alpha });
  return slot.ctx;
}

function ensureLayers(dpr, w, h, cx, cy, R) {
  const key = `${tone.id}|${dpr}|${w}|${h}|${R}`;
  if (layers.key === key) return layers;
  const reach = Math.hypot(w, h) * 0.62;

  const back = layerContext(layers.back, dpr, w, h);
  back.setTransform(dpr, 0, 0, dpr, 0, 0);
  back.fillStyle = tone.sky;
  back.fillRect(0, 0, w, h);
  back.translate(cx, cy);
  const nebula = back.createRadialGradient(-R * 1.3, -R * 0.15, R * 0.2, 0, 0, reach);
  nebula.addColorStop(0, rgba(tone.nebula[0], 0.3));
  nebula.addColorStop(0.5, rgba(tone.nebula[1], 0.12));
  nebula.addColorStop(1, "rgba(0,0,0,0)");
  back.fillStyle = nebula;
  back.fillRect(-w, -h, w * 2, h * 2);

  const wash = layerContext(layers.wash, dpr, w, h);
  wash.setTransform(dpr, 0, 0, dpr, cx * dpr, cy * dpr);
  wash.clearRect(-w, -h, w * 2, h * 2);
  const washPaint = wash.createRadialGradient(0, 0, R * 0.96, 0, 0, R * 3.1);
  washPaint.addColorStop(0, "rgba(0,0,0,0)");
  washPaint.addColorStop(0.34, rgba(tone.wash[0], 0.22));
  washPaint.addColorStop(0.55, rgba(tone.wash[1], 0.14));
  washPaint.addColorStop(1, "rgba(0,0,0,0)");
  wash.fillStyle = washPaint;
  wash.beginPath();
  wash.arc(0, 0, R * 3.1, 0, Math.PI * 2);
  wash.fill();

  const front = layerContext(layers.front, dpr, w, h);
  front.setTransform(dpr, 0, 0, dpr, cx * dpr, cy * dpr);
  front.clearRect(-w, -h, w * 2, h * 2);
  const rim = front.createRadialGradient(0, 0, R * 0.96, 0, 0, R * 1.22);
  rim.addColorStop(0, "rgba(255,255,255,0)");
  rim.addColorStop(0.12, rgba(tone.inner, 0.96));
  rim.addColorStop(0.34, rgba(tone.rim, 0.5));
  rim.addColorStop(1, rgba(tone.fade, 0));
  front.fillStyle = rim;
  front.beginPath();
  front.arc(0, 0, R * 1.22, 0, Math.PI * 2);
  front.fill();
  front.shadowColor = rgba(tone.inner, 0.9);
  front.shadowBlur = Math.max(18, R * 0.1);
  front.strokeStyle = rgba(tone.inner, 0.95);
  front.lineWidth = Math.max(4, R * 0.045);
  front.beginPath();
  front.arc(0, 0, R * 1.01, 0, Math.PI * 2);
  front.stroke();
  front.shadowBlur = 0;
  front.fillStyle = "#000";
  front.beginPath();
  front.arc(0, 0, R, 0, Math.PI * 2);
  front.fill();

  layers.key = key;
  return layers;
}

function starField(w, h, R) {
  const key = `${tone.id}|${w}|${h}|${R}`;
  if (field && fieldKey === key) return field;
  const reach = Math.hypot(w, h) * 0.62;
  const baked = stars.map((star) => {
    const rad = Math.max(R * 1.2, star.rf * reach);
    const streak = rad < R * 2.8 ? 5 * (1 - rad / (R * 2.8)) : 0;
    return {
      a: star.a,
      s: star.s,
      rad,
      speed: (0.000054 * (R * 3.2)) / rad,
      color: rgba(star.violet ? tone.star : "255, 252, 248", star.b),
      streak: streak > 1.2 ? streak : 0,
      r: star.s * 0.55,
    };
  });
  const rings = [];
  const ringGap = Math.max((R * 2.15) / 56, 10);
  for (let i = 0; i < 56; i += 1) {
    const t = i / 56;
    const rad = R * 1.06 + i * ringGap;
    const alpha = (1 - t) ** 1.6 * 0.55;
    const path = new Path2D();
    const segs = 4 + (i % 5);
    for (let s = 0; s < segs; s += 1) {
      const a0 = (s / segs) * Math.PI * 2 + ((i * 13) % 7) * 0.08;
      const len = 0.28 + ((i * 5 + s * 3) % 8) * 0.06;
      path.moveTo(Math.cos(a0) * rad, Math.sin(a0) * rad);
      path.arc(0, 0, rad, a0, a0 + len);
    }
    rings.push({
      path,
      color: t < 0.1 ? rgba(tone.inner, 0.45 + alpha) : t < 0.32 ? rgba(tone.mid, alpha) : rgba(tone.outer, alpha * 0.75),
      lineWidth: t < 0.12 ? 1.7 : 1.1,
      speed: 0.00013 / (0.45 + t * 2.6),
      rot0: i * 0.37,
    });
  }
  field = { baked, rings };
  fieldKey = key;
  return field;
}

function place(el, x, y, cx, cy) {
  el.style.transform = `translate3d(${x - cx}px, ${y - cy}px, 0) translate(-50%, -50%)`;
}

let looping = false;

function frame(now) {
  if (document.hidden) {
    looping = false;
    return;
  }
  const { dpr, w, h } = fit();
  const { R, orbit, cx, cy, offsets, mid, speed } = measure(w, h);
  const clock = reduced ? 0 : now;
  const { back, wash, front } = ensureLayers(dpr, w, h, cx, cy, R);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.drawImage(back.canvas, 0, 0, w, h);
  ctx.setTransform(dpr, 0, 0, dpr, cx * dpr, cy * dpr);
  const { baked, rings } = starField(w, h, R);
  for (let i = 0; i < baked.length; i += 1) {
    const star = baked[i];
    const a = star.a + clock * star.speed;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const x = cos * star.rad;
    const y = sin * star.rad;
    if (star.streak) {
      ctx.strokeStyle = star.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - sin * (star.s + star.streak), y + cos * (star.s + star.streak));
      ctx.stroke();
    } else {
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(x, y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.drawImage(wash.canvas, 0, 0, w, h);
  for (let i = 0; i < rings.length; i += 1) {
    const ring = rings[i];
    const rot = clock * ring.speed + ring.rot0;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    ctx.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, cx * dpr, cy * dpr);
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.lineWidth;
    ctx.stroke(ring.path);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.drawImage(front.canvas, 0, 0, w, h);
  const center = clock * speed - Math.PI / 2;
  for (let i = 0; i < badges.length; i += 1) {
    const ang = center + offsets[i] - mid;
    place(badges[i], cx + Math.cos(ang) * orbit, cy + Math.sin(ang) * orbit, cx, cy);
  }
  const markAng = center + Math.PI;
  place(mark, cx + Math.cos(markAng) * orbit, cy + Math.sin(markAng) * orbit, cx, cy);
  if (reduced) {
    looping = false;
    return;
  }
  requestAnimationFrame(frame);
}

function kick() {
  if (looping) return;
  looping = true;
  requestAnimationFrame(frame);
}

document.fonts.ready.then(kick);
motionQuery.addEventListener("change", (event) => {
  reduced = event.matches;
  kick();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) kick();
});
window.addEventListener("resize", () => {
  layoutCache = null;
  if (reduced) kick();
});
