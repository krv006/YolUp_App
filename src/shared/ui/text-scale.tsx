import { createContext, useContext, type ReactNode } from "react";
import { useAppearanceStore } from "@/shared/model/theme.store";

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
const TextScaleContext = createContext(1);

export function useTextScale(): number {
  return useContext(TextScaleContext);
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
