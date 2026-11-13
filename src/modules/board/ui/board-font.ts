import { Platform } from "react-native";
import { matchFont, type SkFont } from "@shopify/react-native-skia";

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

/** Kod bloki shrifti — veb `CODE_FONT` (monospace) o'rnida tizim monospace'i. */
export const CODE_FONT_FAMILY = Platform.select({
  ios: "Menlo",
  default: "monospace",
}) as string;

export type BoardFontWeight = "400" | "600" | "700" | "800";

const fonts = new Map<string, SkFont>();

function cached(key: string, create: () => SkFont): SkFont {
  let font = fonts.get(key);
  if (!font) {
    font = create();
    fonts.set(key, font);
  }
  return font;
}

/**
 * Doska matni shrifti (o'lcham, qalinlik, kursiv bo'yicha keshlangan):
 * `matchFont` har chaqirilganda tizim shrift menejeriga boradi, doskada
 * esa yuzlab element bo'lishi mumkin. Veb matni `font-weight: 600`.
 */
export function boardFont(size: number, weight: BoardFontWeight = "600", italic = false): SkFont {
  return cached(`${BOARD_FONT_FAMILY}|${size}|${weight}|${italic ? "i" : "n"}`, () =>
    matchFont({ fontFamily: BOARD_FONT_FAMILY, fontSize: size, fontWeight: weight, fontStyle: italic ? "italic" : "normal" })
  );
}

/** Kod bloki shrifti (monospace, oddiy qalinlik). */
export function codeFont(size: number): SkFont {
  return cached(`${CODE_FONT_FAMILY}|${size}`, () => matchFont({ fontFamily: CODE_FONT_FAMILY, fontSize: size, fontWeight: "400" }));
}
