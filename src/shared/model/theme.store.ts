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
 * XABAR MATNI ko'paytuvchisi — butun ilovaga emas, faqat suhbat matniga.
 *
 * Global qilinmagani ataylab: tugma yorliqlari, tab nomlari va sarlavhalar
 * o'z o'lchamiga moslab tuzilgan, ular kattalashsa qutilarga sig'may
 * qoladi. Telegramda ham bu sozlama faqat xabarlarga tegishli.
 *
 * Chegara: 0.85 dan past bo'lsa matn o'qilmaydi, 1.6 dan yuqorida esa
 * purakcha ekranning ko'p qismini egallab ketadi.
 */
export const MIN_MESSAGE_SCALE = 0.85;
export const MAX_MESSAGE_SCALE = 1.6;
/** Slayder qadami — 0.05 bilan 15 ta oraliq chiqadi. */
export const MESSAGE_SCALE_STEP = 0.05;

interface AppearanceState {
  mode: ThemeMode;
  /** `accents.ts` dagi rang identifikatori. */
  accent: string;
  /** Xabar matni ko'paytuvchisi. */
  messageScale: number;
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
  setMessageScale: (scale: number) => void;
  setBubbleAccent: (accent: string | null) => void;
  setBubbleGradient: (gradient: string | null) => void;
  reset: () => void;
}

const KEY = "appearance";

interface Persisted {
  mode: ThemeMode;
  accent: string;
  messageScale: number;
  bubbleAccent: string | null;
  bubbleGradient: string | null;
}

const DEFAULTS: Persisted = {
  mode: "system",
  accent: DEFAULT_ACCENT,
  messageScale: 1,
  bubbleAccent: null,
  bubbleGradient: null,
};

/** Buzilgan yoki eski qiymatlar ilovani sindirmasin. */
function sanitize(raw: Partial<Persisted> | null): Persisted {
  if (!raw) return DEFAULTS;
  const scale = Number(raw.messageScale);
  return {
    mode: raw.mode === "light" || raw.mode === "dark" ? raw.mode : "system",
    accent: typeof raw.accent === "string" ? raw.accent : DEFAULTS.accent,
    messageScale:
      Number.isFinite(scale) && scale >= MIN_MESSAGE_SCALE && scale <= MAX_MESSAGE_SCALE
        ? scale
        : DEFAULTS.messageScale,
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
  setMessageScale: (messageScale) => {
    set({ messageScale });
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
    messageScale: state.messageScale,
    bubbleAccent: state.bubbleAccent,
    bubbleGradient: state.bubbleGradient,
  };
}
