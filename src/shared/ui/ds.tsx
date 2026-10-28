import { useMemo } from "react";
import type { TextStyle } from "react-native";
import tokens from "./ds-tokens.json";
import { headingFont, type FontWeightToken } from "./fonts";
import { Text, type TextProps } from "./text";
import { useTheme } from "./theme";

/**
 * Yangi Figma dizayni (2026-10) tokenlari — veb `design-tokens.css` dagi
 * Tailwind nomlari bilan (`npm run build:ds-tokens` generatsiya qiladi).
 *
 * Vebdagi `className` ni ko'chirish qoidasi:
 *   `bg-brand`            -> `{ backgroundColor: ds.c.brand }`
 *   `text-ink-secondary`  -> `<DsText c="ink-secondary">`
 *   `border-line`         -> `{ borderColor: ds.c.line }`
 *   `text-body-sm`        -> `<DsText v="body-sm">`
 *   `font-heading`        -> `<DsText heading>`
 *   `shadow-md`           -> `{ boxShadow: ds.shadow.md }`
 *   `bg-auth-gradient`    -> `{ experimental_backgroundImage: ds.gradient.auth }`
 *   `rounded-2xl`         -> `{ borderRadius: dsRadius["2xl"] }`
 *
 * Eski ekranlar `palette` (shadcn nomlari) bilan qoladi; yangi dizayndagi
 * ekranlar shu tokenlar bilan yoziladi.
 */
export type DsColor = keyof typeof tokens.colors.light;
export type DsType = keyof typeof tokens.type;
export type DsShadow = keyof typeof tokens.shadows.light;
export type DsGradient = keyof typeof tokens.gradients.light;

export const dsRadius = tokens.radius;
export const dsType = tokens.type as Record<DsType, { fontSize: number; lineHeight: number; fontWeight: string; letterSpacing: number }>;

export interface Ds {
  c: Record<DsColor, string>;
  shadow: Record<DsShadow, string>;
  gradient: Record<DsGradient, string>;
}

/** Joriy temaga mos tokenlar (yorug' / qorong'i). */
export function useDs(): Ds {
  const { scheme } = useTheme();
  return useMemo(
    () => ({ c: tokens.colors[scheme], shadow: tokens.shadows[scheme], gradient: tokens.gradients[scheme] }),
    [scheme]
  );
}

export interface DsTextProps extends Omit<TextProps, "variant" | "tone"> {
  /** Matn uslubi — vebdagi `text-*` (`body-sm`, `title`, `h1`...). */
  v?: DsType;
  /** Rang — vebdagi `text-*` rangi (`ink-secondary`, `brand`...). Standart: `ink`. */
  c?: DsColor;
  /** Vebdagi `font-heading` — Unbounded. */
  heading?: boolean;
  /** Qalinlikni almashtirish — vebdagi `font-medium` / `font-semibold`. */
  w?: FontWeightToken;
  /** Vebdagi `font-numeric` — raqamlar bir xil kenglikda. */
  numeric?: boolean;
}

/**
 * Yangi dizayn matni. O'lcham, qator oralig'i, qalinlik va harf oralig'i
 * vebdagi `text-*` tokenidan; umumiy matn masshtabi va shrift oilasi
 * `Text` ichida (izohlari o'sha faylda).
 */
export function DsText({ v = "body", c = "ink", heading = false, w, numeric = false, style, ...rest }: DsTextProps) {
  const ds = useDs();
  const preset = dsType[v];
  const weight = (w ?? preset.fontWeight) as FontWeightToken;

  const base: TextStyle = {
    fontSize: preset.fontSize,
    lineHeight: preset.lineHeight,
    letterSpacing: preset.letterSpacing,
    color: ds.c[c],
    ...(heading
      ? // Oila berilsa `Text` qalinlikni o'zi tanlamaydi — iOS sun'iy qalinlashtirmasin.
        { fontFamily: headingFont(weight), fontWeight: undefined }
      : { fontWeight: weight }),
    ...(numeric ? { fontVariant: ["tabular-nums"] } : null),
  };

  return <Text style={[base, style]} {...rest} />;
}
