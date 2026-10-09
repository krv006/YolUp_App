#!/usr/bin/env node
/**
 * Chiqarish versiyasini oshiradi (`version.json`).
 *
 * NEGA SKRIPT: `versionCode` har chiqarishda oshishi SHART. Android eski
 * raqamli paketni yangilanish deb qabul qilmaydi, Play Market esa
 * yuklashni rad etadi — va buni faqat yuklash paytida, qurilish
 * tugagandan keyin aytadi. Qo'lda oshirish esa unutiladigan qadam.
 *
 * `version` (odamlar ko'radigan) ixtiyoriy: berilmasa o'zgarmaydi.
 * Uni oshirish MA'NOLI qaror — tuzatish uchun 0.1.1, yangi imkoniyat
 * uchun 0.2.0 — shuning uchun avtomatlashtirilmadi.
 *
 * Ishlatilishi:
 *   npm run version:bump             # versionCode +1
 *   npm run version:bump -- 0.2.0    # versionCode +1 va version 0.2.0
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "version.json");

const current = JSON.parse(readFileSync(FILE, "utf8"));
const nextCode = current.versionCode + 1;

const requested = process.argv[2];
if (requested && !/^\d+\.\d+\.\d+$/.test(requested)) {
  console.error(`✖ Versiya "x.y.z" ko'rinishida bo'lsin, "${requested}" emas.`);
  process.exit(1);
}

const next = {
  version: requested ?? current.version,
  versionCode: nextCode,
};

// Oxiridagi yangi qator — Prettier va git uchun.
writeFileSync(FILE, `${JSON.stringify(next, null, 2)}\n`);

console.log(`✔ ${current.version} (${current.versionCode})  ->  ${next.version} (${next.versionCode})`);
console.log("\n  version.json o'zgardi — commit qilishni unutmang.");
