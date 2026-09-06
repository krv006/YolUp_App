const { withAppBuildGradle, withDangerousMod } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Release APK'ni HAQIQIY kalit bilan imzolaydi.
 *
 * Nega plugin kerak: `android/` papkasi git'da yo'q va `expo prebuild`
 * uni har safar qaytadan yaratadi. Imzolashni qo'lda `build.gradle` ga
 * yozsak, birinchi prebuild'da yo'qoladi. Plugin esa har prebuild'da
 * o'z-o'zidan qayta qo'llanadi.
 *
 * Kalit va parollar `credentials/` da (git'ga KIRMAYDI):
 *   credentials/fokus-release.keystore
 *   credentials/release.json  ->  { storeFile, keyAlias, storePassword, keyPassword }
 *
 * Ular bo'lmasa plugin JIM o'tadi va Expo'ning odatdagi debug kaliti
 * ishlatiladi — ya'ni kalitsiz ham loyiha quriladi (yangi dasturchi
 * uchun muhim), faqat u APK do'konga yaramaydi.
 *
 * ⚠️ `credentials/` ni ZAXIRALANG. Kalit yo'qolsa, Play Store'dagi
 * ilovani YANGILAB BO'LMAYDI — Google boshqa kalit bilan imzolangan
 * yangilanishni qabul qilmaydi.
 */

const CREDENTIALS_DIR = "credentials";
const CONFIG_FILE = "release.json";

function readCredentials(projectRoot) {
  const configPath = path.join(projectRoot, CREDENTIALS_DIR, CONFIG_FILE);
  if (!fs.existsSync(configPath)) return null;

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const keystorePath = path.join(projectRoot, CREDENTIALS_DIR, config.storeFile);
  if (!fs.existsSync(keystorePath)) return null;

  return { ...config, keystorePath };
}

/** Kalitni `android/app/` ga ko'chiradi — Gradle uni shu yerdan izlaydi. */
function withKeystoreCopy(config) {
  return withDangerousMod(config, [
    "android",
    (modConfig) => {
      const credentials = readCredentials(modConfig.modRequest.projectRoot);
      if (credentials) {
        const target = path.join(
          modConfig.modRequest.platformProjectRoot,
          "app",
          credentials.storeFile
        );
        fs.copyFileSync(credentials.keystorePath, target);
      }
      return modConfig;
    },
  ]);
}

function withSigningConfig(config) {
  return withAppBuildGradle(config, (modConfig) => {
    const credentials = readCredentials(modConfig.modRequest.projectRoot);
    if (!credentials) {
      console.warn(
        "[with-release-signing] credentials/ topilmadi — release debug kaliti bilan imzolanadi."
      );
      return modConfig;
    }

    let gradle = modConfig.modResults.contents;

    // Parollarda Groovy uchun xavfli belgi bo'lishi mumkin — ekranlaymiz.
    const BS = String.fromCharCode(92);
    const quote = (value) =>
      "'" + String(value).split(BS).join(BS + BS).split("'").join(BS + "'") + "'";

    const releaseSigning = `        release {
            storeFile file(${quote(credentials.storeFile)})
            storePassword ${quote(credentials.storePassword)}
            keyAlias ${quote(credentials.keyAlias)}
            keyPassword ${quote(credentials.keyPassword)}
        }
`;

    if (!gradle.includes("storeFile file(" + quote(credentials.storeFile))) {
      // `signingConfigs { debug { ... } }` dan keyin `release` blokini qo'shamiz.
      const anchor = "    signingConfigs {\n";
      if (!gradle.includes(anchor)) {
        throw new Error("[with-release-signing] build.gradle da signingConfigs topilmadi");
      }
      gradle = gradle.replace(anchor, anchor + releaseSigning);
    }

    // `buildTypes.release` debug kalitidan release kalitiga o'tkaziladi.
    gradle = gradle.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig signingConfigs.release"
    );

    modConfig.modResults.contents = gradle;
    return modConfig;
  });
}

module.exports = function withReleaseSigning(config) {
  return withKeystoreCopy(withSigningConfig(config));
};
