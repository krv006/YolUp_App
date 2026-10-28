import { useMemo } from "react";
import { StyleSheet, View, type TextStyle } from "react-native";
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
 *   `bg-auth-gradient`    -> `<DsGradient name="auth" />` (orqa fon qatlami)
 *   `rounded-2xl`         -> `{ borderRadius: dsRadius["2xl"] }`
 *
 * Eski ekranlar `palette` (shadcn nomlari) bilan qoladi; yangi dizayndagi
 * ekranlar shu tokenlar bilan yoziladi.
 */
export type DsColor = keyof typeof tokens.colors.light;
export type DsType = keyof typeof tokens.type;
export type DsShadow = keyof typeof tokens.shadows.light;
export type DsGradientName = keyof typeof tokens.gradients.light;

export const dsRadius = tokens.radius;
export const dsType = tokens.type as Record<DsType, { fontSize: number; lineHeight: number; fontWeight: string; letterSpacing: number }>;

export interface Ds {
  c: Record<DsColor, string>;
  shadow: Record<DsShadow, string>;
  gradient: Record<DsGradientName, string>;
}

/**
 * Joriy temaga mos tokenlar (yorug' / qorong'i). `force` — vebdagi
 * `data-theme="dark"` kabi bitta ekranni doim bir temada chizish uchun.
 */
export function useDs(force?: "light" | "dark"): Ds {
  const { scheme: current } = useTheme();
  const scheme = force ?? current;
  return useMemo(
    () => ({ c: tokens.colors[scheme], shadow: tokens.shadows[scheme], gradient: tokens.gradients[scheme] }),
    [scheme]
  );
}

/** Vebdagi `bg-action/30` kabi shaffoflik — `#rrggbb` tokenga alfa qo'shadi. */
export function dsAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color)?.[1];
  if (!hex) return color;
  const value = Number.parseInt(hex, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/**
 * Vebdagi rang klasslari satri (`"bg-accent-saffron-bg text-accent-saffron-fg"`)
 * -> `{ bg, fg }`. Domen qatlamidagi ohanglar (masalan `NOTIFICATION_TONES`)
 * vebda Tailwind klass sifatida yozilgan — ular o'zgartirilmasdan shu
 * yerda tokenga aylantiriladi.
 */
export function toneColors(className: string, ds: Ds): { bg?: string; fg?: string } {
  const out: { bg?: string; fg?: string } = {};
  for (const part of className.split(/\s+/)) {
    const bg = /^bg-(.+)$/.exec(part)?.[1];
    const fg = /^text-(.+)$/.exec(part)?.[1];
    if (bg && bg in ds.c) out.bg = ds.c[bg as DsColor];
    if (fg && fg in ds.c) out.fg = ds.c[fg as DsColor];
  }
  return out;
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

/**
 * Vebdagi `bg-*-gradient` — ota-elementning orqasidagi qatlam.
 *
 * RN `linear-gradient` da piksel pozitsiyani (`#f7f8fa 444px`) qo'llamaydi,
 * butun gradientni jimgina tashlab yuboradi. Vebdagi ma'nosi esa aniq:
 * rang tepadan 444px gacha o'tadi, undan pastda oxirgi rang davom etadi.
 * Shuning uchun piksel bilan tugaydigan gradient o'sha balandlikdagi qatlam
 * bo'lib chiziladi (0%→100%), pastki qismni ota-elementning foni beradi.
 */
export function DsGradient({ name }: { name: DsGradientName }) {
  const ds = useDs();
  const css = ds.gradient[name];
  const pixelEnd = /,\s*([^,]+?)\s+(\d+(?:\.\d+)?)px\)$/.exec(css);
  if (!pixelEnd) {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { experimental_backgroundImage: css }]} />;
  }
  const height = Number(pixelEnd[2]);
  const gradient = `${css.slice(0, pixelEnd.index)}, ${pixelEnd[1]} 100%)`;
  return <View pointerEvents="none" style={[styles.top, { height, experimental_backgroundImage: gradient }]} />;
}

const styles = StyleSheet.create({
  top: { position: "absolute", top: 0, left: 0, right: 0 },
});
