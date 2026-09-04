const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const prettier = require("eslint-config-prettier/flat");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

const SOURCE = "**/*.{js,jsx,ts,tsx}";

/**
 * Veb loyihadagi (`Edu_Front/eslint.config.js`) qatlam chegaralari shu yerda
 * AYNAN takrorlanadi — struktura bir xil bo'lgani uchun qoidalar ham bir xil.
 *
 * FSD: app > pages > widgets > modules > shared
 */
module.exports = defineConfig([
  globalIgnores(["dist", "node_modules", ".expo", "android", "ios", "src/shared/styles/global.css"]),
  expoConfig,
  prettier,
  {
    files: [SOURCE],
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Domen qatlami veb'dan ko'chirilgan — konsol chiqishi u yerda ham yo'q.
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // --- Veb loyiha bilan moslik ---
      // Quyidagi ikki qoida eslint-config-expo dan keladi, lekin veb loyihada
      // yo'q. 🟢 NUSXA fayllar bayt-bayt ko'chiriladi va ularni tahrirlash
      // taqiqlangan (MOBILE_PLAN §18.3) — shuning uchun uslub qoidasi manba
      // loyihaga moslashtiriladi, teskarisi emas.
      "@typescript-eslint/array-type": "off",
      // `export const ApiError = AppError` + bir nomli tip — eski nom uchun
      // ataylab qilingan alias (api-error.ts).
      "@typescript-eslint/no-redeclare": "off",
    },
  },

  // --- Qatlam chegaralari ---
  {
    files: [`src/shared/${SOURCE}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**", "@/pages/**", "@/widgets/**", "@/modules/**"],
              message: "Shared qatlam yuqoridagi hech bir qatlamga bog'lanmasligi kerak.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [`src/modules/${SOURCE}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**", "@/pages/**", "@/widgets/**"],
              message: "Domain modul app, page yoki widget qatlamini import qilmasligi kerak.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [`src/widgets/${SOURCE}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**", "@/pages/**"],
              message: "Widget app yoki page qatlamini import qilmasligi kerak.",
            },
          ],
        },
      ],
    },
  },

  // --- Platforma tozaligi ---
  // Domen qatlami (api/lib/model) veb'dan bayt-bayt ko'chiriladi; unda RN yoki
  // Expo importi paydo bo'lsa — port toifasi buzilgan (MOBILE_PLAN §18.5).
  {
    files: [
      "src/modules/*/api/**/*.ts",
      "src/modules/*/lib/**/*.ts",
      "src/modules/*/model/**/*.ts",
      "src/modules/*/constants/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react-native", "react-native/*", "expo", "expo-*", "nativewind"],
              message:
                "Domen qatlami platformadan mustaqil bo'lishi kerak. Platforma kodi @/shared/api yoki @/shared/lib ichida.",
            },
            {
              group: ["@/app/**", "@/pages/**", "@/widgets/**"],
              message: "Domain modul app, page yoki widget qatlamini import qilmasligi kerak.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "window", message: "Domen qatlamida DOM yo'q." },
        { name: "document", message: "Domen qatlamida DOM yo'q." },
        { name: "localStorage", message: "@/shared/lib/storage ishlating." },
      ],
    },
  },

  // Navigatsiya — istisno.
  // Veb loyihada `model/` qatlami `react-router-dom` ni ishlatishi mumkin
  // (masalan `use-chat.ts`: guruhdan chiqarilganda ro'yxatga qaytariladi).
  // Mobilda uning ekvivalenti `expo-router`, shuning uchun aynan shu paket
  // MODEL qatlamida ochiq qoladi — qolgan platforma paketlari baribir yopiq.
  {
    files: ["src/modules/*/model/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react-native", "react-native/*", "nativewind"],
              message:
                "Domen qatlami platformadan mustaqil bo'lishi kerak. Platforma kodi @/shared/api yoki @/shared/lib ichida.",
            },
            {
              group: ["@/app/**", "@/pages/**", "@/widgets/**"],
              message: "Domain modul app, page yoki widget qatlamini import qilmasligi kerak.",
            },
          ],
        },
      ],
    },
  },
]);
