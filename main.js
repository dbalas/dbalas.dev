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

function coreTextRadius(textPad) {
  const box = core.getBoundingClientRect();
  return Math.hypot(box.width, box.height) / 2 + textPad;
}

function fitNarrowCore(R, textPad, hPx, pPx) {
  const minH = 21;
  const minP = 11;
  let steps = 0;
  while (coreTextRadius(textPad) > R + 1 && steps < 48) {
    if (hPx <= minH && pPx <= minP) break;
    hPx = Math.max(minH, hPx * 0.95);
    pPx = Math.max(minP, pPx * 0.95);
    heading.style.fontSize = hPx + "px";
    bio.style.fontSize = pPx + "px";
    steps += 1;
  }
  const textR = coreTextRadius(textPad);
  if (textR > R + 0.5) {
    const scale = R / textR;
    core.style.transform = `translate(-50%, -50%) scale(${scale})`;
  } else {
    core.style.transform = "translate(-50%, -50%)";
  }
}

function measure(w, h) {
  if (layoutCache && layoutCache.w === w && layoutCache.h === h) return layoutCache;
  core.style.transform = "translate(-50%, -50%)";
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
    fitNarrowCore(R, textPad, hPx, pPx);
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

const ART = 96;
const ART_CY = 12;
const SUB = 3;
const PX = 2;
const TURNS = 32;

function pset(g, x, y, v) {
  x |= 0;
  y |= 0;
  if (!v || x < 0 || y < 0 || x >= ART || y >= ART) return;
  g[y * ART + x] = v;
}

function shipPx(g, x, y, v) {
  const X = Math.round(x * SUB);
  const Y = Math.round(y * SUB);
  for (let dy = 0; dy < SUB; dy += 1) {
    for (let dx = 0; dx < SUB; dx += 1) {
      let c = v;
      if (v === 6) c = dx === SUB - 1 && dy === 0 ? 13 : 5;
      else if (v === 8) c = dx === 0 ? 13 : 8;
      else if (v === 5 && dx === SUB - 1 && dy === 0) c = 6;
      else if (v === 1) {
        if (dy === 0) c = 3;
        else if (dy === SUB - 1) c = 16;
        else if ((dx + dy) & 1) c = 10;
      }
      pset(g, X + dx, Y + dy, c);
    }
  }
}

function shipCol(g, x, half, body, trimWing) {
  const X = Math.round(x * SUB);
  const h = Math.max(1, Math.round(Math.min(8, half) * SUB));
  const b = Math.round(Math.min(Math.min(8, half), body) * SUB);
  const cy = ART_CY * SUB;
  for (let dy = -h; dy <= h; dy += 1) {
    const ady = Math.abs(dy);
    const wing = ady > b;
    let v = wing && trimWing ? 4 : 1;
    if (dy <= -h + 1) v = 3;
    else if (dy >= h - 1) v = 16;
    else if (!wing && dy < 0 && ady >= b - 1) v = 14;
    else if (!wing && dy === 0) v = 11;
    else if (!wing && dy < 0) v = (X + dy) & 1 ? 14 : 1;
    else if (v === 1 && dy > 0) v = (X + dy) & 1 ? 15 : 10;
    else if (wing && trimWing && dy > 0 && ((X + dy) & 1)) v = 12;
    pset(g, X, cy + dy, v);
  }
}

function layShip(g, profile, body, trimWing, x0 = 3) {
  for (let i = 0; i < profile.length; i += 1) {
    if (!profile[i]) continue;
    const b = Array.isArray(body) ? body[i] : body;
    const next = i + 1 < profile.length && profile[i + 1] ? profile[i + 1] : profile[i];
    for (let s = 0; s < SUB; s += 1) {
      const t = s / SUB;
      const half = profile[i] + (next - profile[i]) * t;
      if (half < 0.35) continue;
      shipCol(g, x0 + i + t, half, b, trimWing);
    }
  }
  return x0;
}

function shipCanopy(g, x, len) {
  for (let i = 0; i < len; i += 1) {
    shipPx(g, x + i, ART_CY, i === len - 1 ? 6 : 5);
    shipPx(g, x + i, ART_CY - 1, 5);
  }
  shipPx(g, x + len - 1, ART_CY - 1, 6);
}

function shipNozzle(g, x, dy) {
  shipPx(g, x, ART_CY + dy, 7);
  shipPx(g, x, ART_CY - dy, 7);
  shipPx(g, x - 1, ART_CY + dy, 8);
  shipPx(g, x - 2, ART_CY + dy, 8);
  if (!dy) return;
  shipPx(g, x - 1, ART_CY - dy, 8);
  shipPx(g, x - 2, ART_CY - dy, 8);
}

function shipFin(g, x, hullHalf, h) {
  for (let i = 1; i <= h; i += 1) shipPx(g, x, ART_CY - hullHalf - i, i === h ? 3 : 1);
  shipPx(g, x - 1, ART_CY - hullHalf - 1, 1);
  shipPx(g, x + 1, ART_CY - hullHalf - 1, 2);
}

function shipBridge(g, x, hullHalf, h) {
  const top = ART_CY - hullHalf;
  for (let i = 1; i <= h; i += 1) {
    shipPx(g, x, top - i, 1);
    shipPx(g, x + 1, top - i, i === h ? 3 : 1);
  }
  shipPx(g, x, top - h, 5);
  shipPx(g, x + 1, top - h, 6);
}

function shipLights(g, x, dy, n) {
  for (let i = 0; i < n; i += 1) {
    shipPx(g, x + i * 2, ART_CY + dy, 6);
    if (dy) shipPx(g, x + i * 2, ART_CY - dy, 6);
  }
}

function shipStripe(g, x0, x1) {
  const y = ART_CY * SUB;
  const xStart = Math.round(x0 * SUB);
  const xEnd = Math.round(x1 * SUB) + SUB - 1;
  for (let x = xStart; x <= xEnd; x += 1) {
    for (let row = 0; row < SUB; row += 1) {
      const i = (y + row) * ART + x;
      if (i < 0 || i >= g.length) continue;
      if (g[i] === 1 || g[i] === 3 || g[i] === 10 || g[i] === 14 || g[i] === 15) g[i] = 4;
    }
  }
}

function shipPanel(g, x) {
  const X = Math.round(x * SUB);
  for (let y = 0; y < ART; y += 1) {
    for (let col = 0; col < SUB; col += 1) {
      const i = y * ART + X + col;
      if (g[i] === 1 || g[i] === 15) g[i] = 11;
    }
  }
}

function shipGun(g, x, dy) {
  shipPx(g, x, ART_CY + dy, 4);
  shipPx(g, x + 1, ART_CY + dy, 3);
  if (!dy) return;
  shipPx(g, x, ART_CY - dy, 4);
  shipPx(g, x + 1, ART_CY - dy, 3);
}

function paintGlassBar(g, hx, reach) {
  const X = Math.round(hx * SUB);
  for (let dy = -reach + 1; dy <= reach - 1; dy += 1) {
    const Y = (ART_CY + dy) * SUB;
    for (let col = 0; col < SUB; col += 1) {
      for (let row = 0; row < SUB; row += 1) {
        const i = (Y + row) * ART + X + col;
        if (i < 0 || i >= g.length) continue;
        if (g[i] && g[i] !== 7 && g[i] !== 8 && g[i] !== 9 && g[i] !== 13) g[i] = dy === 0 ? 6 : 5;
      }
    }
  }
}

function shipOutline(src) {
  const g = src.slice();
  const at = (x, y) => (x < 0 || y < 0 || x >= ART || y >= ART ? 0 : src[y * ART + x]);
  for (let y = 0; y < ART; y += 1) {
    for (let x = 0; x < ART; x += 1) {
      if (src[y * ART + x]) continue;
      if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) g[y * ART + x] = 9;
    }
  }
  return g;
}

