import { create } from "zustand";
import { storage } from "@/shared/lib/storage";

/**
 * Matn o'lchami — veb `text-size.store.ts` ning mobil varianti.
 *
 * 🟡 MOSLASH. Vebda `--text-scale` CSS o'zgaruvchisi barcha `--fs-*`
 * tokenlarini ko'paytiradi. Mobilda bu `Text` komponentida qilinadi
 * (`text-scale.tsx`): suhbat xabarlari o'z masshtabida qoladi, qolgan
 * barcha matn shu ko'paytuvchiga ergashadi. Saqlash `persist` o'rniga
 * MMKV bilan — boshqa do'konlar kabi.
 */
export type TextSize = "small" | "medium" | "large";

export const TEXT_SCALE: Record<TextSize, number> = {
  small: 0.92,
  medium: 1,
  large: 1.12,
};

const KEY = "text-size";

function readSize(): TextSize {
  const value = storage.get(KEY);
  return value === "small" || value === "large" ? value : "medium";
}

interface TextSizeState {
  size: TextSize;
  setSize: (size: TextSize) => void;
}

export const useTextSizeStore = create<TextSizeState>()((set) => ({
  size: readSize(),
  setSize: (size) => {
    storage.set(KEY, size);
    set({ size });
  },
}));
