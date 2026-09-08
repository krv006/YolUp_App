import { create } from "zustand";
import { storage } from "@/shared/lib";
import { DEFAULT_ACCENT } from "@/shared/ui/accents";

/**
 * Ko'rinish sozlamalari — mavzu, brend rangi, shrift o'lchami, chat foni.
 *
 * NEGA ALOHIDA STORE: bular ilova ishga tushishi bilan, foydalanuvchi
 * kirmasdan OLDIN ham kerak (login ekrani ham to'g'ri mavzuda chizilishi
 * kerak). Shuning uchun ular serverdagi profilga emas, qurilmadagi MMKV ga
 * yoziladi va sinxron o'qiladi — birinchi kadrda mavzu allaqachon to'g'ri
 * bo'ladi va ekran "miltillamaydi".
 */

export type ThemeMode = "light" | "dark" | "system";

/**
 * Shrift kattaligi ko'paytuvchisi.
 *
 * Chegara ataylab tor: 0.85 dan past bo'lsa matn o'qilmay qoladi, 1.3 dan
 * yuqorida esa tugma yorliqlari va tab nomlari sig'may, ikki qatorga
 * tushib ketadi.
 */
export const MIN_FONT_SCALE = 0.85;
export const MAX_FONT_SCALE = 1.3;
/**
 * Slayder qadami.
 *
 * 0.05 — 10 ta oraliq. Undan mayda qilinsa, shrift o'zgarganda BUTUN ilova
 * qayta render bo'lgani uchun sudrash sekinlashadi; yirikroq qilinsa
 * "o'zim tanlayman" hissi yo'qoladi.
 */
export const FONT_SCALE_STEP = 0.05;

interface AppearanceState {
  mode: ThemeMode;
  /** `accents.ts` dagi rang identifikatori. */
  accent: string;
  fontScale: number;
  /**
   * O'z xabarlari puragining rangi. `null` — brend rangi ishlatiladi.
   * Telegramdagi kabi chatni alohida bo'yash imkoniyati.
   */
  bubbleAccent: string | null;
  /**
   * Purakcha uchun aralash (gradient) fon.
   *
   * USTUNLIK TARTIBI: `bubbleGradient` -> `bubbleAccent` -> brend rangi.
   * Ikkalasi alohida saqlanadi, chunki foydalanuvchi gradientdan oddiy
   * rangga qaytganda avvalgi rang tanlovi yo'qolmasligi kerak.
   */
  bubbleGradient: string | null;

  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: string) => void;
  setFontScale: (scale: number) => void;
  setBubbleAccent: (accent: string | null) => void;
  setBubbleGradient: (gradient: string | null) => void;
  reset: () => void;
}

const KEY = "appearance";

interface Persisted {
  mode: ThemeMode;
  accent: string;
  fontScale: number;
  bubbleAccent: string | null;
  bubbleGradient: string | null;
}

const DEFAULTS: Persisted = {
  mode: "system",
  accent: DEFAULT_ACCENT,
  fontScale: 1,
  bubbleAccent: null,
  bubbleGradient: null,
};

/** Buzilgan yoki eski qiymatlar ilovani sindirmasin. */
function sanitize(raw: Partial<Persisted> | null): Persisted {
  if (!raw) return DEFAULTS;
  const scale = Number(raw.fontScale);
  return {
    mode: raw.mode === "light" || raw.mode === "dark" ? raw.mode : "system",
    accent: typeof raw.accent === "string" ? raw.accent : DEFAULTS.accent,
    fontScale:
      Number.isFinite(scale) && scale >= MIN_FONT_SCALE && scale <= MAX_FONT_SCALE
        ? scale
        : DEFAULTS.fontScale,
    bubbleAccent: typeof raw.bubbleAccent === "string" ? raw.bubbleAccent : null,
    bubbleGradient: typeof raw.bubbleGradient === "string" ? raw.bubbleGradient : null,
  };
}

function persist(state: Persisted) {
  storage.setJson(KEY, state);
}

export const useAppearanceStore = create<AppearanceState>()((set, get) => ({
  ...sanitize(storage.getJson<Partial<Persisted>>(KEY)),

  setMode: (mode) => {
    set({ mode });
    persist(snapshot(get()));
  },
  setAccent: (accent) => {
    set({ accent });
    persist(snapshot(get()));
  },
  setFontScale: (fontScale) => {
    set({ fontScale });
    persist(snapshot(get()));
  },
  setBubbleAccent: (bubbleAccent) => {
    // Oddiy rang tanlanganda gradient o'chadi — aks holda u ustun bo'lib
    // qolib, tanlov ishlamagandek ko'rinardi.
    set({ bubbleAccent, bubbleGradient: null });
    persist(snapshot(get()));
  },
  setBubbleGradient: (bubbleGradient) => {
    set({ bubbleGradient });
    persist(snapshot(get()));
  },
  reset: () => {
    set(DEFAULTS);
    persist(DEFAULTS);
  },
}));

function snapshot(state: AppearanceState): Persisted {
  return {
    mode: state.mode,
    accent: state.accent,
    fontScale: state.fontScale,
    bubbleAccent: state.bubbleAccent,
    bubbleGradient: state.bubbleGradient,
  };
}
