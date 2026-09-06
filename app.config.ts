import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Fokus mobil ilova konfiguratsiyasi.
 *
 * Uch muhit (`APP_VARIANT`) alohida bundle ID oladi — shunda dev, staging va
 * prod bitta telefonda yonma-yon tura oladi va tester qaysi build ekanini
 * ilova nomidan ko'radi.
 *
 * Env qiymatlari shu yerdan `extra` ga o'tadi va `src/shared/config/env.ts`
 * ularni zod bilan tekshiradi (veb loyihadagi `env.ts` naqshi).
 */

type Variant = "development" | "staging" | "production";

const VARIANT = (process.env.APP_VARIANT ?? "development") as Variant;

const VARIANTS: Record<Variant, { name: string; idSuffix: string }> = {
  development: { name: "Fokus (Dev)", idSuffix: ".dev" },
  staging: { name: "Fokus (Beta)", idSuffix: ".staging" },
  production: { name: "Fokus", idSuffix: "" },
};

const BASE_ID = "uz.fokus.edu";

/** Prod backend — mobil veb proxy'siz to'g'ridan-to'g'ri uradi (MOBILE_PLAN §11 #4). */
const DEFAULT_API_URL = "https://edu.thesofmebel.uz";
const DEFAULT_WS_URL = "wss://edu.thesofmebel.uz";

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = VARIANTS[VARIANT];

  return {
    ...config,
    name: variant.name,
    slug: "fokus",
    version: "0.1.0",
    orientation: "portrait",
    scheme: "fokus",
    userInterfaceStyle: "automatic",
    icon: "./assets/icon.png",
    ios: {
      supportsTablet: true,
      bundleIdentifier: `${BASE_ID}${variant.idSuffix}`,
      infoPlist: {
        // Jonli dars fon rejimida uzilmasin (MOBILE_PLAN §7.2).
        UIBackgroundModes: ["audio"],
        NSCameraUsageDescription:
          "Jonli darsda kameradan foydalanish va uy vazifasiga rasm biriktirish uchun.",
        NSMicrophoneUsageDescription:
          "Jonli darsda gapirish va og'zaki vazifani yozib topshirish uchun.",
        NSPhotoLibraryUsageDescription:
          "Uy vazifasiga rasm yoki hujjat biriktirish uchun.",
      },
    },
    android: {
      package: `${BASE_ID}${variant.idSuffix}`,
      /*
       * Har YANGI APK uchun bu son OSHISHI SHART. Android eski
       * `versionCode` li paketni yangilanish deb qabul qilmaydi, telefon
       * "ilova o'rnatilmadi" deydi. `version` (0.1.0) — bu odamlar uchun,
       * `versionCode` — tizim uchun.
       */
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
        backgroundColor: "#1a66e0",
      },
      predictiveBackGestureEnabled: false,
      /*
       * LiveKit/WebRTC uchun ruxsatlar. `@livekit/react-native` da Expo
       * config plugini YO'Q, shuning uchun ular shu yerda qo'lda beriladi —
       * aks holda prebuild'dan keyin kamera va mikrofon jimgina ishlamaydi.
       */
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        // Simsiz quloqchin bilan gapirish uchun.
        "android.permission.BLUETOOTH_CONNECT",
        // Dars fon rejimiga o'tganda ovoz uzilmasligi uchun.
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
        // Ekran ulashish (Android; iOS'da Broadcast Extension kerak — v1.1).
        "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
      ],
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: "#f5f7fa",
          dark: { backgroundColor: "#0f1319" },
        },
      ],
      // Dars yozuvini "picture in picture" da ko'rish uchun.
      ["expo-video", { supportsPictureInPicture: true }],
      [
        "expo-build-properties",
        {
          // WebRTC minimal Android API 24 talab qiladi.
          android: { minSdkVersion: 24 },
          // Expo SDK 57 ning minimal talabi (LiveKit undan pastini kutadi).
          ios: { deploymentTarget: "16.4" },
        },
      ],
      // Release APK'ni haqiqiy kalit bilan imzolaydi. `credentials/`
      // bo'lmasa jim o'tadi va debug kaliti ishlatiladi.
      "./plugins/with-release-signing",
    ],
    // typedRoutes ATAYLAB o'chiq: marshrut yo'llari veb'dan ko'chirilgan
    // `shared/config/routes.ts` dan oddiy `string` sifatida keladi (masalan
    // `resolveHomeRoute(user)`). Typed routes ularning har birida cast talab
    // qilardi. Faza 1 da ROUTES tiplanganidan keyin yoqiladi.
    experiments: { typedRoutes: false },
    extra: {
      appName: "Fokus",
      appEnv: VARIANT,
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
      wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? DEFAULT_WS_URL,
      requestTimeout: Number(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT ?? 15_000),
    },
  };
};
