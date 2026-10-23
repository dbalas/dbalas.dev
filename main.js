const canvas = document.getElementById("sky");
const core = document.querySelector(".core");
const heading = document.querySelector("h1");
const bio = document.querySelector("p");
const badges = [...document.querySelectorAll(".badge")];
const marks = [...document.querySelectorAll(".mark")];
const orbiters = [...badges, ...marks];
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
  const offsets = arcOffsets(badges, gap, orbit);
  const markOffsets = arcOffsets(marks, gap, orbit);
  layoutCache = {
    R,
    orbit,
    cx: w / 2,
    cy: h / 2,
    w,
    h,
    offsets,
    mid: offsets[offsets.length - 1] / 2,
    markOffsets,
    markMid: markOffsets[markOffsets.length - 1] / 2,
    speed: diskSpeed(R, orbit) * 0.8,
  };
  return layoutCache;
}

// Angles that space the pills along the orbit without overlap.
function arcOffsets(els, gap, orbit) {
  const offsets = [0];
  for (let i = 1; i < els.length; i += 1) {
    const need = (els[i - 1].offsetWidth + els[i].offsetWidth) / 2 + gap;
    offsets.push(offsets[i - 1] + 2 * Math.asin(Math.min(0.98, need / (2 * orbit))));
  }
  return offsets;
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
const SUB = 2;
const PX = 2;
const TURNS = 64;

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

// Top half of each hull, center row last, nose pointing right. Mirrored at build time.
// h hull, a accent, d dark metal, s panel seam, g canopy, e nozzle, f flame, n nav light, w beacon
const SHIP_ART = [
  [
    "......aa",
    "......hha",
    "......hhhh",
    "......shhhh",
    "..ee..dhhhhhh",
    ".eeddddhhhhhhhh",
    "feeddhhhhhhhhssggg",
    "feedhhhhhaaaahhhgggghhh",
    "feedhhhhhhhhhhhhhhhhhhhhhw",
  ],
  [
    "n",
    "ha",
    "hhha",
    "shhhhh",
    "dhhhhhhhh",
    "ddhhhhhhhhhh",
    "eddshhhhhhhhhhh",
    "eddhhhhhaahhhhhhgg",
    "fedhhhhhhhhhhhhhgggghhh",
    "fedhhhhhhhhhhhhhhhhhhhhhhhw",
  ],
  [
    "..dddddddd",
    ".eaaaaaaaaad",
    "fedddddddddd",
    ".eaaaaaaaaad",
    "....dhhhd",
    "....dhhhhhhh",
    "..eedhhhhhhhhhhh",
    ".eedshhhhhhhhhhhhgg",
    "feedhhhhhhaaaahhhgggghh",
    "feedhhhhhhhhhhhhhhhhhhhhhh",
  ],
  [
    "...dhhhhshhhhshhhhd",
    "..edaaaasaaaasaaaahhh",
    "..edhhhhshhhhshhhhhhhh",
    "..edhhhhshhhhshhhhhhhhgg",
    "feddhhhhshhhhshhhhhhhhggghh",
    "feddhhhhshhhhshhhhhhhhhhhhhhw",
  ],
  [
    "an",
    "hha",
    "shhh",
    "dhhhh",
    "edhhhhh......hh",
    "edhhhhhhh...hhhd",
    "eedhhhhhhhhhhhhhhhgg",
    "feedhhhhhaaaahhhhhggghh",
    "feedhhhhhhhhhhhhhhhhhhhhhhw",
  ],
  [
    "..............an",
    ".............hha",
    "............hhh",
    "...........hhhs",
    "..........hhhhd",
    ".........hhhhhd",
    "..ee....hhhhhhd",
    ".eeddhhhhhhhhhhhhgg",
    "feedhhhhaaahhhhhhgggghh",
    "feedhhhhhhhhhhhhhhhhhhhhhw",
  ],
  [
    "an",
    "hhh",
    ".hhhh",
    "..dhhhhh",
    "eedhhhhhhggg",
    "fedhhhhhhhggghhh",
    "fedhhhhhhhhhhhhhhhw",
  ],
  [
    ".........dd",
    "....eaaaaaad",
    "....edddddddd",
    "..........dd......dd",
    "..eedhhhhhhhhhhhhhhhhhh",
    ".eeddhhhhhsshhhhhhsshhhhgg",
    "feeddhhhhhhhhhhhhhhhhhhhggghh",
    "feeddhhhhhhhhhhhhhhhhhhhhhhhhhw",
  ],
  [
    "......hhhhhhh",
    "....hhhhhhhhhhh",
    "...hhahhhhhhhahh",
    "..hhhhhhsssshhhhh",
    ".ehhhhhsggggshhhhh",
    "fehhhhsgggggghhhhh",
    "fehhhhsggggggghhhhw",
  ],
  [
    "dddddddddd",
    "daaaaaaaad",
    "dhhhhhhhhd",
    "dhhhhhhhhd",
    "dhhhhhhhhd",
    "dhhhhhhhhd",
    "....dd",
    "....dd",
    "...dhhhd",
    "..edhhhhhgg",
    ".edhhhhhhgggh",
    "fedhhhhhhggggw",
  ],
  [
    "........aa",
    "......hhhha",
    ".....hhhhhhh",
    "....shhhhhhhh",
    "....dhhhhhhhhhh",
    "..fedhhhhhhhhhhhh",
    "..fedhhhhhhaahhhhhgg",
    "..fedhhhhhhhhhhhhhhggg",
    "..fedhhhhhhhhhhhhhhhhhhhw",
  ],
  [
    "an",
    "hha",
    ".hhh",
    "edhhhhhhhhhhhhhhhhhh",
    "fedhhhhhhhhhhhhhhhhhhhgg",
    "fedhhhhhhsshhhhhhhhhhhggghh",
    "fedhhhhhaaaaahhhhhhhhhhhhhhhw",
  ],
  [
    "..............hhhan",
    "...........hhhhhhhh",
    ".........dhhhh",
    "......edhhhh",
    "....eedhhhhhhh",
    "...feeddhhhhhhh",
    "...feedhhhhaaahhggg",
    "...feedhhhhhhhhhhhgghh",
  ],
  [
    "....dddddddddddd",
    "..edhhhhhhhhhhhhhd",
    "..edhaaaaaaaaaaaahd",
    "fedhhhhhhhhhhhhhhhhhh",
    "fedhhhssssssssshhhhhhgg",
    "fedhhhhhhhhhhhhhhhhhhggghw",
  ],
  [
    "....an",
    "....hhhhhhhhhd",
    "....hhhh",
    ".....hhhh",
    "......hhhh",
    "..ee...hhhh",
    ".eeddhhhhhhhhhhhgg",
    "feedhhhhhaaaahhhhgggh",
    "feedhhhhhhhhhhhhhhhhhhhw",
  ],
  [
    "......an....aa",
    "......hh....hh",
    ".......hh....hh",
    "........hh....hh",
    "..e......hh....hh",
    "feddhhhhhhhhhhhhhhhggh",
    "fedhhhhhhhhhhhhhhhhhhhhhw",
  ],
  [
    "...............aan",
    ".............hhhhh",
    "...........hhhhh",
    ".........hhhhhh",
    ".......shhhhhh",
    ".....edhhhhhh",
    "....edhhhhhh",
    "...fedhhhhhhgg",
    "...fedhhhhhhhggh",
  ],
  [
    ".........aaaaa",
    ".......aahhhhhaa",
    ".....aahhhhhhhhhaa",
    "....ahhhhhhhhhhhhha",
    "....hhhhhhhhhhhhhhh",
    "...hhhhhh.....hhhhhh",
    "...hhhhh.......hhhhh",
    "fehhhhh.........hhhggg",
    "fehhhhh.........hhhggg",
    "fehhhhh.........hhhgggw",
  ],
  [
    "......hhhhhhhhhhhan",
    "....edhhhhhhhhhhh",
    "....ddd",
    "....ddd",
    "....ddd",
    "..eeddd",
    ".feeddhhhhhhhhhhggg",
    ".feeddhhhhaaahhhhhggghhhhw",
  ],
  [
    "..............aa",
    "..............hhhh",
    "............hhgggghh",
    "...........hhgggggghh",
    ".........hhgggggggggghh",
    ".......hhgggggggggggggghh",
    ".....hhhgaaaaaaaaaaaaaaghhh",
    "..edhhgggggggggggggggggggghh",
    "fedhhgggggggggggggggggggggggghhw",
  ],
  [
    "....d...d...d",
    ".....d...d...d",
    "......d...d...d",
    "....hhhhhhhhhhh",
    "..hhhhaaaaaaahhhh",
    ".hhhhhhhhhhhhhhhhh",
    ".hhhhhhhhhhhhhhhhhd..d",
    "fhhhhhhhhhhhhhhhhhhddd",
    "fhhhhhhhhhhhhhhhhhhgg",
    "fssssssssssssshhhhhgggw",
  ],
  [
    ".edhhhhhhhhhhhhhhan",
    "fedhhhhaaaahhhhhhhhh",
    ".edhhhhhhhhhhhhhhh",
    "........dd....dd",
    "........dd....dd",
    "........dhhhhhd",
    "........dhhhhhhgg",
    "........dhhhhhhhggw",
  ],
  [
    "................ddd",
    "...............dhhha",
    "...............dhhhh",
    "...............dhhhh",
    "...............dhhhh",
    "..ee...........dhhhh",
    ".eeddhhhhhhhhhhdhhhhh",
    "feedhhhhhhhhhhhhhhhhgg",
    "feedhhhhsshhhhsshhhhggw",
  ],
  [
    "aa",
    "hhhh",
    ".hhhhhh",
    "..hhhhhhhh",
    "...hhhhhhhhhh",
    "..hhhhhhhhhhhhhh",
    ".hhhhhhhaaahhhhhhh",
    "..fehhhhhhhhhhhhhhhhh",
    "...ehhhhhhhhhhhhhhhhhgg",
    "....hhhhhhhhhhhhhhhhhhggw",
  ],
  [
    "....hhh.....hhh......hhhh",
    "...hhhhh...hhhhh....hhhhhhh",
    "..hhaaahh.hhaaahh..hhhhhhhhh",
    "fehhhhhhhdhhhhhhhddhhhhhhhhhgg",
    "fehhhhhhhdhhhhhhhddhhhhhhhhhhggw",
  ],
  [
    "d.d...........hhhh",
    ".d.d.......hhhhhhhhh",
    "..d.d....hhhhhaaahhhh",
    "...d.ddddhhhhhhhhhhhhh",
    "d...dd..dhhhhhhhhhhhhhh",
    ".dd....ddhhhhhhhhhhhggg",
    "...dddd.dhhhhhhhhhhhggggw",
  ],
];

const RAMPS = { h: [3, 1, 2, 10], a: [14, 4, 12, 4], d: [15, 11, 16, 11] };

function shadeShip(at, x, y, half) {
  const m = at(x, y);
  const low = y > half;
  const ramp = RAMPS[m];
  if (ramp) {
    if (at(x, y - 1) !== m) return ramp[0];
    if (at(x, y + 1) !== m) return ramp[2];
    return low ? ramp[3] : ramp[1];
  }
  if (m === "g") return at(x, y - 1) !== "g" && !low ? 6 : low ? 18 : 5;
  if (m === "f") return at(x, y - 1) === "f" && at(x, y + 1) === "f" ? 13 : 8;
  if (m === "e") return 7;
  if (m === "s") return 16;
  if (m === "n") return low ? 19 : 17;
  if (m === "w") return 6;
  return 0;
}

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

function buildShape(rows) {
  const half = rows.length - 1;
  const width = Math.max(...rows.map((r) => r.length));
  const at = (x, y) => {
    if (y < 0 || y > half * 2) return ".";
    return rows[y <= half ? y : half * 2 - y][x] || ".";
  };
  const g = new Uint8Array(ART * ART);
  for (let y = 0; y <= half * 2; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const v = shadeShip(at, x, y, half);
      if (!v) continue;
      for (let dy = 0; dy < SUB; dy += 1) {
        for (let dx = 0; dx < SUB; dx += 1) g[(2 + y * SUB + dy) * ART + 2 + x * SUB + dx] = v;
      }
    }
  }
  return packShip(g);
}

