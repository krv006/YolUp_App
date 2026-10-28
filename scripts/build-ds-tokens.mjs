#!/usr/bin/env node
/**
 * Veb `src/shared/styles/design-tokens.css` -> `src/shared/ui/ds-tokens.json`
 *
 * Yangi Figma dizayni (2026-10) vebda Tailwind nomlari bilan yozilgan:
 * `bg-brand`, `text-ink-secondary`, `border-line`, `text-body-sm`... Ular
 * `@theme` blokida CSS o'zgaruvchilariga bog'langan, o'zgaruvchilar esa
 * `:root` (primitivlar + yorug' semantika) va `[data-theme="dark"]` da.
 *
 * Mobilda Tailwind yo'q (DECISIONS §17), shuning uchun bu skript o'sha
 * zanjirni har ikki tema uchun OXIRIGACHA yechib, tayyor qiymatlarni
 * yozadi. Ekranlar vebdagi nom bilan ishlaydi: `ds.ink-secondary`,
 * `type["body-sm"]` — moslashtirishda adashish bo'lmaydi.
 *
 * Qiymatlar o'zgarmaydi: `rgb(36 38 77 / 0.06)` -> `rgba(36, 38, 77, 0.06)`
 * (bir xil rang, faqat RN tushunadigan yozuv). Soya va gradientlar CSS
 * satri bo'lib qoladi — RN 0.86 `boxShadow` va
 * `experimental_backgroundImage` ularni to'g'ridan-to'g'ri qabul qiladi.
 *
 * Ishlatilishi:  npm run build:ds-tokens   (veb manbasi: ../../Frontend/Edu_Front)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = process.env.WEB_ROOT ?? resolve(ROOT, "../../Frontend/Edu_Front");
const SOURCE = resolve(WEB, "src/shared/styles/design-tokens.css");
const TARGET = resolve(ROOT, "src/shared/ui/ds-tokens.json");

if (!existsSync(SOURCE)) {
  console.error(`Veb manbasi topilmadi: ${SOURCE}\nWEB_ROOT=<yo'l> bilan ko'rsating.`);
  process.exit(1);
}

const css = readFileSync(SOURCE, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Yuqori darajadagi `selektor { ... }` bloklari (ichma-ich bloklar yo'q). */
function blocks(text) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = re.exec(text))) out.push({ selector: match[1].trim(), body: match[2] });
  return out;
}

function declarations(body) {
  const vars = {};
  for (const line of body.split(";")) {
    const index = line.indexOf(":");
    if (index < 0) continue;
    const name = line.slice(0, index).trim();
    if (!name.startsWith("--")) continue;
    vars[name.slice(2)] = line.slice(index + 1).trim().replace(/\s+/g, " ");
  }
  return vars;
}

const all = blocks(css);
const pick = (test) => Object.assign({}, ...all.filter((block) => test(block.selector)).map((block) => declarations(block.body)));

const rootVars = pick((selector) => selector === ":root");
const lightVars = pick((selector) => selector === '[data-theme="light"]');
// Ikkinchi dark bloki faqat `--color-*` ni qayta bog'laydi — `@theme` bilan bir xil.
const darkVars = pick((selector) => selector.includes('[data-theme="dark"]') && selector.includes(".dark"));
const themeVars = pick((selector) => selector === "@theme");

const scopes = {
  light: { ...rootVars, ...lightVars },
  dark: { ...rootVars, ...darkVars },
};

function resolveValue(value, scope, seen = new Set()) {
  return value.replace(/var\(--([a-z0-9-]+)(?:,\s*([^)]*))?\)/gi, (_, name, fallback) => {
    if (seen.has(name)) throw new Error(`Aylana havola: --${name}`);
    const raw = scope[name] ?? fallback;
    if (raw === undefined) throw new Error(`Topilmadi: --${name}`);
    return resolveValue(raw, scope, new Set([...seen, name]));
  });
}

/** `rgb(36 38 77 / 0.06)` -> `rgba(36, 38, 77, 0.06)`; boshqasi o'zgarmaydi. */
function normalizeColors(value) {
  return value.replace(/rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)/g, (_, r, g, b, a) => {
    if (a === undefined) return `rgb(${r}, ${g}, ${b})`;
    const alpha = a.endsWith("%") ? Number(a.slice(0, -1)) / 100 : Number(a);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  });
}

/** `calc(16px * var(--text-scale))` / `16px` -> 16 (masshtab RN'da qo'llanadi). */
function px(value) {
  const match = /(-?[\d.]+)px/.exec(value);
  if (!match) throw new Error(`px emas: ${value}`);
  return Number(match[1]);
}

function letterSpacing(value, fontSize) {
  if (value.endsWith("em")) return Math.round(Number(value.slice(0, -2)) * fontSize * 100) / 100;
  return px(value);
}

const out = { colors: {}, shadows: {}, gradients: {}, type: {}, radius: {} };

for (const [scheme, scope] of Object.entries(scopes)) {
  out.colors[scheme] = {};
  out.shadows[scheme] = {};
  out.gradients[scheme] = {};
  for (const [name, value] of Object.entries(themeVars)) {
    if (name.startsWith("color-")) {
      out.colors[scheme][name.slice(6)] = normalizeColors(resolveValue(value, scope));
    } else if (name.startsWith("shadow-")) {
      // `@theme` dagi `--shadow-xs: var(--shadow-xs)` — o'z-o'ziga; qiymat temada.
      out.shadows[scheme][name.slice(7)] = normalizeColors(resolveValue(scope[name] ?? value, scope));
    }
  }
  for (const name of Object.keys(scope).filter((key) => key.startsWith("gradient-"))) {
    // RN birliksiz `0` pozitsiyani tushunmaydi (butun gradient tashlab yuboriladi) — `0%`.
    const css = normalizeColors(resolveValue(scope[name], scope)).replace(/ 0(?=[,)])/g, " 0%");
    out.gradients[scheme][name.slice(9)] = css;
  }
}

for (const [name, value] of Object.entries(themeVars)) {
  if (name.startsWith("radius-")) out.radius[name.slice(7)] = px(value);
  const match = /^text-([a-z0-9-]+?)$/.exec(name);
  if (!match || name.includes("--")) continue;
  const id = match[1];
  const read = (suffix) => themeVars[`text-${id}--${suffix}`];
  const fontSize = px(resolveValue(value, scopes.light));
  const lineHeight = read("line-height");
  const weight = read("font-weight");
  const spacing = read("letter-spacing");
  out.type[id] = {
    fontSize,
    lineHeight: lineHeight ? px(resolveValue(lineHeight, scopes.light)) : Math.round(fontSize * 1.5),
    fontWeight: weight ? String(resolveValue(weight, scopes.light)) : "400",
    letterSpacing: spacing ? letterSpacing(resolveValue(spacing, scopes.light), fontSize) : 0,
  };
}

const header = {
  $comment:
    "GENERATSIYA QILINGAN — QO'LDA TAHRIRLAMANG. Manba: veb src/shared/styles/design-tokens.css. Qayta yaratish: npm run build:ds-tokens",
};
writeFileSync(TARGET, `${JSON.stringify({ ...header, ...out }, null, 2)}\n`);
console.log(
  `ds-tokens.json: ${Object.keys(out.colors.light).length} rang, ${Object.keys(out.type).length} matn uslubi, ` +
    `${Object.keys(out.shadows.light).length} soya, ${Object.keys(out.gradients.light).length} gradient`
);
