#!/usr/bin/env node
/**
 * Chiqarish uchun release paketi quradi: APK yoki AAB.
 *
 *   APK — telefonga to'g'ridan-to'g'ri o'rnatish uchun (PM ga ko'rsatish,
 *         sinov). Faylni yuborasiz, u ochib o'rnatadi.
 *   AAB — PLAY MARKET uchun. Do'kon 2021 yildan beri APK qabul qilmaydi.
 *         AAB ichida barcha arxitekturalar turadi, Google har qurilmaga
 *         moslab o'zi kesib beradi.
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
 *   npm run apk                          # APK, production
 *   npm run aab                          # AAB, Play Market uchun
 *   APP_VARIANT=staging npm run apk      # beta qurilishi
 *   ANDROID_ABIS=arm64-v8a npm run apk   # faqat zamonaviy telefonlar (tezroq)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VARIANT = process.env.APP_VARIANT ?? "production";

/** `apk` (standart) yoki `aab`. */
const FORMAT = (process.argv[2] ?? "apk").toLowerCase();
if (FORMAT !== "apk" && FORMAT !== "aab") {
  console.error(`✖ Noma'lum format: "${FORMAT}". Faqat "apk" yoki "aab".`);
  process.exit(1);
}

const TARGETS = {
  apk: {
    task: "app:assembleRelease",
    output: "android/app/build/outputs/apk/release/app-release.apk",
    label: "APK",
  },
  aab: {
    task: "app:bundleRelease",
    output: "android/app/build/outputs/bundle/release/app-release.aab",
    label: "AAB",
  },
};
const target = TARGETS[FORMAT];
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

const version = JSON.parse(readFileSync(join(ROOT, "version.json"), "utf8"));

console.log(`\n▸ Format: ${target.label}`);
console.log(`▸ Variant: ${VARIANT}`);
console.log(`▸ Versiya: ${version.version} (versionCode ${version.versionCode})`);
console.log(`▸ Arxitekturalar: ${ABIS}\n`);

/*
 * Imzolash haqida OGOHLANTIRISH.
 *
 * `credentials/` bo'lmasa plugin jim o'tadi va Expo'ning debug kaliti
 * ishlatiladi. Bunday fayl telefonga o'rnatiladi, lekin Play Market uni
 * RAD ETADI — va buni faqat yuklash paytida aytadi. Shuning uchun AAB
 * quruvchiga oldindan aytiladi.
 */
if (FORMAT === "aab" && !existsSync(join(ROOT, "credentials", "release.json"))) {
  console.warn("⚠  credentials/ topilmadi — paket DEBUG kaliti bilan imzolanadi.");
  console.warn("   Play Market bunday faylni qabul qilmaydi.\n");
}

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

console.log(`\n▸ 2/2  Release ${target.label} yig'ilmoqda…`);
/*
 * TO'LIQ YO'L bilan chaqiriladi.
 *
 * `shell: true` bilan buyruq cmd.exe orqali o'tadi va u yerda joriy
 * katalogdagi `gradlew.bat` topilmay qoladi ("is not recognized as an
 * internal or external command"), garchi `cwd` to'g'ri berilgan bo'lsa ham.
 */
const gradlew = join(ROOT, "android", WINDOWS ? "gradlew.bat" : "gradlew");
run(gradlew, [
  target.task,
  `-PreactNativeArchitectures=${ABIS}`,
  "-x",
  "lint",
  "-x",
  "test",
  "--no-parallel",
], { cwd: join(ROOT, "android") });

const artifact = join(ROOT, target.output);
if (!existsSync(artifact)) {
  console.error(`\n✖ ${target.label} topilmadi — yuqoridagi xatoni ko'ring.`);
  process.exit(1);
}

console.log(`\n✔ Tayyor: ${artifact}`);

if (FORMAT === "apk") {
  console.log("\nTelefonga o'rnatish:");
  console.log("  • USB orqali:  adb install -r " + artifact);
  console.log("  • yoki APK faylni telefonga ko'chirib, fayl menejeridan oching");
  console.log("    (Android 'noma'lum manbadan o'rnatish' ruxsatini so'raydi)");
} else {
  console.log("\nPlay Console'ga yuklash:");
  console.log("  1. play.google.com/console -> ilova -> Release");
  console.log("  2. Yo'lakni tanlang (boshida Internal testing)");
  console.log("  3. Shu .aab faylni yuklang va release notes yozing");
  console.log(`\n  Keyingi chiqarishda versionCode oshirilsin: npm run version:bump`);
}
