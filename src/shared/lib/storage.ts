import { createMMKV } from "react-native-mmkv";

/**
 * Veb `src/shared/lib/storage.ts` ning mobil varianti.
 *
 * Interfeys aynan bir xil (`get`/`getJson`/`set`/`setJson`/`remove`), shu
 * jumladan sinxronligi — MMKV ham sinxron ishlaydi, shuning uchun bu yerda
 * hech qanday moslashtirish kerak emas.
 *
 * MAXFIY MA'LUMOT UCHUN EMAS: MMKV shifrlanmagan. Tokenlar
 * `@/shared/api/token-storage` (Keychain/Keystore) da saqlanadi.
 */
const mmkv = createMMKV({ id: "fokus" });

export const storage = {
  get(key: string, fallback: string | null = null): string | null {
    try {
      return mmkv.getString(key) ?? fallback;
    } catch {
      return fallback;
    }
  },

  getJson<T>(key: string, fallback: T | null = null): T | null {
    const value = this.get(key);
    if (value === null) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  },

  set(key: string, value: string | number | boolean): boolean {
    try {
      mmkv.set(key, String(value));
      return true;
    } catch {
      return false;
    }
  },

  setJson(key: string, value: unknown): boolean {
    return this.set(key, JSON.stringify(value));
  },

  remove(key: string): boolean {
    try {
      mmkv.remove(key);
      return true;
    } catch {
      return false;
    }
  },
};

/** TanStack Query persister va boshqa past darajali ehtiyojlar uchun. */
export const mmkvInstance = mmkv;
