/**
 * Ilova shriftlari — veb `design-tokens.css` dagi `--font-heading` va
 * `--font-body`.
 *
 * ┌─ NEGA IKKI OILA ──────────────────────────────────────────────────────┐
 * │ Vebda sarlavhalar "Unbounded" (geometrik, qalinroq), qolgan matn esa  │
 * │ "Onest" bilan chiziladi. Mobil ilovada ilgari hech qanday maxsus      │
 * │ shrift yuklanmasdi va hamma narsa tizim shriftida ko'rinardi — bu     │
 * │ veb bilan solishtirganda eng ko'zga tashlanadigan farq edi.            │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ NEGA HAR QALINLIK UCHUN ALOHIDA FAYL ────────────────────────────────┐
 * │ Androidda RN maxsus shrift uchun qalinlikni O'ZI yasay olmaydi:       │
 * │ `fontWeight: "600"` berilsa ham, oilada faqat bitta fayl bo'lsa, matn │
 * │ bir xil qalinlikda chiqadi (iOS'da esa sun'iy qalinlashtiradi va      │
 * │ harflar buziladi). Shuning uchun har qalinlik alohida fayl va alohida │
 * │ OILA NOMI bilan yuklanadi, tanlov esa `fontFamily` orqali qilinadi.    │
 * └───────────────────────────────────────────────────────────────────────┘
 */

/** `useFonts` ga beriladigan xarita: oila nomi -> fayl. */
export const FONT_ASSETS = {
  "Onest-Regular": require("../../../assets/fonts/Onest-Regular.ttf"),
  "Onest-Medium": require("../../../assets/fonts/Onest-Medium.ttf"),
  "Onest-SemiBold": require("../../../assets/fonts/Onest-SemiBold.ttf"),
  "Unbounded-Medium": require("../../../assets/fonts/Unbounded-Medium.ttf"),
  "Unbounded-SemiBold": require("../../../assets/fonts/Unbounded-SemiBold.ttf"),
} as const;

export type FontWeightToken = "400" | "500" | "600" | "700";

/**
 * Matn qalinligiga mos Onest fayli.
 *
 * 700 ALOHIDA YUKLANMAYDI: vebda ham eng qalini 600 (`--fw-title: 600`),
 * shuning uchun u SemiBold'ga tushadi.
 */
export function bodyFont(weight: FontWeightToken): string {
  if (weight === "600" || weight === "700") return "Onest-SemiBold";
  if (weight === "500") return "Onest-Medium";
  return "Onest-Regular";
}

/** Sarlavha shrifti — vebdagi `font-heading`. */
export function headingFont(weight: FontWeightToken): string {
  return weight === "600" || weight === "700" ? "Unbounded-SemiBold" : "Unbounded-Medium";
}

/**
 * Sarlavha harflari zich teriladi — veb `--tracking-heading: -0.02em`.
 * RN `letterSpacing` ni PIKSELDA oladi, shuning uchun o'lchamga ko'paytiriladi.
 */
export const HEADING_TRACKING = -0.02;
