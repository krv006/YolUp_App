import { create } from "zustand";
import { storage } from "@/shared/lib";

/**
 * Ilova tili.
 *
 * 🔴 MOBIL QAYTA YOZILDI. Veb `language.store.ts` zustand'ning `persist`
 * oraliq qatlamidan foydalanadi, u esa `localStorage` ga yozadi. Mobilda
 * `localStorage` yo'q va boshqa do'konlar ham MMKV bilan QO'LDA
 * saqlanadi (`theme.store.ts`), shuning uchun bu ham shunday.
 *
 * MMKV sinxron o'qiladi — til birinchi kadrdayoq to'g'ri bo'ladi va
 * ekran "miltillamaydi".
 *
 * Ommaviy interfeys veb bilan bir xil: `SUPPORTED_LANGUAGES`,
 * `DEFAULT_LANGUAGE`, `useLanguageStore`, `getStoredLanguage`.
 */

export const SUPPORTED_LANGUAGES = ["uz", "en", "ru"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "uz";

const KEY = "language";

function isSupported(value: unknown): value is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(value as AppLanguage);
}

/**
 * Birinchi ishga tushirishda QURILMA tilini olamiz.
 *
 * Vebda bunday qadam yo'q — u har doim o'zbekchadan boshlaydi. Telefonda
 * esa tizim tili allaqachon ma'lum va uni e'tiborsiz qoldirish g'alati:
 * rus tilidagi telefonda ilova o'zbekcha ochilardi. Qo'llab-quvvatlanmagan
 * til bo'lsa (masalan turkcha) — o'zbekchaga qaytamiz.
 */
function deviceLanguage(): AppLanguage {
  /*
   * Qurilma tili `Intl` dan olinadi — `expo-localization` ATAYLAB
   * qo'shilmadi. U nativ modul, ya'ni ilovani qaytadan yig'ishni talab
   * qilardi, beradigan qo'shimchasi esa shu yerda kerak emas.
   * Hermes'da `Intl` yoqilgan (sana formatlash allaqachon shunga tayanadi).
   */
  try {
    const locale = new Intl.DateTimeFormat().resolvedOptions().locale;
    const code = locale.split("-")[0]?.toLowerCase();
    if (isSupported(code)) return code;
  } catch {
    // `Intl` bo'lmasa — standart tilga qaytamiz.
  }
  return DEFAULT_LANGUAGE;
}

function initialLanguage(): AppLanguage {
  const saved = storage.get(KEY);
  return isSupported(saved) ? saved : deviceLanguage();
}

interface LanguageState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()((set) => ({
  language: initialLanguage(),
  setLanguage: (language) => {
    storage.set(KEY, language);
    set({ language });
  },
}));

export function getStoredLanguage(): AppLanguage {
  return useLanguageStore.getState().language;
}