function shipDart(g, v) {
  const profiles = [
    [1, 1, 1, 2, 2, 6, 5, 3, 2, 1, 1, 1, 1, 1],
    [1, 1, 2, 3, 7, 6, 4, 2, 1, 1, 1, 1, 1],
    [1, 2, 5, 6, 4, 2, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 4, 2, 1, 2, 6, 5, 3, 2, 1, 1, 1],
    [1, 1, 2, 2, 4, 7, 6, 4, 2, 1, 1, 1, 1, 1, 1],
  ];
  const x0 = layShip(g, profiles[v], 1, v !== 2);
  shipCanopy(g, x0 + profiles[v].length - 5, 3);
  shipNozzle(g, x0 + 1, 0);
  if (v !== 3) shipNozzle(g, x0 + 2, v === 1 ? 3 : 2);
  if (v === 4) shipGun(g, x0 + profiles[v].length, 2);
  if (v === 0) shipStripe(g, x0 + 4, x0 + 8);
}

function shipFreighter(g, v) {
  const hull = 3 + (v % 2);
  const len = 11 + (v % 3);
  const profile = [];
  for (let i = 0; i < len; i += 1) {
    if (i >= len - 1) profile.push(Math.max(1, hull - 2));
    else if (i >= len - 3) profile.push(hull - 1);
    else profile.push(hull);
  }
  const x0 = layShip(g, profile, hull, false);
  shipBridge(g, x0 + 2, hull, 2 + (v % 2));
  shipNozzle(g, x0 + 1, 0);
  shipNozzle(g, x0 + 1, hull - 1);
  if (v >= 2) shipNozzle(g, x0 + 2, 2);
  shipLights(g, x0 + 4, 0, 3);
  shipPanel(g, x0 + 6);
  if (v === 4) {
    for (let i = 0; i < 4; i += 1) {
      shipPx(g, x0 + 4 + i, ART_CY - hull - 1, i === 0 ? 3 : 4);
      shipPx(g, x0 + 4 + i, ART_CY + hull + 1, i === 0 ? 2 : 4);
    }
  }
  shipStripe(g, x0 + 3, x0 + len - 4);
}

function shipSaucer(g, v) {
  const discs = [
    [1, 2, 3, 4, 4, 4, 3, 2, 1],
    [1, 2, 3, 4, 5, 4, 3, 2, 1],
    [0, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 0],
    [1, 2, 4, 5, 6, 5, 4, 2, 1],
    [1, 3, 4, 5, 5, 5, 4, 3, 1],
  ];
  const profile = discs[v];
  const x0 = 5;
  layShip(g, profile, 99, false, x0);
  for (let i = 0; i < profile.length; i += 1) {
    const half = profile[i];
    if (half > 1 && i % 2 === 0) {
      shipPx(g, x0 + i, ART_CY - half, 6);
      shipPx(g, x0 + i, ART_CY + half, 4);
    }
  }
  const mid = x0 + ((profile.length / 2) | 0);
  shipPx(g, mid, ART_CY, 5);
  shipPx(g, mid + 1, ART_CY, 6);
  shipPx(g, mid, ART_CY - 1, 5);
  shipPx(g, mid + 1, ART_CY - 1, 6);
  if (v % 2 === 0) {
    shipPx(g, mid, ART_CY - 2, 5);
    shipPx(g, mid + 1, ART_CY - 2, 3);
  }
  shipNozzle(g, x0 + 1, 0);
  if (v === 3) shipNozzle(g, x0 + 2, 3);
}

function shipNeedle(g, v) {
  const len = 13 + (v % 3);
  const profile = [];
  for (let i = 0; i < len; i += 1) {
    if (i === len - 1) profile.push(1);
    else if (v === 1 && i > 2 && i < 6) profile.push(3);
    else if (v === 2 && i > len - 7 && i < len - 3) profile.push(3);
    else if (v === 4 && (i === 4 || i === 5)) profile.push(4);
    else if (v === 3 && i > 3 && i < 8) profile.push(2);
    else profile.push(1);
  }
  const x0 = layShip(g, profile, 1, v === 4 || v === 2);
  shipCanopy(g, x0 + len - 4, 2);
  shipNozzle(g, x0 + 1, 0);
  if (v === 0 || v === 3) shipNozzle(g, x0 + 2, 0);
  shipPx(g, x0 + len, ART_CY, 4);
  shipPx(g, x0 + len + 1, ART_CY, 3);
  if (v === 1) shipGun(g, x0 + 5, 3);
}

function shipBomber(g, v) {
  const profiles = [
    [2, 3, 3, 4, 6, 5, 4, 3, 3, 2, 2, 1],
    [2, 3, 4, 4, 5, 7, 6, 4, 3, 2, 2, 1, 1],
    [1, 2, 3, 5, 6, 5, 3, 3, 2, 2, 1, 1],
    [2, 3, 3, 3, 4, 6, 6, 4, 3, 2, 2, 2, 1],
    [2, 2, 3, 5, 4, 3, 3, 5, 6, 4, 2, 2, 1],
  ];
  const bodies = [
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  ];
  const x0 = layShip(g, profiles[v], bodies[v], true);
  shipCanopy(g, x0 + profiles[v].length - 5, 3);
  shipNozzle(g, x0 + 1, 0);
  shipNozzle(g, x0 + 1, 2);
  if (v !== 2) shipStripe(g, x0 + 3, x0 + 7);
  if (v === 4) shipGun(g, x0 + profiles[v].length, 3);
}