const SHAPES = SHIP_ART.map(buildShape);

const UNIT = 40;
const PARTS = 320;

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

const HULL_TONES = ["#c8ced8", "#8f9aab", "#5d6779", "#d6ccb8", "#7d8c83", "#a3b6cc"];
const ACCENTS = ["#e5484d", "#f76b15", "#ffc53d", "#3dd68c", "#0090ff", "#8e4ec6", "#e93d82", "#00c2d7"];

function paintOf(hullHex, accentHex) {
  const [h, s, l] = rgbToHsl(...hexRgb(hullHex));
  const [ah, as, al] = rgbToHsl(...hexRgb(accentHex));
  const sat = Math.min(0.22, s);
  const lit = (d) => Math.max(0.04, Math.min(0.94, l + d));
  const paint = [];
  paint[1] = hslToRgb(h, sat, lit(0));
  paint[2] = hslToRgb(h, sat, lit(-0.17));
  paint[3] = hslToRgb(h, sat * 0.8, lit(0.14));
  paint[10] = hslToRgb(h, sat, lit(-0.08));
  paint[4] = hslToRgb(ah, as, al);
  paint[12] = hslToRgb(ah, as, al - 0.16);
  paint[14] = hslToRgb(ah, as, Math.min(0.85, al + 0.13));
  paint[11] = hslToRgb(h, sat * 0.6, 0.24);
  paint[15] = hslToRgb(h, sat * 0.6, 0.34);
  paint[16] = hslToRgb(h, sat * 0.6, 0.15);
  paint[5] = [56, 152, 214];
  paint[18] = [30, 84, 140];
  paint[6] = [232, 246, 255];
  paint[7] = [24, 22, 32];
  paint[8] = [255, 146, 40];
  paint[13] = [255, 238, 200];
  paint[9] = hslToRgb(h, sat * 0.6, 0.07);
  paint[17] = [255, 72, 72];
  paint[19] = [72, 255, 140];
  paint.flame = rgbCss(paint[8]);
  paint.glass = rgbCss(paint[6]);
  paint.hot = rgbCss(paint[13]);
  paint.debris = [paint[3], paint[1], paint[4], paint[11]].map(rgbCss);
  return paint;
}

