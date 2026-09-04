#!/usr/bin/env node
/**
 * Har bir tashqi import `package.json` da e'lon qilinganini tekshiradi.
 *
 * NEGA KERAK: mobil loyiha veb loyiha (Edu_Front) papkasi ICHIDA turadi.
 * Node va TypeScript modul topolmasa yuqoriga qarab qidiradi — natijada
 * `sonner`, `react-dom`, `dompurify` kabi VEB paketlari `tsc` dan jimgina
 * o'tib ketardi va faqat qurilmada, ishga tushirishda yiqilardi.
 *
 * Metro tomonda bu `disableHierarchicalLookup` bilan yopilgan
 * (metro.config.js), lekin `tsc` da bunday sozlama yo'q — shuning uchun
 * tekshiruv skript sifatida bajariladi.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { builtinModules } from "node:module";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
  ...builtinModules,
]);

/** metro.config.js / tsconfig.json da ataylab yo'naltirilgan modullar. */
const ALIASES = new Set(["sonner"]);

const IMPORT_PATTERN = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s+["']([^"']+)["']/g;
const REQUIRE_PATTERN = /require\(\s*["']([^"']+)["']\s*\)/g;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) files.push(path);
  }
  return files;
}

/** `@scope/name/sub` -> `@scope/name`, `name/sub` -> `name` */
function packageName(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

const problems = [];

for (const file of walk(SRC)) {
  const source = readFileSync(file, "utf8");
  const specifiers = new Set();
  for (const pattern of [IMPORT_PATTERN, REQUIRE_PATTERN]) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) specifiers.add(match[1]);
  }

  for (const specifier of specifiers) {
    // Nisbiy yo'l, `@/` aliasi va nomodul manbalar tekshirilmaydi.
    if (specifier.startsWith(".") || specifier.startsWith("@/")) continue;
    if (specifier.startsWith("node:")) continue;
    if (ALIASES.has(specifier)) continue;

    const name = packageName(specifier);
    if (!declared.has(name)) {
      problems.push({ file: file.slice(ROOT.length + 1), specifier, name });
    }
  }
}

if (problems.length === 0) {
  console.log("✔ Barcha importlar package.json da e'lon qilingan.");
  process.exit(0);
}

console.error(`✖ ${problems.length} ta e'lon qilinmagan import topildi:\n`);
for (const { file, specifier, name } of problems) {
  console.error(`  ${file}`);
  console.error(`    "${specifier}"  ->  "${name}" package.json da yo'q`);
}
console.error(
  "\nBu paket veb loyihaning node_modules idan kelayotgan bo'lishi mumkin." +
    "\nYo o'rnating, yo metro.config.js dagi ALIASES ga shim qo'shing."
);
process.exit(1);
