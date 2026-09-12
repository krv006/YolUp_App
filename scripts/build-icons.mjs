#!/usr/bin/env node
/**
 * `src/shared/ui/logo-mark.json` -> `assets/*.png`
 *
 * Ikonkalar QO'LDA chizilmaydi: geometriya bitta manbada turadi va shu
 * yerdan rasterlanadi. Ilova ichidagi `<Logo />` ham AYNAN o'sha manbadan
 * chiziladi (`src/shared/ui/logo.tsx`), shuning uchun launcher ikonkasi
 * bilan ekrandagi logo hech qachon bir-biridan farq qilib qolmaydi.
 *
 * Belgi ikki qatlamdan iborat (`logo-mark.json` dagi `role`):
 *   body — "Y" harfi;
 *   cut  — uning ustidan o'tuvchi strelka, u body'ni KESIB o'tadi.
 * Plitkali ikonkada body oq, cut esa orqadagi gradientni ochib beradi;
 * shaffof variantda body gradient, cut esa teshik bo'lib qoladi.
 *
 * Chekkalarni silliqlash uchun har piksel 4x4 nuqtada tekshiriladi
 * (supersampling) — tashqi grafik kutubxona kerak emas.
 */
import { PNG } from "pngjs";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MARK = JSON.parse(readFileSync(resolve(ROOT, "src/shared/ui/logo-mark.json"), "utf8"));
const OUT = resolve(ROOT, "assets");

const SAMPLES = 4; // piksel yon tomoniga nechta namuna
const GRADIENT = "gradient"; // rang o'rniga beriladigan maxsus qiymat
const BACKGROUND = "background"; // cut uchun: fonni ochib ber

function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
}

const STOPS = MARK.gradient.stops.map((stop) => ({ at: stop.at, rgb: hexToRgb(stop.color) }));

/**
 * Gradient rangi. Nuqta gradient o'qiga proyeksiya qilinadi (0..1) va
 * qo'shni ikki to'xtash orasida chiziqli aralashtiriladi.
 */
function gradientAt(px, py) {
  const [x0, y0] = MARK.gradient.from;
  const [x1, y1] = MARK.gradient.to;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  const t = Math.min(1, Math.max(0, ((px - x0) * dx + (py - y0) * dy) / len2));

  let lower = STOPS[0];
  let upper = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (t >= STOPS[i].at && t <= STOPS[i + 1].at) {
      lower = STOPS[i];
      upper = STOPS[i + 1];
      break;
    }
  }
  const span = upper.at - lower.at;
  const k = span === 0 ? 0 : (t - lower.at) / span;
  return [0, 1, 2].map((i) => lower.rgb[i] + (upper.rgb[i] - lower.rgb[i]) * k);
}

/** `color` — hex satri yoki `GRADIENT`. */
function resolveColor(color, px, py) {
  return color === GRADIENT ? gradientAt(px, py) : hexToRgb(color);
}

/** Nuqta yumaloq to'rtburchak ichidami (plitka niqobi uchun). */
function inRoundedRect(px, py, { x, y, w, h, r }) {
  const radius = Math.min(r, w / 2, h / 2);
  const cx = Math.min(Math.max(px, x + radius), x + w - radius);
  const cy = Math.min(Math.max(py, y + radius), y + h - radius);
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

/** Nuqtadan kesmagacha bo'lgan eng qisqa masofaning kvadrati. */
function distanceToSegmentSquared(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / len2));
  const qx = ax + t * dx - px;
  const qy = ay + t * dy - py;
  return qx * qx + qy * qy;
}

/** Yumaloq uchli qalin chiziq: nuqta o'q atrofidagi (w/2 + pad) radiusdami. */
function inStroke(px, py, { points, w }, pad) {
  const limit = (w / 2 + pad) ** 2;
  for (let i = 0; i < points.length - 1; i++) {
    if (distanceToSegmentSquared(px, py, points[i], points[i + 1]) <= limit) return true;
  }
  return false;
}

