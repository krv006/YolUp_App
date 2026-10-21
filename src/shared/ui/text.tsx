import {
  Text as RNText,
  StyleSheet,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";
import { useTheme } from "./theme";
import { useTextScale } from "./text-scale";
import { bodyFont, headingFont, HEADING_TRACKING, type FontWeightToken } from "./fonts";

/**
 * Tipografiya shkalasi veb `--fs-*` tokenlaridan (MOBILE_PLAN §8.1).
 * Har variant o'z qatorlar oralig'i bilan keladi — matn siqilgan ko'rinmasin.
 */
export type TextVariant =
  | "title"
  | "heading"
  | "subheading"
  | "body"
  | "label"
  | "caption";

/*
 * Qiymatlar veb `design-tokens.css` dagi MOBIL o'lchamlardan
 * (`@media (max-width: 1023px)` bloki):
 *
 *   title      <- --fs-h1    28/36/500
 *   heading    <- --fs-h2    22/30/500
 *   subheading <- --fs-h3    18/26/500
 *   body       <- --fs-body  16/24
 *   label      <- --fs-label 14/20
 *   caption    <- --fs-caption 12/16
 *
 * Ilgari bular eski `theme.css` dan olingan edi va hammasi bir-ikki
 * piksel kichik, qalinroq chiqardi.
 */
const VARIANTS: Record<TextVariant, { fontSize: number; lineHeight: number; fontWeight: "400" | "500" | "600" | "700" }> = {
  title: { fontSize: 28, lineHeight: 36, fontWeight: "500" },
  heading: { fontSize: 22, lineHeight: 30, fontWeight: "500" },
  subheading: { fontSize: 18, lineHeight: 26, fontWeight: "500" },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
};

/**
 * Sarlavha shriftida chiziladigan variantlar — vebdagi `font-heading`.
 *
 * Vebda u dialog sarlavhalari va h1/h2/h3 da ishlatiladi; qolgan matn
 * `font-body` (Onest) bilan ketadi.
 */
const HEADING_VARIANTS = new Set<TextVariant>(["title", "heading", "subheading"]);

/** `foreground` — asosiy matn, `muted` — ikkilamchi, `danger` — xato. */
export type TextTone = "default" | "muted" | "brand" | "danger" | "onPrimary";

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
}

export function Text({ variant = "body", tone = "default", style, ...rest }: TextProps) {
  const { palette } = useTheme();
  // Umumiy matn o'lchami (Tizim sozlamalari); `MessageTextScale` ichida
  // esa xabar masshtabi (izohi `text-scale.tsx` da).
  const fontScale = useTextScale();

  const color = {
    default: palette.foreground,
    muted: palette["muted-foreground"],
    brand: palette["primary-text"],
    danger: palette["destructive-strong"],
    onPrimary: palette["primary-foreground"],
  }[tone];

  /*
   * Shrift o'lchamini SHU YERDA ko'paytiramiz — bitta joyda.
   *
   * Uslublar avval yig'iladi (`flatten`), keyin natijaviy `fontSize`
   * ko'paytiriladi. Shu sabab chaqiruvchi o'z o'lchamini bergan holat ham
   * to'g'ri ishlaydi: masalan `<Text style={{ fontSize: 12 }}>` yoki
   * `chipLabel` kabi StyleSheet qiymatlari — ular ham masshtablanadi.
   * Agar ko'paytirish variantga qo'llanganda, chaqiruvchining uslubi uni
   * bekor qilib, o'sha matnlar masshtabga bo'ysunmay qolardi.
   *
   * `lineHeight` ham birga ko'payadi, aks holda katta shriftda qatorlar
   * bir-birining ustiga chiqib ketadi.
   */
  const merged: TextStyle = StyleSheet.flatten([VARIANTS[variant], style]) ?? {};

  /*
   * `tone` — faqat ZAXIRA rang.
   *
   * Chaqiruvchi `style={{ color }}` bergan bo'lsa, u USTUN turadi. Bu
   * qator bo'lmasa, quyidagi `{ color }` yig'ilgan uslubdan keyin
   * qo'llanib, chaqiruvchining rangini jimgina bekor qilardi — natijada
   * suhbat purakchasidagi matn yorug' mavzuda qora bo'lib, to'q purakcha
   * ustida o'qilmay qolgan edi.
   */
  const resolvedColor = typeof merged.color === "string" ? merged.color : color;

  const scaled =
    fontScale === 1
      ? null
      : {
          ...(typeof merged.fontSize === "number"
            ? { fontSize: Math.round(merged.fontSize * fontScale) }
            : null),
          ...(typeof merged.lineHeight === "number"
            ? { lineHeight: Math.round(merged.lineHeight * fontScale) }
            : null),
        };

  /*
   * SHRIFT OILASI QALINLIKDAN KELIB CHIQADI.
   *
   * Androidda RN maxsus shrift uchun qalinlikni o'zi yasay olmaydi,
   * shuning uchun har qalinlik alohida oila nomi bilan yuklangan
   * (izohi `fonts.ts` da). `fontWeight` esa OLIB TASHLANADI — aks holda
   * iOS ustiga yana sun'iy qalinlik qo'shib, harflarni buzadi.
   *
   * Chaqiruvchi o'z `fontFamily` sini bergan bo'lsa (masalan doskadagi
   * monoshrift), unga tegilmaydi.
   */
  const weight = (typeof merged.fontWeight === "string"
    ? merged.fontWeight
    : VARIANTS[variant].fontWeight) as FontWeightToken;

  const font: TextStyle = merged.fontFamily
    ? {}
    : {
        fontFamily: HEADING_VARIANTS.has(variant) ? headingFont(weight) : bodyFont(weight),
        fontWeight: undefined,
        ...(HEADING_VARIANTS.has(variant) && typeof merged.fontSize === "number"
          ? { letterSpacing: merged.fontSize * HEADING_TRACKING }
          : null),
      };

  return (
    <RNText style={[styles.base, merged, font, { color: resolvedColor }, scaled]} {...rest} />
  );
}

const styles = StyleSheet.create({
  /*
   * `includeFontPadding: false` — Androidda shrift ustidagi qo'shimcha
   * bo'shliqni olib tashlaydi, aks holda qatorlar veb bilan solishtirganda
   * pastroq tushadi.
   */
  base: { includeFontPadding: false },
});
