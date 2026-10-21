#!/usr/bin/env node
/**
 * `assets/icons/*.svg` -> `src/shared/ui/icons-svg.ts`
 *
 * ┌─ NEGA GENERATSIYA ────────────────────────────────────────────────────┐
 * │ React Native `.svg` faylni import qila olmaydi. Buning ikki yechimi   │
 * │ bor: metro'ga `react-native-svg-transformer` qo'shish yoki SVG'ni     │
 * │ matn sifatida TS'ga kiritish. Loyihada ikkinchisi allaqachon          │
 * │ ishlatiladi (`logo-svg.ts`), shuning uchun shu naqsh davom ettirildi: │
 * │ yangi bog'liqlik ham, metro sozlamasi ham kerak emas.                  │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * MANBA — VEB. Fayllar `Edu_Front/src/shared/assets/icons/` dan bayt-bayt
 * ko'chiriladi, shuning uchun ilovadagi ikonka vebdagi bilan bir xil
 * bo'ladi. Vebda ular yangilansa, fayllarni qayta ko'chirib shu buyruqni
 * ishlatish kifoya.
 *
 * RANG. Vebda ikonkalar `fill="#24264D"` bilan qotirilgan. Bu yerda u
 * `currentColor` ga almashtiriladi, shunda `<Icon color=... />` orqali
 * istalgan rang beriladi (`react-native-svg` `color` propini
 * `currentColor` sifatida uzatadi).
 *
 * Ishlatilishi:  npm run build:ui-icons
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "assets/icons");
const OUT = resolve(ROOT, "src/shared/ui/icons-svg.ts");

/** Vebdagi qotirilgan rang — `--ink-900`. */
const HARDCODED = /fill="#24264D"/gi;

const files = readdirSync(SRC).filter((name) => name.endsWith(".svg")).sort();
if (files.length === 0) throw new Error("assets/icons/ bo'sh");

const entries = files.map((name) => {
  const id = name.replace(/\.svg$/, "");
  let svg = readFileSync(resolve(SRC, name), "utf8").trim();

  // Rangni almashtiramiz; `fill="none"` TEGILMAYDI — u ildizdagi qiymat
  // va uni ham bo'yasak, ikonka to'liq to'ldirilgan kvadrat bo'lib qolardi.
  svg = svg.replace(HARDCODED, 'fill="currentColor"');

  return [id, svg];
});

const recoloured = entries.filter(([, svg]) => svg.includes("currentColor")).length;

const body = entries
  .map(([id, svg]) => `  ${JSON.stringify(id)}: ${JSON.stringify(svg)},`)
  .join("\n");

writeFileSync(
  OUT,
  `// AVTOMATIK YARATILGAN — tahrirlamang.
// Manba: assets/icons/*.svg (veb Edu_Front dan ko'chirilgan)
// Buyruq: npm run build:ui-icons
//
// Izohi: scripts/build-ui-icons.mjs

export const ICONS = {
${body}
} as const;

export type IconName = keyof typeof ICONS;
`
);

console.log(`✔ icons-svg.ts — ${entries.length} ta ikonka, ${recoloured} tasi rangni oladi`);