function shipInterceptor(g, v) {
  const nacelle = 3 + (v % 3);
  const len = 12 + (v % 2);
  const profile = [];
  const body = [];
  for (let i = 0; i < len; i += 1) {
    profile.push(i < 3 ? nacelle : 1);
    body.push(1);
  }
  if (v === 3) {
    profile[5] = 4;
    profile[6] = 5;
    profile[7] = 3;
  }
  if (v === 4) {
    profile[len - 5] = 3;
    profile[len - 4] = 4;
    profile[len - 3] = 2;
  }
  const x0 = layShip(g, profile, body, v >= 3);
  shipCanopy(g, x0 + len - 4, 2);
  shipNozzle(g, x0, 0);
  shipNozzle(g, x0, nacelle - 1);
  if (v % 2 === 0) shipNozzle(g, x0 + 1, Math.max(1, nacelle - 2));
  shipPx(g, x0 + len, ART_CY, 3);
}

function shipShuttle(g, v) {
  const profiles = [
    [1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1, 1],
    [1, 2, 3, 3, 4, 4, 3, 2, 2, 1, 1],
    [2, 2, 3, 3, 3, 3, 2, 2, 2, 1, 1, 1, 1],
    [1, 2, 2, 3, 4, 4, 4, 3, 2, 1, 1, 1],
    [1, 1, 2, 3, 3, 4, 3, 3, 2, 2, 1, 1, 1],
  ];
  const x0 = layShip(g, profiles[v], 99, false);
  shipFin(g, x0 + 2, profiles[v][2] || 2, 2 + (v % 3));
  shipCanopy(g, x0 + profiles[v].length - 5, 3);
  shipNozzle(g, x0 + 1, 0);
  if (v >= 2) shipNozzle(g, x0 + 2, 2);
  if (v === 1 || v === 4) shipStripe(g, x0 + 3, x0 + 7);
  shipLights(g, x0 + 4, v === 0 ? 2 : 1, 2);
}

function shipBiplane(g, v) {
  const profiles = [
    [1, 1, 4, 5, 2, 1, 1, 5, 6, 3, 1, 1, 1],
    [1, 2, 5, 6, 3, 1, 1, 1, 4, 5, 2, 1, 1],
    [1, 1, 1, 3, 5, 4, 1, 1, 3, 6, 5, 2, 1, 1],
    [1, 3, 5, 4, 2, 1, 4, 6, 5, 2, 1, 1, 1, 1],
    [1, 1, 5, 6, 2, 1, 1, 2, 6, 5, 2, 1, 1],
  ];
  const x0 = layShip(g, profiles[v], 1, true);
  shipCanopy(g, x0 + profiles[v].length - 4, 2);
  shipNozzle(g, x0 + 1, 0);
  shipNozzle(g, x0 + 1, 2);
  if (v !== 1) shipGun(g, x0 + profiles[v].length, 0);
}

function shipRing(g, v) {
  const cx = 12;
  const r = 5 + (v > 2 ? 1 : 0);
  const inner = r - 2 - (v === 4 ? 1 : 0);
  for (let y = -r - 1; y <= r + 1; y += 1) {
    for (let x = -r - 1; x <= r + 1; x += 1) {
      const d = Math.hypot(x, y);
      if (d > r + 0.45 || d < inner - 0.2) continue;
      let col = 1;
      if (y < 0 && d > r - 0.9) col = 3;
      else if (y > 0 && d > r - 0.9) col = 2;
      else if (d < inner + 0.9) col = 2;
      shipPx(g, cx + x, ART_CY + y, col);
    }
  }
  shipPx(g, cx + 1, ART_CY, 5);
  shipPx(g, cx + 2, ART_CY, 6);
  shipPx(g, cx + 1, ART_CY - 1, 5);
  shipNozzle(g, cx - r, 0);
  if (v % 2 === 0) {
    shipPx(g, cx, ART_CY - r - 1, 4);
    shipPx(g, cx, ART_CY + r + 1, 4);
    shipPx(g, cx + 1, ART_CY - r - 1, 6);
  }
  if (v === 1 || v === 3) {
    shipPx(g, cx + r, ART_CY, 4);
    shipPx(g, cx + r + 1, ART_CY, 3);
    shipPx(g, cx + r, ART_CY - 1, 1);
    shipPx(g, cx + r, ART_CY + 1, 2);
  }
}

function shipHammer(g, v) {
  const necks = [
    [1, 1, 1, 1, 1, 1, 2, 5, 6, 5, 2],
    [1, 1, 2, 1, 1, 1, 1, 3, 6, 7, 6, 3],
    [1, 1, 1, 1, 1, 2, 2, 4, 6, 6, 4, 2],
    [2, 2, 1, 1, 1, 1, 1, 2, 5, 7, 6, 4],
    [1, 1, 1, 2, 1, 1, 3, 4, 6, 7, 5, 3, 1],
  ];
  const profile = necks[v];
  const x0 = layShip(g, profile, 99, false);
  const len = profile.length;
  shipCanopy(g, x0 + len - 5, 3);
  const hx = x0 + len - 4;
  const reach = profile[Math.max(0, len - 3)];
  paintGlassBar(g, hx, reach);
  shipNozzle(g, x0 + 1, 0);
  if (v >= 2) shipNozzle(g, x0 + 1, 1);
  if (v === 0 || v === 3) shipStripe(g, x0 + 2, x0 + 5);
  if (v === 4) shipGun(g, x0 + len, 2);
}


const shipBuilders = [shipDart, shipFreighter, shipSaucer, shipNeedle, shipBomber, shipInterceptor, shipShuttle, shipBiplane, shipRing, shipHammer];

function packShip(src) {
  const outlined = shipOutline(src);
  let minX = ART;
  let minY = ART;
  let maxX = -1;
  let maxY = -1;
  const flames = [];
  for (let y = 0; y < ART; y += 1) {
    for (let x = 0; x < ART; x += 1) {
      const v = outlined[y * ART + x];
      if (!v) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (v === 8 || v === 13) flames.push({ x, y });
    }
  }
  const w = Math.max(1, maxX - minX + 1);
  const h = Math.max(1, maxY - minY + 1);
  const idx = new Uint8Array(w * h);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) idx[(y - minY) * w + (x - minX)] = outlined[y * ART + x];
  }
  const tips = [];
  for (let i = 0; i < flames.length; i += 1) {
    const f = flames[i];
    let behind = false;
    for (let j = 0; j < flames.length; j += 1) {
      const o = flames[j];
      if (o.x < f.x && f.x - o.x <= 4 && Math.abs(o.y - f.y) <= 3) behind = true;
    }
    if (behind) continue;
    const ex = f.x - minX + 0.5 - w / 2;
    const ey = f.y - minY + 0.5 - h / 2;
    if (tips.some((tip) => Math.hypot(tip[0] - ex, tip[1] - ey) < 3)) continue;
    tips.push([ex, ey]);
  }
  if (!tips.length) tips.push([2 - w / 2, 0]);
  if (tips.length > 3) tips.length = 3;
  return { idx, w, h, engines: tips, reach: Math.hypot(w, h) * 0.5 };
}

