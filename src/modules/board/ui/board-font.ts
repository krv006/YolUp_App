import { Platform } from "react-native";

/**
 * Doskadagi matn uchun Skia shrift OILASI — 🆕 mobil, vebda muqobili yo'q.
 *
 * Nomsiz `matchFont` ishlamaydi: qurilmada tekshirildi —
 * `matchFont({ fontSize })` shrift qaytaradi, lekin uning glifi yo'q
 * (`getTextWidth("A") === 0`) va matn chizilmaydi. Oila nomi berilganda
 * ishlaydi: `sans-serif` -> 13, `serif` -> 14, `Roboto` -> 0.
 *
 * iOS'da `sans-serif` aliasi yo'q, u yerda `Helvetica` ishlatiladi.
 *
 * Alohida faylda, chunki `board-stroke.tsx` va `rich-text-stroke.tsx`
 * ikkalasi ham shundan foydalanadi va ular bir-birini import qiladi —
 * bitta faylda tursa aylanma import bo'lardi.
 */
export const BOARD_FONT_FAMILY = Platform.select({
  ios: "Helvetica",
  default: "sans-serif",
}) as string;
