import { createContext, useContext, type ReactNode } from "react";
import { useAppearanceStore } from "@/shared/model/theme.store";
import { TEXT_SCALE, useTextSizeStore } from "@/shared/model/text-size.store";

/**
 * Matn o'lchami ko'paytuvchisi — FAQAT shu kontekst ichida.
 *
 * NEGA GLOBAL EMAS: dastlab ko'paytuvchi butun ilovaga qo'llanardi, lekin
 * bu noto'g'ri edi. Tugma yorliqlari, tab nomlari va sarlavhalar o'z
 * o'lchamiga moslab tuzilgan — ular kattalashsa, matn qutilarga sig'may,
 * ikki qatorga tushib ketadi va tartib buziladi.
 *
 * Telegramda ham bu sozlama faqat XABAR MATNIGA tegishli. Bizda ham
 * shunday: `MessageTextScale` bilan o'ralgan daraxt ichidagi `Text` lar
 * masshtablanadi, qolgan hamma joy o'z o'lchamida qoladi.
 */
const TextScaleContext = createContext<number | null>(null);

/**
 * O'ram ichida — xabar masshtabi, tashqarida — "Tizim sozlamalari"dagi
 * umumiy matn o'lchami (veb `--text-scale`, `text-size.store.ts`).
 */
export function useTextScale(): number {
  const local = useContext(TextScaleContext);
  const size = useTextSizeStore((state) => state.size);
  return local ?? TEXT_SCALE[size];
}

/**
 * Xabar matni uchun masshtab beradi.
 *
 * Suhbat ro'yxati va sozlamalardagi namuna shu bilan o'raladi. Bo'shashgan
 * qiymat (`1`) — ya'ni o'ramdan tashqarida hech narsa o'zgarmaydi.
 */
export function MessageTextScale({ children }: { children: ReactNode }) {
  const scale = useAppearanceStore((state) => state.messageScale);
  return <TextScaleContext.Provider value={scale}>{children}</TextScaleContext.Provider>;
}