function buildShape(id) {
  const g = new Uint8Array(ART * ART);
  shipBuilders[id % 10](g, (id / 10) | 0);
  return packShip(g);
}

const SHAPES = Array.from({ length: 50 }, (_, id) => buildShape(id));

const UNIT = 40;
const PARTS = 96;
const chromeEls = [...orbiters, spin];

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgbCss(c) {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const HULLS = [
  "#e23d3d", "#ff6b3d", "#f0a202", "#e2c84a", "#b6e34a", "#3ecf7a", "#1aae9f", "#3ec6e0",
  "#3d7eff", "#6a5cff", "#b45cff", "#e85cff", "#ff5c93", "#f4f0e6", "#c5ccd6", "#8d97a6",
  "#d98a4a", "#e7c39a", "#7dffc3", "#9ad1ff", "#ffb3c7", "#ff4d6d", "#c1121f", "#7a1f2b",
  "#2d6a4f", "#1d3557", "#e9c46a", "#f4a261", "#e76f51", "#2a9d8f", "#1d4e5f", "#8ecae6",
  "#fb8500", "#e6c229", "#80b918", "#2f9e44", "#00a6c4", "#0077b6", "#7209b7", "#f72585",
  "#4cc9f0", "#f7f7f2", "#9aa0a6", "#6c584c", "#b08968", "#bc6c25", "#606c38", "#24301c",
  "#9b2226", "#d8572a",
];

function paintOf(hex) {
  const base = hexRgb(hex);
  const [h, s] = rgbToHsl(base[0], base[1], base[2]);
  const sat = Math.max(0.42, Math.min(0.78, s));
  const warm = h > 18 && h < 58;
  const glassH = warm ? 198 : 198;
  const paint = [];
  paint[1] = hslToRgb(h, sat, 0.48);
  paint[2] = hslToRgb(h, sat * 0.85, 0.24);
  paint[3] = hslToRgb(h, sat * 0.65, 0.72);
  paint[4] = hslToRgb(h + 150, Math.min(0.85, Math.max(0.4, s)), 0.58);
  paint[5] = hslToRgb(glassH, 0.62, 0.62);
  paint[6] = [255, 255, 255];
  paint[7] = [20, 16, 28];
  paint[8] = [255, 146, 36];
  paint[9] = hslToRgb(h, sat * 0.45, 0.08);
  paint[10] = hslToRgb(h, sat, 0.36);
  paint[11] = hslToRgb(h, sat * 0.55, 0.3);
  paint[12] = hslToRgb(h + 150, 0.5, 0.34);
  paint[13] = [255, 236, 206];
  paint[14] = hslToRgb(h, sat * 0.75, 0.6);
  paint[15] = hslToRgb(h, sat * 0.9, 0.34);
  paint[16] = hslToRgb(h, sat * 0.8, 0.16);
  paint.flame = rgbCss(paint[8]);
  paint.glass = rgbCss(paint[6]);
  paint.hot = rgbCss(paint[13]);
  return paint;
}

const PAINTS = HULLS.map(paintOf);

function mulberry32(a) {
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EX = 48;
const EX_FRAMES = 6;
const FIRE = [null, [255, 250, 236], [255, 210, 74], [255, 132, 28], [255, 64, 22], [148, 26, 16]];

function boomPlot(g, x, y, v) {
  if (x < 0 || y < 0 || x >= EX || y >= EX || !v) return;
  const i = y * EX + x;
  if (!g[i] || v < g[i]) g[i] = v;
}

function makeBoom(seed) {
  const rand = mulberry32(seed * 997 + 13);
  const spikes = [];
  const turn = (seed % 12) * 0.05;
  for (let i = 0; i < 8; i += 1) {
    spikes.push({
      a: (i / 8) * Math.PI * 2 + turn + (rand() - 0.5) * 0.4,
      len: 12 + ((seed + i * 3) % 5) + (i === seed % 8 ? 3 : 0),
      fat: (i + seed) % 3 !== 0,
    });
  }
  const notch = seed % 8;
  const frames = [];
  const cx = 24;
  for (let f = 0; f < EX_FRAMES; f += 1) {
    const g = new Uint8Array(EX * EX);
    const coreR = [5, 3, 2, 1, 0, 0][f];
    if (coreR > 1) {
      for (let y = -coreR; y <= coreR; y += 1) {
        for (let x = -coreR; x <= coreR; x += 1) {
          if (x * x + y * y <= coreR * coreR + coreR) boomPlot(g, cx + x, cx + y, f === 0 ? 1 : 2);
        }
      }
    }
    const reach = [0, 8, 13, 17, 19, 21][f];
    for (let s = 0; s < spikes.length; s += 1) {
      const sp = spikes[s];
      const end = Math.min(sp.len, reach);
      let start = 0;
      if (f === 3) start = 4;
      else if (f >= 4) start = Math.min(end, 7 + (f - 4) * 4);
      for (let r = start; r <= end; r += 1) {
        if (r <= 0) continue;
        if (s === notch && r === end - 1 && f > 0) continue;
        const x = Math.round(cx + Math.cos(sp.a) * r);
        const y = Math.round(cx + Math.sin(sp.a) * r);
        const t = r / sp.len;
        let col = t < 0.22 ? 2 : t < 0.48 ? 3 : t < 0.72 ? 4 : 5;
        if (r < 4 && f < 3) col = 1;
        boomPlot(g, x, y, col);
        if (sp.fat && r > 3 && r < end) boomPlot(g, x + (Math.abs(Math.sin(sp.a)) > 0.45 ? 1 : 0), y + (Math.abs(Math.cos(sp.a)) > 0.45 ? 1 : 0), col);
      }
    }
    frames.push(g);
  }
  return { spikes, frames };
}

const BOOMS = [];
const boomAtlas = document.createElement("canvas");
boomAtlas.width = EX * EX_FRAMES;
boomAtlas.height = EX * 50;
{
  const ictx = boomAtlas.getContext("2d");
  const img = ictx.createImageData(boomAtlas.width, boomAtlas.height);
  const data = img.data;
  for (let seed = 0; seed < 50; seed += 1) {
    const spec = makeBoom(seed);
    BOOMS.push(spec.spikes);
    for (let f = 0; f < EX_FRAMES; f += 1) {
      const cell = spec.frames[f];
      const ox = f * EX;
      const oy = seed * EX;
      for (let y = 0; y < EX; y += 1) {
        for (let x = 0; x < EX; x += 1) {
          const v = cell[y * EX + x];
          if (!v) continue;
          const c = FIRE[v];
          const o = ((oy + y) * boomAtlas.width + ox + x) * 4;
          data[o] = c[0];
          data[o + 1] = c[1];
          data[o + 2] = c[2];
          data[o + 3] = 255;
        }
      }
    }
  }
  ictx.putImageData(img, 0, 0);
}

let aim = null;
let hovered = null;
const ships = [];
const bursts = [];
const parts = Array.from({ length: PARTS }, () => ({
  life: 0,
  max: 1,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  rgb: "#fff",
  front: 0,
}));
let partCursor = 0;

function emitPart(x, y, vx, vy, life, rgb, front) {
  for (let n = 0; n < PARTS; n += 1) {
    partCursor = (partCursor + 1) % PARTS;
    const p = parts[partCursor];
    if (p.life > 0) continue;
    p.life = life;
    p.max = life;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.rgb = rgb;
    p.front = front;
    return;
  }
}

function stepParts(dt) {
  const drag = Math.max(0, 1 - dt * 1.4);
  for (let i = 0; i < PARTS; i += 1) {
    const p = parts[i];
    if (p.life <= 0) continue;
    p.life -= dt;
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

function drawParts(ctx, front, dpr) {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let i = 0; i < PARTS; i += 1) {
    const p = parts[i];
    if (p.life <= 0 || p.front !== front) continue;
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.rgb;
    ctx.fillRect(Math.round(p.x / PX) * PX, Math.round(p.y / PX) * PX, PX, PX);
  }
  ctx.restore();
}

function fleetTarget(w, h) {
  const m = Math.min(w, h);
  const base = m < 680 ? 4 : m < 960 ? 6 : 8;
  return Math.round(base * 1.5);
}

function pickSide(except) {
  let left = 0;
  let right = 0;
  for (let i = 0; i < ships.length; i += 1) {
    const ship = ships[i];
    if (ship === except || ship.parked) continue;
    if (ship.side < 0) left += 1;
    else right += 1;
  }
  if (left > right + 1) return 1;
  if (right > left + 1) return -1;
  return Math.random() < 0.5 ? -1 : 1;
}

function maxScale(world) {
  const m = Math.min(world.w, world.h);
  if (m < 520) return 1.2;
  if (m < 800) return 1.4;
  return 1.65;
}

function fleetWorld(w, h, cx, cy, orbit) {
  return { w, h, cx, cy, margin: 18, exclusion: orbit + 58 };
}

function ringRadii(ship, world) {
  const inner = world.exclusion + ship.reach * 0.58;
  const outer =
    Math.min(world.cx, world.cy, world.w - world.cx, world.h - world.cy) - world.margin - ship.reach * 0.32;
  return { inner, outer };
}

function fitsRing(ship, world) {
  const { inner, outer } = ringRadii(ship, world);
  return outer > inner + 48;
}

function anchorShip(ship, world) {
  const { k, n } = sideSlot(ship);
  const margin = 64;
  ship.homeY = margin + ((k + 0.5) / n) * Math.max(80, world.h - margin * 2);
}

function laneHeading(ship, world) {
  const gutter = world.margin + ship.reach * 0.45;
  const onLeft = ship.side < 0;
  const leftMax = world.cx - world.exclusion - 20;
  const rightMin = world.cx + world.exclusion + 20;
  const laneX = onLeft ? (gutter + Math.max(gutter + 24, leftMax)) / 2 : (Math.min(world.w - gutter - 24, rightMin) + (world.w - gutter)) / 2;
  const home = ship.homeY || world.h * 0.5;
  const band = 52;
  let vertical = Math.sin(ship.heading) >= 0 ? Math.PI / 2 : -Math.PI / 2;
  if (ship.y < home - band || ship.y < gutter) vertical = Math.PI / 2;
  else if (ship.y > home + band || ship.y > world.h - gutter) vertical = -Math.PI / 2;
  else vertical += ship.wander || 0;
  const xErr = ship.x - laneX;
  const crossed = onLeft ? ship.x > world.cx - 40 : ship.x < world.cx + 40;
  if (crossed || Math.abs(xErr) > 28) {
    return {
      angle: mixAng(vertical, xErr > 0 ? Math.PI : 0, crossed ? 0.82 : Math.min(0.62, Math.abs(xErr) / 180)),
      hot: true,
    };
  }
  return { angle: vertical, hot: Math.abs(ship.y - home) > band * 0.75 };
}

function mixAng(a, b, t) {
  return Math.atan2(Math.sin(a) * (1 - t) + Math.sin(b) * t, Math.cos(a) * (1 - t) + Math.cos(b) * t);
}

function turnToward(ship, target, dt, rate) {
  const delta = Math.atan2(Math.sin(target - ship.heading), Math.cos(target - ship.heading));
  const max = rate * dt;
  ship.heading += Math.max(-max, Math.min(max, delta));
}

function chromeBlocks() {
  const blocks = [];
  for (let i = 0; i < chromeEls.length; i += 1) blocks.push(chromeEls[i].getBoundingClientRect());
  return blocks;
}

function pointInside(world, x, y, reach) {
  if (Math.hypot(x - world.cx, y - world.cy) < world.exclusion + reach * 0.45) return false;
  const m = world.margin + reach * 0.2;
  if (x < m || y < m || x > world.w - m || y > world.h - m) return false;
  if (x > world.w - 86 && y < 72) return false;
  return true;
}

function pairGap(a, b) {
  return (a.reach + b.reach) * 0.7 + 26;
}

function clearOf(p, reach, self) {
  for (let i = 0; i < ships.length; i += 1) {
    const s = ships[i];
    if (!s.alive || s === self) continue;
    if (Math.hypot(s.x - p.x, s.y - p.y) < (s.reach + reach) * 0.7 + 26) return false;
  }
  return true;
}

function randomPoint(world, reach) {
  for (let n = 0; n < 24; n += 1) {
    const x = world.margin + Math.random() * (world.w - world.margin * 2);
    const y = world.margin + Math.random() * (world.h - world.margin * 2);
    if (pointInside(world, x, y, reach)) return { x, y };
  }
  return {
    x: world.margin + reach,
    y: world.h * 0.5,
  };
}

function entryPoint(world, reach) {
  for (let n = 0; n < 16; n += 1) {
    const side = (Math.random() * 4) | 0;
    let x = world.margin + reach * 0.35;
    let y = world.margin + reach * 0.35;
    if (side === 1) x = world.w - x;
    if (side === 2) x = world.margin + Math.random() * (world.w - world.margin * 2);
    if (side === 3) {
      x = world.margin + Math.random() * (world.w - world.margin * 2);
      y = world.h - y;
    } else if (side < 2) y = world.margin + Math.random() * (world.h - world.margin * 2);
    if (!pointInside(world, x, y, reach)) continue;
    if (aim && Math.hypot(x - aim.x, y - aim.y) < 90) continue;
    return { x, y };
  }
  return randomPoint(world, reach);
}

function safePoint(world, ship) {
  for (let n = 0; n < 28; n += 1) {
    const p = randomPoint(world, ship.reach);
    const far = !aim || Math.hypot(p.x - aim.x, p.y - aim.y) > 90;
    if (far && clearOf(p, ship.reach, ship)) return p;
  }
  return randomPoint(world, ship.reach);
}

function blankShip() {
  return {
    alive: false,
    parked: false,
    x: 0,
    y: 0,
    heading: 0,
    speed: 28,
    phase: 0,
    scale: 1,
    reach: UNIT,
    bandT: 0.5,
    shape: 0,
    color: 0,
    exhaust: 0,
    respawnAt: 0,
    avoiding: false,
    side: -1,
    entering: false,
  };
}

function rerollShip(ship, world) {
  let shape = (Math.random() * 50) | 0;
  let color = (Math.random() * 50) | 0;
  for (let n = 0; n < 8; n += 1) {
    let clash = false;
    for (let i = 0; i < ships.length; i += 1) {
      const other = ships[i];
      if (other !== ship && other.alive && other.shape === shape && other.color === color) clash = true;
    }
    if (!clash) break;
    shape = (Math.random() * 50) | 0;
    color = (Math.random() * 50) | 0;
  }
  ship.shape = shape;
  ship.color = color;
  ship.scale = 0.85 + Math.random() * (maxScale(world) - 0.85);
  ship.reach = SHAPES[shape].reach * PX * ship.scale;
  ship.speed = (18 + Math.random() * 22) / Math.pow(ship.scale, 0.35);
  ship.wander = (Math.random() - 0.5) * 0.85;
  ship.bandT = 0.18 + Math.random() * 0.74;
  ship.phase = Math.random() * Math.PI * 2;
}

function sideSlot(ship) {
  let n = 0;
  let k = 0;
  for (let i = 0; i < ships.length; i += 1) {
    const other = ships[i];
    if (other.parked || other.side !== ship.side) continue;
    if (other === ship) k = n;
    n += 1;
  }
  return { k, n: Math.max(1, n) };
}

let lastEntry = -1e9;

function dropShip(ship, world, now) {
  if (now - lastEntry < 1100) {
    ship.respawnAt = now + 700 + Math.random() * 1700;
    return;
  }
  rerollShip(ship, world);
  ship.side = pickSide(ship);
  const margin = 64;
  const span = Math.max(80, world.h - margin * 2);
  let y = margin + Math.random() * span;
  for (let n = 0; n < 12; n += 1) {
    const tryY = margin + Math.random() * span;
    let crowded = false;
    for (let i = 0; i < ships.length; i += 1) {
      const other = ships[i];
      if (!other.alive || other.side !== ship.side) continue;
      if (Math.abs(other.y - tryY) < 72) crowded = true;
    }
    y = tryY;
    if (!crowded) break;
  }
  ship.homeY = y;
  ship.y = y + (Math.random() - 0.5) * 36;
  const slip = Math.random() * 48;
  ship.x = ship.side < 0 ? -ship.reach - slip : world.w + ship.reach + slip;
  const inward = ship.side < 0 ? 0 : Math.PI;
  ship.enterAim = inward + (Math.random() - 0.5) * 1.35;
  ship.heading = ship.enterAim;
  ship.entering = true;
  ship.alive = true;
  ship.parked = false;
  ship.exhaust = Math.random() * 0.08;
  ship.respawnAt = 0;
  ship.avoiding = false;
  ship.bucket = -1;
  lastEntry = now;
}

function ensureFleet(world, now) {
  const want = fleetTarget(world.w, world.h);
  while (ships.length < want) {
    const ship = blankShip();
    ship.side = pickSide(null);
    ship.alive = false;
    ship.respawnAt = now + 250 + Math.random() * 4800;
    ships.push(ship);
  }
  for (let i = 0; i < ships.length; i += 1) {
    const ship = ships[i];
    if (i >= want) {
      ship.alive = false;
      ship.parked = true;
      continue;
    }
    if (ship.parked) {
      ship.parked = false;
      ship.alive = false;
      ship.side = pickSide(ship);
      ship.respawnAt = now + 400 + Math.random() * 3600;
    }
  }
}

function desiredHeading(ship, world, blocks) {
  if (ship.entering) return { angle: ship.enterAim, hot: false };
  const dx = ship.x - world.cx;
  const dy = ship.y - world.cy;
  const dist = Math.hypot(dx, dy) || 1;
  const out = Math.atan2(dy, dx);
  let coast = out + Math.PI / 2 + Math.sin(ship.phase) * 0.08;
  const { inner, outer } = ringRadii(ship, world);
  if (dist < inner) return { angle: mixAng(coast, out, 0.84), hot: true };
  if (ship.side) {
    const lane = laneHeading(ship, world);
    let away = null;
    let nd = Infinity;
    for (let i = 0; i < ships.length; i += 1) {
      const other = ships[i];
      if (!other.alive || other === ship) continue;
      const d = Math.hypot(ship.x - other.x, ship.y - other.y);
      if (d < pairGap(ship, other) && d < nd) {
        nd = d;
        away = Math.atan2(ship.y - other.y, ship.x - other.x);
      }
    }
    if (away !== null) return { angle: mixAng(lane.angle, away, 0.5), hot: true };
    return lane;
  }

  const pad = world.margin + ship.reach * 0.5;
  let edge = null;
  let pen = 0;
  if (ship.x < pad) {
    const p = pad - ship.x;
    if (p > pen) {
      pen = p;
      edge = mixAng(-Math.PI / 2, 0, 0.42);
    }
  }
  if (ship.x > world.w - pad) {
    const p = ship.x - (world.w - pad);
    if (p > pen) {
      pen = p;
      edge = mixAng(Math.PI / 2, Math.PI, 0.42);
    }
  }
  if (ship.y < pad) {
    const p = pad - ship.y;
    if (p > pen) {
      pen = p;
      edge = mixAng(0, Math.PI / 2, 0.42);
    }
  }
  if (ship.y > world.h - pad) {
    const p = ship.y - (world.h - pad);
    if (p > pen) {
      pen = p;
      edge = mixAng(Math.PI, -Math.PI / 2, 0.42);
    }
  }
  if (edge !== null) return { angle: mixAng(coast, edge, 0.7), hot: true };

  const bleed = 6 + ship.reach * 0.12;
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    const left = b.left - bleed;
    const right = b.right + bleed;
    const top = b.top - bleed;
    const bottom = b.bottom + bleed;
    if (ship.x < left || ship.x > right || ship.y < top || ship.y > bottom) continue;
    const options = [
      [ship.x - left, Math.PI],
      [right - ship.x, 0],
      [ship.y - top, -Math.PI / 2],
      [bottom - ship.y, Math.PI / 2],
    ];
    let best = options[0];
    for (let k = 1; k < 4; k += 1) if (options[k][0] < best[0]) best = options[k];
    return { angle: best[1], hot: true };
  }

  let away = null;
  let nd = Infinity;
  for (let i = 0; i < ships.length; i += 1) {
    const other = ships[i];
    if (!other.alive || other === ship) continue;
    const ox = ship.x - other.x;
    const oy = ship.y - other.y;
    const d = Math.hypot(ox, oy);
    if (d < pairGap(ship, other) && d < nd) {
      nd = d;
      away = Math.atan2(oy, ox);
    }
  }
  if (away !== null) return { angle: mixAng(coast, away, 0.62), hot: true };

  if (outer > inner + 36) {
    const want = inner + (outer - inner) * ship.bandT;
    const err = dist - want;
    if (Math.abs(err) > 20) {
      const pull = Math.max(-1, Math.min(1, err / 140));
      coast = mixAng(coast, pull > 0 ? out + Math.PI : out, Math.min(0.4, Math.abs(pull) * 0.4));
    }
  }
  return { angle: coast, hot: false };
}

function containShip(ship, world) {
  const dx = ship.x - world.cx;
  const dy = ship.y - world.cy;
  const dist = Math.hypot(dx, dy) || 1;
  const pad = world.margin + ship.reach * 0.55;
  if (ship.entering) {
    const arrived = ship.side < 0 ? ship.x > pad : ship.x < world.w - pad;
    if (arrived) ship.entering = false;
  }
  const edge = 8;
  if (ship.y < edge) ship.y = edge;
  else if (ship.y > world.h - edge) ship.y = world.h - edge;
  if (ship.entering) return;
  const limit = world.exclusion + ship.reach * 0.28;
  if (dist < limit) {
    const push = Math.min(limit - dist, 2);
    ship.x += (dx / dist) * push;
    ship.y += (dy / dist) * push;
  }
  if (ship.x < edge) ship.x = edge;
  else if (ship.x > world.w - edge) ship.x = world.w - edge;
}

function stepShip(ship, dt, world, blocks) {
  const steer = desiredHeading(ship, world, blocks);
  ship.avoiding = steer.hot;
  const rate = (steer.hot ? 1.15 : 0.62) / Math.pow(ship.scale, 0.32);
  turnToward(ship, steer.angle, dt, rate);
  ship.x += Math.cos(ship.heading) * ship.speed * dt;
  ship.y += Math.sin(ship.heading) * ship.speed * dt;
  ship.phase += dt * 0.22;
  if (ship.phase > 80) ship.phase -= 80;
  containShip(ship, world);
}

function separateShips(dt) {
  const step = Math.min(80 * dt, 5);
  for (let i = 0; i < ships.length; i += 1) {
    const a = ships[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < ships.length; j += 1) {
      const b = ships[j];
      if (!b.alive || a.entering || b.entering) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.001;
      const need = pairGap(a, b);
      if (d >= need) continue;
      const push = Math.min(step, (need - d) * 0.45);
      dx /= d;
      dy /= d;
      a.x -= dx * push;
      a.y -= dy * push;
      b.x += dx * push;
      b.y += dy * push;
    }
  }
}

const paintCache = new Map();

function paintedShip(shape, color, hot) {
  const key = shape * 100 + color + (hot ? 50 : 0);
  const cached = paintCache.get(key);
  if (cached) return cached;
  const src = SHAPES[shape];
  const pal = PAINTS[color];
  const img = new ImageData(src.w, src.h);
  const d = img.data;
  for (let i = 0; i < src.idx.length; i += 1) {
    const idx = src.idx[i];
    if (!idx) continue;
    const c = idx === 9 && hot ? [255, 255, 255] : pal[idx];
    if (!c) continue;
    const o = i * 4;
    d[o] = c[0];
    d[o + 1] = c[1];
    d[o + 2] = c[2];
    d[o + 3] = 255;
  }
  paintCache.set(key, img);
  return img;
}

function rotateShip(src, angle, ship) {
  const w = src.width;
  const h = src.height;
  const c = Math.ceil(Math.hypot(w, h));
  if (!ship.canvas) ship.canvas = document.createElement("canvas");
  if (ship.canvas.width !== c || ship.canvas.height !== c) {
    ship.canvas.width = c;
    ship.canvas.height = c;
    ship.scratch = null;
  }
  if (!ship.rctx) ship.rctx = ship.canvas.getContext("2d");
  if (!ship.scratch || ship.scratch.width !== c) ship.scratch = ship.rctx.createImageData(c, c);
  const data = ship.scratch.data;
  data.fill(0);
  if (!ship.mask || ship.mask.length !== c * c) ship.mask = new Uint8Array(c * c);
  else ship.mask.fill(0);
  const mask = ship.mask;
  const sd = src.data;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const ox = c * 0.5;
  const oy = c * 0.5;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let y = 0; y < c; y += 1) {
    for (let x = 0; x < c; x += 1) {
      const dx = x - ox + 0.5;
      const dy = y - oy + 0.5;
      const sx = cos * dx + sin * dy + cx;
      const sy = -sin * dx + cos * dy + cy;
      const ix = sx | 0;
      const iy = sy | 0;
      if (ix < 0 || iy < 0 || ix >= w || iy >= h) continue;
      const si = (iy * w + ix) * 4;
      if (!sd[si + 3]) continue;
      const di = (y * c + x) * 4;
      data[di] = sd[si];
      data[di + 1] = sd[si + 1];
      data[di + 2] = sd[si + 2];
      data[di + 3] = 255;
      mask[y * c + x] = 1;
    }
  }
  for (let y = 1; y < c - 1; y += 1) {
    for (let x = 1; x < c - 1; x += 1) {
      const i = y * c + x;
      if (mask[i]) continue;
      const n = [i - 1, i + 1, i - c, i + c];
      let count = 0;
      let srcI = -1;
      for (let k = 0; k < 4; k += 1) {
        if (!mask[n[k]]) continue;
        count += 1;
        if (srcI < 0) srcI = n[k];
      }
      if (count >= 3 && srcI >= 0) {
        const o = i * 4;
        const s = srcI * 4;
        data[o] = data[s];
        data[o + 1] = data[s + 1];
        data[o + 2] = data[s + 2];
        data[o + 3] = 255;
      }
    }
  }
  ship.rctx.putImageData(ship.scratch, 0, 0);
  return ship.canvas;
}

function quanta(heading) {
  const bucket = Math.round((heading / (Math.PI * 2)) * TURNS);
  const b = ((bucket % TURNS) + TURNS) % TURNS;
  return { b, angle: (b / TURNS) * Math.PI * 2 };
}

function syncSprite(ship, hot) {
  const q = quanta(ship.heading);
  const key = ship.shape * 100 + ship.color + (hot ? 50 : 0);
  if (ship.bucket === q.b && ship.spriteKey === key && ship.canvas) return q;
  ship.bucket = q.b;
  ship.spriteKey = key;
  rotateShip(paintedShip(ship.shape, ship.color, hot), q.angle, ship);
  return q;
}

function stepExhaust(ship, dt, hot) {
  if (!dt) return;
  ship.exhaust += dt;
  const rate = hot ? 0.07 : 0.14;
  const ang = quanta(ship.heading).angle;
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const u = PX * ship.scale;
  const engines = SHAPES[ship.shape].engines;
  const paint = PAINTS[ship.color];
  let spins = 0;
  while (ship.exhaust >= rate && spins < 2) {
    ship.exhaust -= rate;
    spins += 1;
    for (let i = 0; i < engines.length; i += 1) {
      const e = engines[i];
      const jitter = (Math.random() - 0.5) * 10;
      emitPart(
        ship.x + (e[0] * cos - e[1] * sin) * u,
        ship.y + (e[0] * sin + e[1] * cos) * u,
        -cos * (34 + Math.random() * 18) - sin * jitter,
        -sin * (34 + Math.random() * 18) + cos * jitter,
        0.28 + Math.random() * 0.16,
        Math.random() < 0.35 ? paint.glass : paint.flame,
        0,
      );
    }
  }
}

function drawShip(ctx, ship, dpr, hot) {
  syncSprite(ship, hot);
  const px = PX * ship.scale;
  const dw = ship.canvas.width * px;
  const dh = ship.canvas.height * px;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ship.canvas, Math.round(ship.x - dw / 2), Math.round(ship.y - dh / 2), dw, dh);
  ctx.imageSmoothingEnabled = true;
}