const PAINTS = HULL_TONES.flatMap((hull) => ACCENTS.map((accent) => paintOf(hull, accent)));

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
const EX_FRAMES = 8;
const BOOM_KINDS = 24;
const FIRE = [null, [255, 250, 236], [255, 214, 92], [255, 142, 38], [232, 70, 30], [140, 36, 34], [96, 84, 104], [60, 52, 72]];
const BOOM_GROW = [0.3, 0.62, 0.85, 0.97, 1.04, 1.1, 1.14, 1.17];
const WAVE_R = [0, 10, 15, 19, 21.5, 23];

// Lumpy fireball that cools from white to smoke and dissolves through noise holes, plus a broken shockwave ring.
function makeBoom(seed) {
  const rand = mulberry32(seed * 997 + 13);
  const c = EX / 2;
  const blobs = [{ x: 0, y: 0, r: 1 }];
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 + rand() * 0.9;
    const d = 0.25 + rand() * 0.35;
    blobs.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r: 0.45 + rand() * 0.35 });
  }
  // Smooth value noise (6px cells) so the fire breaks into clumps instead of speckle.
  const cell = 6;
  const span = EX / cell + 2;
  const lattice = Array.from({ length: span * span }, () => rand());
  const noise = new Float32Array(EX * EX);
  for (let y = 0; y < EX; y += 1) {
    for (let x = 0; x < EX; x += 1) {
      const gx = x / cell;
      const gy = y / cell;
      const ix = gx | 0;
      const iy = gy | 0;
      const fx = (gx - ix) * (gx - ix) * (3 - 2 * (gx - ix));
      const fy = (gy - iy) * (gy - iy) * (3 - 2 * (gy - iy));
      const top = lattice[iy * span + ix] * (1 - fx) + lattice[iy * span + ix + 1] * fx;
      const bottom = lattice[(iy + 1) * span + ix] * (1 - fx) + lattice[(iy + 1) * span + ix + 1] * fx;
      noise[y * EX + x] = (top * (1 - fy) + bottom * fy) * 0.85 + rand() * 0.15;
    }
  }
  const frames = [];
  for (let f = 0; f < EX_FRAMES; f += 1) {
    const t = f / (EX_FRAMES - 1);
    const R = 16 * BOOM_GROW[f];
    const g = new Uint8Array(EX * EX);
    for (let y = 0; y < EX; y += 1) {
      for (let x = 0; x < EX; x += 1) {
        const px = (x - c + 0.5) / R;
        const py = (y - c + 0.5) / R;
        let field = 0;
        for (let k = 0; k < blobs.length; k += 1) {
          const b = blobs[k];
          field = Math.max(field, 1 - Math.hypot(px - b.x, py - b.y) / b.r);
        }
        if (field <= 0) continue;
        const i = y * EX + x;
        const n = noise[i];
        if (n < t * t * 0.85 + (1 - field) * t * 0.5) continue;
        const heat = field * (1.15 - t * 1.1) + (0.5 - n) * 0.3;
        if (heat > 0.72) g[i] = 1;
        else if (heat > 0.5) g[i] = 2;
        else if (heat > 0.32) g[i] = 3;
        else if (heat > 0.16) g[i] = 4;
        else if (heat > 0.04 || t < 0.35) g[i] = 5;
        else g[i] = n > 0.6 ? 6 : 7;
      }
    }
    const rr = WAVE_R[f];
    if (rr) {
      for (let k = 0; k < 160; k += 1) {
        const a = (k / 160) * Math.PI * 2;
        const x = Math.round(c + Math.cos(a) * rr);
        const y = Math.round(c + Math.sin(a) * rr);
        if (x < 0 || y < 0 || x >= EX || y >= EX) continue;
        const i = y * EX + x;
        if (g[i] || noise[(k * 7) % noise.length] < 0.15 + f * 0.12) continue;
        g[i] = f < 3 ? 2 : f < 4 ? 3 : 6;
      }
    }
    frames.push(g);
  }
  return frames;
}

