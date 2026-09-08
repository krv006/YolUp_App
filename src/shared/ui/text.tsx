import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from "react-native";
import { fontSize } from "./tokens";
import { useTheme } from "./theme";

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

const VARIANTS: Record<TextVariant, { fontSize: number; lineHeight: number; fontWeight: "400" | "500" | "600" | "700" }> = {
  title: { fontSize: fontSize["6xl"], lineHeight: 34, fontWeight: "700" },
  heading: { fontSize: fontSize["4xl"], lineHeight: 28, fontWeight: "600" },
  subheading: { fontSize: fontSize["2xl"], lineHeight: 24, fontWeight: "600" },
  body: { fontSize: fontSize.md, lineHeight: 20, fontWeight: "400" },
  label: { fontSize: fontSize.md, lineHeight: 18, fontWeight: "600" },
  caption: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: "400" },
};

/** `foreground` — asosiy matn, `muted` — ikkilamchi, `danger` — xato. */
export type TextTone = "default" | "muted" | "brand" | "danger" | "onPrimary";

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
}

export function Text({ variant = "body", tone = "default", style, ...rest }: TextProps) {
  const { palette, fontScale } = useTheme();

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
  const merged = StyleSheet.flatten([VARIANTS[variant], style]) ?? {};
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

  return <RNText style={[styles.base, merged, { color }, scaled]} {...rest} />;
}

const styles = StyleSheet.create({
  // Tizim shrifti ataylab: maxsus shrift yuklash birinchi kadrni kechiktiradi
  // va low-end Androidda matn "sakraydi". Brend shrifti Faza 1 da baholanadi.
  base: { includeFontPadding: false },
});