function pickShip(x, y) {
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < ships.length; i += 1) {
    const s = ships[i];
    if (!s.alive) continue;
    const d = (x - s.x) * (x - s.x) + (y - s.y) * (y - s.y);
    const r = Math.max(22, s.reach * 0.92);
    if (d <= r * r && d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

function refreshHover() {
  hovered = aim ? pickShip(aim.x, aim.y) : null;
  canvas.classList.toggle("arm", !!hovered);
}

function spawnBurst(x, y, ship, now) {
  if (bursts.length > 8) bursts.shift();
  const kind = (ship.shape * 3 + ship.color) % 50;
  const paint = PAINTS[ship.color];
  bursts.push({
    x,
    y,
    kind,
    t: now,
    scale: Math.min(2.3, ship.scale),
    hot: paint.glass,
    edge: paint.flame,
  });
  const rays = BOOMS[kind];
  for (let i = 0; i < rays.length; i += 1) {
    const ray = rays[i];
    const speed = (28 + (i % 3) * 12) * Math.min(1.5, ship.scale);
    emitPart(x, y, Math.cos(ray.a) * speed, Math.sin(ray.a) * speed, 0.34 + (i % 3) * 0.06, i % 2 ? paint.flame : paint.hot, 1);
  }
}

function destroyShip(ship, now) {
  if (!ship.alive) return;
  const x = ship.x;
  const y = ship.y;
  spawnBurst(x, y, ship, now);
  ship.alive = false;
  ship.respawnAt = now + 500 + Math.random() * 3400;
}

function fxLive() {
  if (bursts.length) return true;
  for (let i = 0; i < PARTS; i += 1) if (parts[i].life > 0) return true;
  return false;
}

function runFleet(ctx, dpr, now, dt, motionDt, w, h, cx, cy, orbit) {
  const world = fleetWorld(w, h, cx, cy, orbit);
  ensureFleet(world, now);
  refreshHover();
  const blocks = chromeBlocks();
  const want = fleetTarget(w, h);
  for (let i = 0; i < ships.length; i += 1) {
    const ship = ships[i];
    if (ship.parked || i >= want) continue;
    if (!ship.alive) {
      if (now >= ship.respawnAt) dropShip(ship, world, now);
      continue;
    }
    if (motionDt) stepShip(ship, motionDt, world, blocks);
  }
  if (motionDt) {
    separateShips(motionDt);
    for (let i = 0; i < ships.length; i += 1) if (ships[i].alive) containShip(ships[i], world);
  }
  for (let i = 0; i < ships.length; i += 1) {
    const ship = ships[i];
    if (!ship.alive) continue;
    stepExhaust(ship, motionDt, ship === hovered);
  }
  stepParts(dt);
  ctx.save();
  drawParts(ctx, 0, dpr);
  for (let i = 0; i < ships.length; i += 1) {
    const ship = ships[i];
    if (!ship.alive) continue;
    drawShip(ctx, ship, dpr, ship === hovered);
  }
  ctx.restore();
}

function drawBursts(ctx, dpr, now) {
  const dur = reduced ? 220 : 520;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  for (let i = bursts.length - 1; i >= 0; i -= 1) {
    const b = bursts[i];
    const t = (now - b.t) / dur;
    if (t >= 1) {
      bursts.splice(i, 1);
      continue;
    }
    const frame = Math.min(EX_FRAMES - 1, (t * EX_FRAMES) | 0);
    const px = PX * (1.15 + b.scale * 0.35);
    const dw = EX * px;
    ctx.globalAlpha = t > 0.72 ? 1 - (t - 0.72) / 0.28 : 1;
    ctx.drawImage(boomAtlas, frame * EX, b.kind * EX, EX, EX, Math.round(b.x - dw / 2), Math.round(b.y - dw / 2), dw, dw);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.restore();
  drawParts(ctx, 1, dpr);
}

canvas.addEventListener("contextmenu", (event) => event.preventDefault());
canvas.addEventListener("pointerleave", () => {
  aim = null;
  hovered = null;
  canvas.classList.remove("arm");
});
canvas.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  aim = { x: event.clientX, y: event.clientY };
  refreshHover();
});
canvas.addEventListener(
  "pointerdown",
  (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    const hit = pickShip(event.clientX, event.clientY);
    if (!hit) return;
    destroyShip(hit, performance.now());
    kick();
  },
  { passive: false },
);

let looping = false;
let lastNow = 0;

function frame(now) {
  if (document.hidden) {
    looping = false;
    lastNow = 0;
    return;
  }
  const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016;
  lastNow = now;
  const motionDt = reduced ? 0 : dt;
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
  runFleet(ctx, dpr, now, dt, motionDt, w, h, cx, cy, orbit);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.drawImage(front.canvas, 0, 0, w, h);
  drawBursts(ctx, dpr, now);
  const center = clock * speed - Math.PI / 2;
  for (let i = 0; i < badges.length; i += 1) {
    const ang = center + offsets[i] - mid;
    place(badges[i], cx + Math.cos(ang) * orbit, cy + Math.sin(ang) * orbit, cx, cy);
  }
  const markAng = center + Math.PI;
  place(mark, cx + Math.cos(markAng) * orbit, cy + Math.sin(markAng) * orbit, cx, cy);
  if (reduced && !fxLive()) {
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

document.fonts.ready.then(() => {
  layoutCache = null;
  kick();
});
motionQuery.addEventListener("change", (event) => {
  reduced = event.matches;
  kick();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) kick();
});
window.addEventListener("resize", () => {
  layoutCache = null;
  kick();
});
