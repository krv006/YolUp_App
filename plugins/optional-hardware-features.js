const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Ruxsatlardan kelib chiqadigan "majburiy" apparat xususiyatlarini ixtiyoriy
 * qiladi (`<uses-feature android:required="false">`).
 *
 * Nega: Play (2026-11-18, closed testing) ogohlantirdi — "Required hardware
 * feature declarations are restricting your app's availability":
 * - `android.hardware.screen.portrait` — `orientation: "portrait"` dan;
 * - `android.hardware.wifi` — LiveKit qo'shgan `ACCESS_WIFI_STATE` dan.
 * Bunday qurilmalarga (Wi-Fi'siz yoki faqat yotiq ekranli: ba'zi Chromebook,
 * Android XR) ilova o'rnatilmasdi. Ilova ikkalasisiz ham ishlaydi: mobil
 * internet bor, yotiq ekranda esa tizim portret oynani o'zi joylaydi.
 */
const FEATURES = ["android.hardware.wifi", "android.hardware.screen.portrait"];

module.exports = function withOptionalHardwareFeatures(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const existing = (manifest["uses-feature"] ?? []).filter((item) => !FEATURES.includes(item.$?.["android:name"]));
    manifest["uses-feature"] = [
      ...existing,
      ...FEATURES.map((name) => ({ $: { "android:name": name, "android:required": "false" } })),
    ];
    return config;
  });
};