const boomAtlas = document.createElement("canvas");
boomAtlas.width = EX * EX_FRAMES;
boomAtlas.height = EX * BOOM_KINDS;
{
  const ictx = boomAtlas.getContext("2d");
  const img = ictx.createImageData(boomAtlas.width, boomAtlas.height);
  const data = img.data;
  for (let seed = 0; seed < BOOM_KINDS; seed += 1) {
    const frames = makeBoom(seed);
    for (let f = 0; f < EX_FRAMES; f += 1) {
      const cell = frames[f];
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
  size: 1,
}));
let partCursor = 0;

function emitPart(x, y, vx, vy, life, rgb, front, size = 1) {
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
    p.size = size;
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
    ctx.fillRect(Math.round(p.x / PX) * PX, Math.round(p.y / PX) * PX, PX * p.size, PX * p.size);
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

function sideBox(ship, world) {
  const pad = world.margin + ship.reach * 0.5;
  const gap = world.exclusion + ship.reach * 0.5;
  if (ship.side < 0) return { x0: pad, x1: Math.max(pad, world.cx - gap), y0: pad, y1: world.h - pad };
  return { x0: Math.min(world.w - pad, world.cx + gap), x1: world.w - pad, y0: pad, y1: world.h - pad };
}

// Next waypoint on the ship's own side, far enough away to make a real leg of flight.
function pickGoal(ship, world) {
  const box = sideBox(ship, world);
  let best = null;
  for (let n = 0; n < 16; n += 1) {
    const x = box.x0 + Math.random() * (box.x1 - box.x0);
    const y = box.y0 + Math.random() * (box.y1 - box.y0);
    if (!pointInside(world, x, y, ship.reach)) continue;
    best = { x, y };
    if (Math.hypot(x - ship.x, y - ship.y) > 160) break;
  }
  return best || randomPoint(world, ship.reach);
}

function mixAng(a, b, t) {
  return Math.atan2(Math.sin(a) * (1 - t) + Math.sin(b) * t, Math.cos(a) * (1 - t) + Math.cos(b) * t);
}

function turnToward(ship, target, dt, rate) {
  const delta = Math.atan2(Math.sin(target - ship.heading), Math.cos(target - ship.heading));
  const max = rate * dt;
  ship.heading += Math.max(-max, Math.min(max, delta));
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
    cruise: 28,
    goal: null,
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
  let shape = (Math.random() * SHAPES.length) | 0;
  let color = (Math.random() * PAINTS.length) | 0;
  for (let n = 0; n < 8; n += 1) {
    let clash = false;
    for (let i = 0; i < ships.length; i += 1) {
      const other = ships[i];
      if (other !== ship && other.alive && other.shape === shape && other.color === color) clash = true;
    }
    if (!clash) break;
    shape = (Math.random() * SHAPES.length) | 0;
    color = (Math.random() * PAINTS.length) | 0;
  }
  ship.shape = shape;
  ship.color = color;
  ship.scale = 0.85 + Math.random() * (maxScale(world) - 0.85);
  ship.reach = SHAPES[shape].reach * PX * ship.scale;
  ship.cruise = (22 + Math.random() * 26) / Math.pow(ship.scale, 0.35);
  ship.speed = ship.cruise;
  ship.goal = null;
  ship.phase = Math.random() * Math.PI * 2;
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
  ship.y = y;
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

function desiredHeading(ship, world) {
  if (ship.entering) return { angle: ship.enterAim, hot: false };
  if (!ship.goal || Math.hypot(ship.goal.x - ship.x, ship.goal.y - ship.y) < 48) ship.goal = pickGoal(ship, world);
  const dx = ship.x - world.cx;
  const dy = ship.y - world.cy;
  const dist = Math.hypot(dx, dy) || 1;
  const out = Math.atan2(dy, dx);
  const inner = world.exclusion + ship.reach * 0.58;
  let angle = Math.atan2(ship.goal.y - ship.y, ship.goal.x - ship.x) + Math.sin(ship.phase * 3) * 0.14;
  let hot = false;
  if (dist < inner + 70 && Math.cos(angle - out) < 0.2) {
    const tangent = Math.cos(out + Math.PI / 2 - angle) > 0 ? out + Math.PI / 2 : out - Math.PI / 2;
    angle = mixAng(tangent, out, Math.max(0, Math.min(1, (inner - dist) / 40 + 0.25)));
    hot = dist < inner;
  }
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
  if (away !== null) return { angle: mixAng(angle, away, 0.55), hot: true };
  return { angle, hot };
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

function stepShip(ship, dt, world) {
  const steer = desiredHeading(ship, world);
  ship.avoiding = steer.hot;
  const rate = (steer.hot ? 1.5 : 0.9) / Math.pow(ship.scale, 0.32);
  const bend = Math.abs(Math.atan2(Math.sin(steer.angle - ship.heading), Math.cos(steer.angle - ship.heading)));
  turnToward(ship, steer.angle, dt, rate);
  // Ease off through tight turns, open the throttle on straights.
  const target = ship.cruise * (1 - 0.45 * Math.min(1, bend / 1.6)) * (steer.hot ? 1.2 : 1);
  ship.speed += (target - ship.speed) * Math.min(1, dt * 1.8);
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
  const paint = PAINTS[ship.color];
  const s = Math.min(1.5, ship.scale);
  bursts.push({ x, y, kind: (Math.random() * BOOM_KINDS) | 0, t: now, scale: Math.min(2.3, ship.scale) });
  const mx = Math.cos(ship.heading) * ship.speed * 0.6;
  const my = Math.sin(ship.heading) * ship.speed * 0.6;
  for (let i = 0; i < 16; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const v = (80 + Math.random() * 110) * s;
    emitPart(x, y, Math.cos(a) * v, Math.sin(a) * v, 0.2 + Math.random() * 0.25, i % 3 ? paint.hot : paint.flame, 1);
  }
  for (let i = 0; i < 12; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const v = (20 + Math.random() * 70) * s;
    emitPart(x, y, mx + Math.cos(a) * v, my + Math.sin(a) * v, 0.7 + Math.random() * 0.7, paint.debris[i % 4], 1, i % 3 ? 1 : 2);
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
  const want = fleetTarget(w, h);
  for (let i = 0; i < ships.length; i += 1) {
    const ship = ships[i];
    if (ship.parked || i >= want) continue;
    if (!ship.alive) {
      if (now >= ship.respawnAt) dropShip(ship, world, now);
      continue;
    }
    if (motionDt) stepShip(ship, motionDt, world);
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
  const dur = reduced ? 260 : 720;
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
  const { R, orbit, cx, cy, offsets, mid, markOffsets, markMid, speed } = measure(w, h);
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
  for (let i = 0; i < marks.length; i += 1) {
    const ang = center + Math.PI + markOffsets[i] - markMid;
    place(marks[i], cx + Math.cos(ang) * orbit, cy + Math.sin(ang) * orbit, cx, cy);
  }
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
