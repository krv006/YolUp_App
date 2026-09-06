#!/usr/bin/env node
/**
 * `src/shared/ui/logo-mark.json` -> `assets/*.png`
 *
 * Ikonkalar QO'LDA chizilmaydi: geometriya bitta manbada turadi va shu
 * yerdan rasterlanadi. Ilova ichidagi `<Logo />` ham AYNAN o'sha manbadan
 * chiziladi (`src/shared/ui/logo.tsx`), shuning uchun launcher ikonkasi
 * bilan ekrandagi logo hech qachon bir-biridan farq qilib qolmaydi.
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

function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
}

/** Nuqta yumaloq to'rtburchak ichidami. */
function inRoundedRect(px, py, { x, y, w, h, r }) {
  const radius = Math.min(r, w / 2, h / 2);
  const left = x + radius;
  const right = x + w - radius;
  const top = y + radius;
  const bottom = y + h - radius;
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const cx = Math.min(Math.max(px, left), right);
  const cy = Math.min(Math.max(py, top), bottom);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function inCircle(px, py, { cx, cy, r }) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

/**
 * Belgining chegara qutisi. Shakllar qo'lda yozilgani uchun ular kvadratning
 * aniq markazida turmasligi mumkin — bu yerda hisoblanib, render vaqtida
 * avtomatik markazlashtiriladi. Ya'ni `logo-mark.json` ni tahrirlaganda
 * koordinatalarni qo'lda muvozanatlash SHART EMAS.
 */
function markBounds() {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const shape of MARK.shapes) {
    const [x0, y0, x1, y1] =
      shape.type === "rect"
        ? [shape.x, shape.y, shape.x + shape.w, shape.y + shape.h]
        : [shape.cx - shape.r, shape.cy - shape.r, shape.cx + shape.r, shape.cy + shape.r];
    minX = Math.min(minX, x0);
    minY = Math.min(minY, y0);
    maxX = Math.max(maxX, x1);
    maxY = Math.max(maxY, y1);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

const BOUNDS = markBounds();

/** Belgi ichidami — barcha shakllarning birlashmasi. */
function inMark(px, py) {
  for (const shape of MARK.shapes) {
    if (shape.type === "rect" ? inRoundedRect(px, py, shape) : inCircle(px, py, shape)) return true;
  }
  return false;
}

/**
 * @param size      tomon uzunligi (piksel)
 * @param options.background  fon rangi (`null` -> shaffof)
 * @param options.mark        belgi rangi
 * @param options.scale       belgi kvadratning necha ulushini egallaydi
 * @param options.tileRadius  fon yumaloqligi (0..0.5), `null` -> to'la kvadrat
 */
function render(size, { background, mark, scale, tileRadius = null }) {
  const png = new PNG({ width: size, height: size });
  const bg = background ? hexToRgb(background) : null;
  const fg = hexToRgb(mark);
  // Chegara qutisining uzun tomoni `scale` ulushni egallaydi, qolgani
  // ikkala o'q bo'yicha ham teng markazlashtiriladi.
  const span = Math.max(BOUNDS.width, BOUNDS.height);
  const k = scale / span;
  const offsetX = 0.5 - (BOUNDS.minX + BOUNDS.width / 2) * k;
  const offsetY = 0.5 - (BOUNDS.minY + BOUNDS.height / 2) * k;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let markHits = 0;
      let bgHits = 0;

      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const u = (x + (sx + 0.5) / SAMPLES) / size;
          const v = (y + (sy + 0.5) / SAMPLES) / size;

          if (bg) {
            bgHits +=
              tileRadius === null
                ? 1
                : inRoundedRect(u, v, { x: 0, y: 0, w: 1, h: 1, r: tileRadius })
                  ? 1
                  : 0;
          }

          if (inMark((u - offsetX) / k, (v - offsetY) / k)) markHits++;
        }
      }

      const total = SAMPLES * SAMPLES;
      const markAlpha = markHits / total;
      const bgAlpha = bg ? bgHits / total : 0;
      const alpha = Math.min(1, bgAlpha + markAlpha);

      // Belgi fon ustiga qo'yiladi.
      const base = bg ?? fg;
      const r = base[0] * (1 - markAlpha) + fg[0] * markAlpha;
      const g = base[1] * (1 - markAlpha) + fg[1] * markAlpha;
      const b = base[2] * (1 - markAlpha) + fg[2] * markAlpha;

      const idx = (size * y + x) << 2;
      png.data[idx] = Math.round(r);
      png.data[idx + 1] = Math.round(g);
      png.data[idx + 2] = Math.round(b);
      png.data[idx + 3] = Math.round(alpha * 255);
    }
  }

  return PNG.sync.write(png);
}

const { brand, onBrand } = MARK;

const FILES = [
  // iOS va zaxira ikonka: to'la kvadrat, shaffoflik YO'Q (Apple talabi —
  // burchaklarni tizimning o'zi yumaloqlaydi).
  ["icon.png", 1024, { background: brand, mark: onBrand, scale: 0.62 }],

  // Android adaptiv ikonkasi: fon va old qism alohida fayl.
  // Old qismdagi belgi 0.46 ulushda — Android tashqi ~1/3 ni kesib
  // tashlashi mumkin (turli qurilmada turli niqob).
  ["android-icon-background.png", 1024, { background: brand, mark: brand, scale: 0 }],
  ["android-icon-foreground.png", 1024, { background: null, mark: onBrand, scale: 0.46 }],
  // Monoxrom (Android 13+ "themed icons"): tizim o'zi rang beradi.
  ["android-icon-monochrome.png", 1024, { background: null, mark: onBrand, scale: 0.46 }],

  // Splash: fon och (#f5f7fa) yoki to'q (#0f1319) bo'lishi mumkin,
  // shuning uchun belgi BRENDLI PLITKA ustida — ikkalasida ham ko'rinadi.
  ["splash-icon.png", 512, { background: brand, mark: onBrand, scale: 0.60, tileRadius: 0.22 }],

  ["favicon.png", 96, { background: brand, mark: onBrand, scale: 0.62, tileRadius: 0.18 }],
];

mkdirSync(OUT, { recursive: true });
for (const [name, size, options] of FILES) {
  writeFileSync(resolve(OUT, name), render(size, options));
  console.log(`  ${name.padEnd(32)} ${size}x${size}`);
}
console.log(`\n✔ ${FILES.length} ta ikonka yaratildi — manba: src/shared/ui/logo-mark.json`);
