import { env } from "@/shared/config";

/**
 * Veb varianti `globalThis.location.origin` ga qaytardi (nisbiy `/media/...`
 * yo'llari Vercel rewrite orqali ishlagani uchun). Mobilda proxy ham,
 * `location` ham yo'q — manba har doim `env.apiUrl` (MOBILE_PLAN §11 #3).
 */
export function normalizeMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^(https?:|blob:|data:|file:)/i.test(value)) return value;
  return `${env.apiUrl}${value.startsWith("/") ? value : `/${value}`}`;
}
