#!/usr/bin/env node
/**
 * Bir martalik port yordamchisi: veb modul barrel'laridan (`index.ts`) mobil
 * variantini yasaydi.
 *
 * Qoida sodda — `./ui/...` ga qaraydigan har bir export tashlab yuboriladi,
 * chunki UI qatlami ko'chirilmaydi (MOBILE_PLAN §5). Qo'shimcha `EXCLUDED`
 * ro'yxati esa ataylab ko'chirilmagan fayllarni chiqarib tashlaydi.
 *
 * Skript ATAYLAB repoda qoldirilgan: veb'da yangi modul paydo bo'lganda yoki
 * barrel o'zgarganda qayta ishga tushiriladi, natija qo'lda ko'rib chiqiladi.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = resolve(ROOT, "../src/modules");
const MOBILE = resolve(ROOT, "src/modules");

const MODULES = [
  "attendance", "auth", "board", "conversation", "course", "homework", "lesson",
  "live", "message", "notification", "parent", "permission", "quiz", "student",
];

/** UI'dan tashqari ko'chirilmagan modullar (MOBILE_PLAN §7.3, §2.3). */
const EXCLUDED = [
  "./lib/teacher-audio-recording",
  "./lib/teacher-video-recording",
  "./model/use-teacher-audio-recording",
  "./model/use-teacher-video-recording",
  "./lib/mathlive-loader",
];

const HEADER = (name) => `/**
 * \`${name}\` modulining mobil barrel'i.
 *
 * Veb \`src/modules/${name}/index.ts\` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, \`ui/\` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
`;

let changed = 0;

for (const name of MODULES) {
  const source = resolve(WEB, name, "index.ts");
  if (!existsSync(source)) {
    console.warn(`⚠ ${name}: veb barrel topilmadi`);
    continue;
  }

  const raw = readFileSync(source, "utf8");
  const statements = raw.match(/export[\s\S]*?;/g) ?? [];
  const kept = statements.filter((statement) => {
    if (/from\s+"\.\/ui\//.test(statement)) return false;
    return !EXCLUDED.some((path) => statement.includes(`"${path}"`));
  });

  const target = resolve(MOBILE, name, "index.ts");
  writeFileSync(target, `${HEADER(name)}${kept.join("\n")}\n`, "utf8");
  console.log(`✔ ${name}: ${kept.length}/${statements.length} eksport saqlandi`);
  changed += 1;
}

console.log(`\n${changed} ta barrel yozildi.`);