/** Ko'pburchak ichidami — nur tashlash usuli. */
function inPolygon(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const crosses = yi > py !== yj > py;
    if (crosses && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** `pad` — shaklni har tomonga shuncha kengaytiradi (ajratgich hoshiya uchun). */
function inShape(px, py, shape, pad = 0) {
  if (shape.type === "stroke") return inStroke(px, py, shape, pad);
  if (inPolygon(px, py, shape.points)) return true;
  if (pad === 0) return false;
  const limit = pad * pad;
  const points = shape.points;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    if (distanceToSegmentSquared(px, py, points[j], points[i]) <= limit) return true;
  }
  return false;
}

function shapeBounds(shape) {
  const pad = shape.type === "stroke" ? shape.w / 2 : 0;
  const xs = shape.points.map(([x]) => x);
  const ys = shape.points.map(([, y]) => y);
  return [
    Math.min(...xs) - pad,
    Math.min(...ys) - pad,
    Math.max(...xs) + pad,
    Math.max(...ys) + pad,
  ];
}

const BODY = MARK.shapes.filter((shape) => shape.role === "body");
const CUT = MARK.shapes.filter((shape) => shape.role === "cut");

/**
 * Belgining chegara qutisi. Shakllar qo'lda yozilgani uchun ular kvadratning
 * aniq markazida turmasligi mumkin — bu yerda hisoblanib, render vaqtida
 * avtomatik markazlashtiriladi. Ya'ni `logo-mark.json` ni tahrirlaganda
 * koordinatalarni qo'lda muvozanatlash SHART EMAS.
 */
function markBounds() {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const shape of MARK.shapes) {
    const [x0, y0, x1, y1] = shapeBounds(shape);
    minX = Math.min(minX, x0);
    minY = Math.min(minY, y0);
    maxX = Math.max(maxX, x1);
    maxY = Math.max(maxY, y1);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

const BOUNDS = markBounds();

/**
 * @param size      tomon uzunligi (piksel)
 * @param options.background  fon: hex, `GRADIENT` yoki `null` (shaffof)
 * @param options.body        "Y" rangi: hex, `GRADIENT` yoki `null` (belgi chizilmaydi)
 * @param options.cut         strelka rangi: hex yoki `BACKGROUND` (fonni ochadi)
 * @param options.cutGap      strelka atrofidagi ajratgich hoshiya kengligi.
 *                            "Y" ham, strelka ham OQ bo'lganda (plitkali
 *                            ikonka) ular shu ingichka hoshiya bilan
 *                            ajraladi — aks holda strelka ko'rinmay qoladi.
 *                            "Y" gradient bo'lsa hoshiya kerak emas (0).
 * @param options.scale       belgi kvadratning necha ulushini egallaydi
 * @param options.tileRadius  fon yumaloqligi (0..0.5), `null` -> to'la kvadrat
 */
function render(size, { background, body, cut, cutGap = 0, scale, tileRadius = null }) {
  const png = new PNG({ width: size, height: size });
  // Chegara qutisining uzun tomoni `scale` ulushni egallaydi, qolgani
  // ikkala o'q bo'yicha ham teng markazlashtiriladi.
  const span = Math.max(BOUNDS.width, BOUNDS.height);
  const k = scale / span;
  const offsetX = 0.5 - (BOUNDS.minX + BOUNDS.width / 2) * k;
  const offsetY = 0.5 - (BOUNDS.minY + BOUNDS.height / 2) * k;
  const total = SAMPLES * SAMPLES;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;

      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const u = (x + (sx + 0.5) / SAMPLES) / size;
          const v = (y + (sy + 0.5) / SAMPLES) / size;

          const onBackground =
            background !== null &&
            (tileRadius === null || inRoundedRect(u, v, { x: 0, y: 0, w: 1, h: 1, r: tileRadius }));

          // Belgi fazosidagi nuqta.
          const mx = (u - offsetX) / k;
          const my = (v - offsetY) / k;

          const backgroundRgb = onBackground ? resolveColor(background, u, v) : null;

          let rgb = null;
          if (body !== null && CUT.some((shape) => inShape(mx, my, shape))) {
            // Strelkaning o'zi — body ustidan o'tadi.
            rgb = cut === BACKGROUND ? backgroundRgb : hexToRgb(cut);
          } else if (cutGap > 0 && body !== null && CUT.some((shape) => inShape(mx, my, shape, cutGap))) {
            // Strelka atrofidagi ajratgich: fon rangi (yoki shaffoflik).
            rgb = backgroundRgb;
          } else if (body !== null && BODY.some((shape) => inShape(mx, my, shape))) {
            rgb = resolveColor(body, mx, my);
          } else {
            rgb = backgroundRgb;
          }

          if (rgb) {
            sumR += rgb[0];
            sumG += rgb[1];
            sumB += rgb[2];
            sumA += 1;
          }
        }
      }

      const alpha = sumA / total;
      const idx = (size * y + x) << 2;
      png.data[idx] = sumA === 0 ? 0 : Math.round(sumR / sumA);
      png.data[idx + 1] = sumA === 0 ? 0 : Math.round(sumG / sumA);
      png.data[idx + 2] = sumA === 0 ? 0 : Math.round(sumB / sumA);
      png.data[idx + 3] = Math.round(alpha * 255);
    }
  }

  return PNG.sync.write(png);
}

