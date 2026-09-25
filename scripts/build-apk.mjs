#!/usr/bin/env node
/**
 * Telefonga o'rnatish uchun release APK quradi.
 *
 * Nega alohida skript (oddiy `expo run:android --variant release` emas):
 *
 *  1. ARXITEKTURA. `expo run:android` ULANGAN qurilmaning ABI'sini oladi.
 *     Emulyatorda bu `x86_64` bo'ladi va bunday APK HECH QANDAY telefonga
 *     o'rnatilmaydi. Bu yerda ABI ataylab qo'lda beriladi.
 *
 *  2. `-PreactNativeArchitectures` BERILMASA Gradle to'rtala ABI uchun
 *     quradi, ~5 GB xotira so'raydi va demon halok bo'ladi (DECISIONS §18).
 *
 *  3. VARIANT. Standart holatda loyiha `development` variantida quriladi —
 *     paket `uz.yolup.edu.dev`, nomi "YolUp (Dev)". Telefondagi haqiqiy
 *     ilova uchun `production` kerak.
 *
 *  4. PREBUILD. Ikonka, splash va imzolash `android/` ichiga aynan
 *     prebuild vaqtida yoziladi. Assetlar o'zgarsa, prebuildsiz eski
 *     ikonka qolib ketadi.
 *
 * Ishlatilishi:
 *   npm run apk                          # production, arm64 + armeabi-v7a
 *   APP_VARIANT=staging npm run apk      # beta qurilishi
 *   ANDROID_ABIS=arm64-v8a npm run apk   # faqat zamonaviy telefonlar (tezroq)
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VARIANT = process.env.APP_VARIANT ?? "production";
// arm64-v8a — 2017 yildan keyingi barcha telefonlar.
// armeabi-v7a — eskiroq va arzon qurilmalar; ular hali ham ko'p.
const ABIS = process.env.ANDROID_ABIS ?? "arm64-v8a,armeabi-v7a";

// Windows'da `npx` va `gradlew.bat` — `.cmd` fayllar, ular shellsiz
// ishga tushmaydi (`spawnSync npx ENOENT`).
const WINDOWS = process.platform === "win32";

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: WINDOWS,
    env: { ...process.env, APP_VARIANT: VARIANT },
    ...options,
  });

console.log(`\n▸ Variant: ${VARIANT}`);
console.log(`▸ Arxitekturalar: ${ABIS}\n`);

console.log("▸ 1/2  Nativ loyiha qayta yaratilmoqda (ikonka, splash, imzolash)…");

/*
 * `--clean` afzal: eski paket nomi, ikonka va imzolash qoldiqlari
 * butunlay yo'qoladi. Lekin Windows'da Android Studio ochiq bo'lsa yoki
 * terminal `android/` ichida tursa, papkani o'chirib bo'lmaydi (EBUSY).
 * Bunday holda ish to'xtamaydi — prebuild joyida bajariladi.
 */
try {
  run("npx", ["expo", "prebuild", "--clean", "--platform", "android"]);
} catch {
  console.warn("");
  console.warn("⚠  android/ papkasini tozalab bo'lmadi (band).");
  console.warn("   Android Studio ochiq bo'lsa yoping va qayta urinib ko'ring.");
  console.warn("   Hozircha prebuild JOYIDA bajarilmoqda — natijani tekshiring.");
  console.warn("");
  run("npx", ["expo", "prebuild", "--platform", "android"]);
}

console.log("\n▸ 2/2  Release APK yig'ilmoqda…");
/*
 * TO'LIQ YO'L bilan chaqiriladi.
 *
 * `shell: true` bilan buyruq cmd.exe orqali o'tadi va u yerda joriy
 * katalogdagi `gradlew.bat` topilmay qoladi ("is not recognized as an
 * internal or external command"), garchi `cwd` to'g'ri berilgan bo'lsa ham.
 */
const gradlew = join(ROOT, "android", WINDOWS ? "gradlew.bat" : "gradlew");
run(gradlew, [
  "app:assembleRelease",
  `-PreactNativeArchitectures=${ABIS}`,
  "-x",
  "lint",
  "-x",
  "test",
  "--no-parallel",
], { cwd: join(ROOT, "android") });

const apk = join(ROOT, "android/app/build/outputs/apk/release/app-release.apk");
if (!existsSync(apk)) {
  console.error("\n✖ APK topilmadi — yuqoridagi xatoni ko'ring.");
  process.exit(1);
}

console.log(`\n✔ Tayyor: ${apk}`);
console.log("\nTelefonga o'rnatish:");
console.log("  • USB orqali:  adb install -r " + apk);
console.log("  • yoki APK faylni telefonga ko'chirib, fayl menejeridan oching");
console.log("    (Android 'noma'lum manbadan o'rnatish' ruxsatini so'raydi)");
