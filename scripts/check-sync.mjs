#!/usr/bin/env node
/**
 * Drift detektori: veb loyihada ko'chirilgan fayllar o'zgarganmi?
 *
 * Monorepo bo'lmagani uchun domen qatlami ikki nusxada yashaydi
 * (MOBILE_PLAN §0, §5). Bu — qabul qilingan narx, lekin u BOSHQARILADI:
 * `docs/PORTED.md` har bir faylning port paytidagi veb hash'ini saqlaydi,
 * shu skript esa hozirgi holat bilan solishtiradi.
 *
 * Mobil loyiha veb papkasi ichida turgani shu yerda foyda beradi — manba
 * `../src` da, qo'l ostida. Boshqa mashinada veb manbasi bo'lmasa, skript
 * ogohlantirib chiqadi (CI'ni yiqitmaydi).
 *
 * Ishga tushirish: har sprint boshida, va backend DTO o'zgargan har safar.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEB_ROOT = resolve(ROOT, "..");
const MANIFEST = join(ROOT, "docs/PORTED.md");

if (!existsSync(MANIFEST)) {
  console.error("✖ docs/PORTED.md topilmadi. `npm run build:ported` ishga tushiring.");
  process.exit(1);
}

if (!existsSync(join(WEB_ROOT, "src"))) {
  console.warn(
    "⚠ Veb manbasi (../src) topilmadi — drift tekshiruvi o'tkazib yuborildi.\n" +
      "  Bu skript veb loyiha yonida turgan mashinada ishlaydi."
  );
  process.exit(0);
}

const manifest = readFileSync(MANIFEST, "utf8");
const commitMatch = manifest.match(/\*\*Manba:\*\* `[^`]+` @ `([^`]+)`/);
const portedCommit = commitMatch?.[1] ?? "noma'lum";

/** | `path` | 🟢 NUSXA | `hash` | izoh | */
const ROW = /^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|\s*(.*?)\s*\|$/gm;

const normalize = (text) => text.replace(/\r\n/g, "\n");
const sha = (content) => createHash("sha256").update(content).digest("hex").slice(0, 12);

const drifted = [];
const missing = [];
let checked = 0;

let row;
while ((row = ROW.exec(manifest)) !== null) {
  const [, path, category, hash, note] = row;
  if (hash === "—") continue;

  const webPath = join(WEB_ROOT, path);
  if (!existsSync(webPath)) {
    missing.push({ path, category });
    continue;
  }

  checked += 1;
  const current = sha(normalize(readFileSync(webPath, "utf8")));
  if (current !== hash) drifted.push({ path, category, was: hash, now: current, note });
}

console.log(`Port manifesti: ${checked} fayl tekshirildi (veb @ ${portedCommit})\n`);

if (missing.length > 0) {
  console.warn(`⚠ ${missing.length} ta manba veb'da endi yo'q (ko'chirilgan yoki o'chirilgan):`);
  for (const { path } of missing) console.warn(`   ${path}`);
  console.warn("");
}

if (drifted.length === 0) {
  console.log("✔ Barcha ko'chirilgan fayllar veb bilan sinxron.");
  process.exit(missing.length > 0 ? 1 : 0);
}

console.error(`✖ ${drifted.length} ta fayl veb tomonda o'zgargan:\n`);
for (const { path, category, was, now, note } of drifted) {
  console.error(`  ${category}  ${path}`);
  console.error(`     ${was} -> ${now}${note && note !== "—" ? `   (mobil farqi: ${note})` : ""}`);
  console.error(`     farqni ko'rish:  git -C .. diff ${portedCommit}..HEAD -- ${path}`);
}
console.error(
  "\nHar birini ko'rib chiqing:\n" +
    "  🟢 NUSXA   -> veb'dan qayta ko'chiring\n" +
    "  🟡/🔴      -> o'zgarish mobilga ham tegishlimi, qo'lda birlashtiring\n" +
    "So'ng: npm run build:ported"
);
process.exit(1);