const { onBrand } = MARK;

/** Oq "Y" ustidagi oq strelkani ajratib turuvchi hoshiya kengligi. */
const GAP = 0.026;

/** Plitkali ikonka: gradient fon + oq "Y" + oq strelka (gradient hoshiya bilan). */
const TILE = { background: GRADIENT, body: onBrand, cut: onBrand, cutGap: GAP };
/** Shaffof variant: hoshiya teshik bo'ladi va ostidagi fon undan ko'rinadi. */
const CUTOUT = { background: null, body: onBrand, cut: onBrand, cutGap: GAP };

const FILES = [
  // iOS va zaxira ikonka. Shaffoflik YO'Q (Apple talabi — burchaklarni
  // tizimning o'zi yumaloqlaydi).
  ["icon.png", 1024, { ...TILE, scale: 0.62 }],

  // Android adaptiv ikonkasi: fon va old qism alohida fayl.
  // Old qismdagi belgi 0.46 ulushda — Android tashqi ~1/3 ni kesib
  // tashlashi mumkin (turli qurilmada turli niqob).
  ["android-icon-background.png", 1024, { background: GRADIENT, body: null, cut: BACKGROUND, scale: 0 }],
  ["android-icon-foreground.png", 1024, { ...CUTOUT, scale: 0.46 }],
  // Monoxrom (Android 13+ "themed icons"): tizim o'zi rang beradi, shuning
  // uchun bu yerda faqat siluet — strelka o'yiq bo'lib turadi.
  ["android-icon-monochrome.png", 1024, { ...CUTOUT, scale: 0.46 }],

  // Splash: fon och (#f5f7fa) yoki to'q (#0f1319) bo'lishi mumkin,
  // shuning uchun belgi BRENDLI PLITKA ustida — ikkalasida ham ko'rinadi.
  ["splash-icon.png", 512, { ...TILE, scale: 0.6, tileRadius: 0.22 }],

  ["favicon.png", 96, { ...TILE, scale: 0.62, tileRadius: 0.18 }],
];

mkdirSync(OUT, { recursive: true });
for (const [name, size, options] of FILES) {
  writeFileSync(resolve(OUT, name), render(size, options));
  console.log(`  ${name.padEnd(32)} ${size}x${size}`);
}
console.log(`\n✔ ${FILES.length} ta ikonka yaratildi — manba: src/shared/ui/logo-mark.json`);
