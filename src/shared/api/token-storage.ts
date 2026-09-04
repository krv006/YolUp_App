import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/shared/constants";

export interface TokenPair {
  accessToken?: string | null;
  refreshToken?: string | null;
}

/**
 * Veb `src/shared/api/token-storage.ts` ning mobil varianti.
 *
 * OMMAVIY INTERFEYS AYNAN BIR XIL — shu jumladan o'qish metodlarining
 * SINXRONligi. `ApiClient` va `RealtimeSocket` tokenni sinxron so'raydi;
 * agar bu yerda `Promise` qaytarsak, butun API qatlamini `async` ga
 * aylantirishga to'g'ri kelardi (MOBILE_PLAN §4.2).
 *
 * Yechim: tokenlar Keychain/Keystore da yashaydi, lekin ilova boshlanishida
 * bir marta xotiraga o'qiladi (`hydrate()`), keyin o'qish xotiradan bo'ladi.
 * Yozish xotiraga darhol, xavfsiz saqlashga fon rejimida ketadi.
 *
 * `sessionStorage` ekvivalenti mobilda yo'q: ilova yopilishi sessiya tugashi
 * degani emas. `persistent: false` — token faqat xotirada qoladi, diskka
 * yozilmaydi; ya'ni "meni eslab qolma" ilova qayta ochilganda chiqib ketadi.
 */

/** Diskka yoziladigan (persistent) kalitlar. */
const PERSISTED_KEYS = [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN] as const;

const memory = new Map<string, string>();
/** Xotirada bor, lekin ataylab diskka yozilmagan kalitlar. */
const ephemeral = new Set<string>();
let hydrated = false;

/**
 * SecureStore kalitlari `[A-Za-z0-9._-]` bo'lishi shart; `fokus_access_token`
 * shu qoidaga mos, shuning uchun kalitlar veb bilan bir xil qoladi.
 */
function persist(key: string, value: string | null): void {
  const write = value === null ? SecureStore.deleteItemAsync(key) : SecureStore.setItemAsync(key, value);
  // Fire-and-forget: UI tokenni allaqachon xotiradan ko'radi. Xatoni
  // yutmaymiz — qurilma xavfsiz saqlashni rad etsa buni bilishimiz kerak.
  void write.catch((error: unknown) => {
    console.warn("[token-storage] xavfsiz saqlashga yozib bo'lmadi", error);
  });
}

export const tokenStorage = {
  /**
   * Ilova boshlanishida BIR MARTA chaqiriladi (splash ostida).
   * Chaqirilmasa sessiya tiklanmaydi va foydalanuvchi har safar login qiladi.
   */
  async hydrate(): Promise<void> {
    if (hydrated) return;
    await Promise.all(
      PERSISTED_KEYS.map(async (key) => {
        try {
          const value = await SecureStore.getItemAsync(key);
          if (value) memory.set(key, value);
        } catch (error) {
          console.warn("[token-storage] xavfsiz saqlashdan o'qib bo'lmadi", error);
        }
      })
    );
    hydrated = true;
  },

  /** `hydrate()` tugaganmi — provider shunga qarab splash'ni yopadi. */
  isHydrated(): boolean {
    return hydrated;
  },

  getAccessToken: (): string | null => memory.get(STORAGE_KEYS.ACCESS_TOKEN) ?? null,

  getRefreshToken: (): string | null => memory.get(STORAGE_KEYS.REFRESH_TOKEN) ?? null,

  hasSession(): boolean {
    return Boolean(this.getAccessToken() || this.getRefreshToken());
  },

  /** Diskka yozilgan refresh token bor bo'lsa — "meni eslab qol" tanlangan. */
  isPersistent(): boolean {
    return memory.has(STORAGE_KEYS.REFRESH_TOKEN) && !ephemeral.has(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setTokens({ accessToken, refreshToken }: TokenPair, { persistent = true } = {}): void {
    this.clearTokens();
    const entries: [string, string | null | undefined][] = [
      [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
      [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
    ];
    for (const [key, value] of entries) {
      if (!value) continue;
      memory.set(key, value);
      if (persistent) persist(key, value);
      else ephemeral.add(key);
    }
  },

  clearTokens(): void {
    for (const key of PERSISTED_KEYS) {
      memory.delete(key);
      ephemeral.delete(key);
      persist(key, null);
    }
  },

  clear(): void {
    this.clearTokens();
  },
};
