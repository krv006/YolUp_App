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
    newArchEnabled: true,
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#f5f7fa",
    },
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
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
        backgroundColor: "#f5f7fa",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
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
    ],
    experiments: { typedRoutes: true },
    extra: {
      appName: "Fokus",
      appEnv: VARIANT,
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
      wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? DEFAULT_WS_URL,
      requestTimeout: Number(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT ?? 15_000),
    },
  };
};
