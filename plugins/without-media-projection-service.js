const { withAndroidManifest } = require("expo/config-plugins");

/**
 * `react-native-webrtc` ning `MediaProjectionService` xizmatini manifestdan
 * olib tashlaydi (`tools:node="remove"`).
 *
 * Nega: xizmat kutubxonaning o'z manifestida `foregroundServiceType=
 * "mediaProjection"` bilan e'lon qilingan. Play yopiq/ochiq test va
 * production uchun har bir fon xizmati turiga e'lon va funksiyani
 * ko'rsatuvchi video talab qiladi. Android'da ekran ulashish hozircha
 * o'chirilgan (`FEATURES.androidScreenShare`, 2026-11-18 loyiha egasi
 * qarori) — xizmat ham, `FOREGROUND_SERVICE_MEDIA_PROJECTION` ruxsati ham
 * kerak emas.
 *
 * Qaytarish: `FEATURES.androidScreenShare = true` — `app.config.ts` bu
 * plaginni ulamaydi va ruxsatni qaytaradi; Play'da e'lon va video beriladi.
 */
const SERVICE = "com.oney.WebRTCModule.MediaProjectionService";

module.exports = function withoutMediaProjectionService(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$ = manifest.$ ?? {};
    manifest.$["xmlns:tools"] = manifest.$["xmlns:tools"] ?? "http://schemas.android.com/tools";
    const application = manifest.application?.[0];
    if (!application) return config;
    application.service = (application.service ?? []).filter((service) => service.$?.["android:name"] !== SERVICE);
    application.service.push({ $: { "android:name": SERVICE, "tools:node": "remove" } });
    return config;
  });
};
