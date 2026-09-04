#!/usr/bin/env node
/**
 * `src/shared/ui/palette.json` -> `src/shared/styles/global.css`
 *
 * Ranglar bitta manbada turishi uchun CSS qo'lda yozilmaydi. NativeWind
 * `className` larni shu CSS o'zgaruvchilari orqali yechadi, TS kodi esa
 * `tokens.ts` orqali — ikkalasi ham AYNAN bitta JSON'dan oziqlanadi.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(ROOT, "src/shared/ui/palette.json");
const TARGET = resolve(ROOT, "src/shared/styles/global.css");

const palette = JSON.parse(readFileSync(SOURCE, "utf8"));

const block = (vars) =>
  Object.entries(vars)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join("\n");

const css = `/**
 * GENERATSIYA QILINGAN — QO'LDA TAHRIRLAMANG.
 * Manba: src/shared/ui/palette.json
 * Qayta yaratish: npm run build:tokens
 */

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
${block(palette.light)}
}

.dark:root {
${block(palette.dark)}
}
`;

mkdirSync(dirname(TARGET), { recursive: true });
writeFileSync(TARGET, css, "utf8");

const count = Object.keys(palette.light).length;
console.log(`✔ global.css yaratildi — ${count} token x 2 mavzu`);
