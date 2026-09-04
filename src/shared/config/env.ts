import Constants from "expo-constants";
import { z } from "zod";

/**
 * Veb `src/shared/config/env.ts` ning mobil varianti.
 *
 * Farq faqat MANBADA: veb `import.meta.env` dan, mobil `app.config.ts` dagi
 * `extra` dan o'qiydi. Tekshiruv (zod) va chiqadigan `AppEnv` shakli AYNAN
 * bir xil — shuning uchun `env.apiUrl` ishlatadigan har qanday ko'chirilgan
 * kod o'zgartirilmaydi.
 *
 * Muhim farq: veb'da `apiUrl` bo'sh satr bo'lishi mumkin edi (Vite proxy /
 * Vercel rewrite nisbiy `/api/...` so'rovlarini o'zi yo'naltirardi). Mobilda
 * proxy YO'Q — manzil har doim absolyut bo'lishi shart (MOBILE_PLAN §11 #4).
 */

const envSchema = z.object({
  appName: z.string().trim().min(1).default("Fokus"),
  appEnv: z.enum(["development", "staging", "production"]).default("development"),
  apiUrl: z.string().trim().url("apiUrl absolyut URL bo'lishi kerak (mobilda proxy yo'q)"),
  wsUrl: z
    .string()
    .trim()
    .url("wsUrl to'g'ri WebSocket URL bo'lishi kerak")
    .refine(
      (value) => value.startsWith("ws://") || value.startsWith("wss://"),
      "wsUrl ws:// yoki wss:// bilan boshlanishi kerak"
    ),
  requestTimeout: z.coerce.number().int().min(1_000).max(120_000).default(15_000),
});

const parsedEnv = envSchema.safeParse(Constants.expoConfig?.extra ?? {});

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Environment konfiguratsiyasi noto'g'ri: ${details}`);
}

/** Oxiridagi `/` olib tashlanadi — yo'llar har doim `/` bilan boshlanadi. */
function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export interface AppEnv {
  readonly appName: string;
  readonly appEnv: "development" | "staging" | "production";
  readonly apiUrl: string;
  readonly wsUrl: string;
  readonly requestTimeout: number;
  readonly isProduction: boolean;
}

export const env: AppEnv = Object.freeze({
  appName: parsedEnv.data.appName,
  appEnv: parsedEnv.data.appEnv,
  apiUrl: normalizeBaseUrl(parsedEnv.data.apiUrl),
  wsUrl: normalizeBaseUrl(parsedEnv.data.wsUrl),
  requestTimeout: parsedEnv.data.requestTimeout,
  isProduction: parsedEnv.data.appEnv === "production",
});
