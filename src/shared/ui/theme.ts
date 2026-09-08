import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { useAppearanceStore } from "@/shared/model/theme.store";
import { colors, type ColorScheme } from "./tokens";
import {
  deriveAccentTokens,
  findAccent,
  findGradient,
  gradientForeground,
  readableOn,
} from "./accents";

export type Palette = (typeof colors)["light"];

/**
 * Joriy mavzu palitrasi.
 *
 * Veb'da bu CSS o'zgaruvchisi orqali avtomatik ishlardi (`.dark` klassi).
 * RN'da StyleSheet qiymatlari statik, shuning uchun palitra hook orqali
 * olinadi va komponent mavzu almashganda qayta render bo'ladi.
 *
 * Uchta manba birlashtiriladi:
 *   1. `palette.json` dagi asosiy tokenlar
 *   2. foydalanuvchi tanlagan brend rangi (`primary-*` tokenlar qayta hisoblanadi)
 *   3. foydalanuvchi tanlagan chat purakchasi rangi
 *
 * Buni HAR komponent emas, shu yagona hook bajaradi — shuning uchun
 * `useTheme()` ni chaqiruvchi 75 ta fayl bir qator ham o'zgarmadi.
 */
export function useTheme(): {
  scheme: ColorScheme;
  palette: Palette;
  /** Shrift ko'paytuvchisi — `Text` uni o'zi qo'llaydi. */
  fontScale: number;
  /**
   * O'z xabari purakchasi uchun gradient. `null` bo'lsa oddiy rang
   * (`palette["bubble-own"]`) ishlatiladi.
   */
  bubbleGradient: readonly [string, string] | null;
} {
  const systemScheme = useColorScheme();
  const mode = useAppearanceStore((state) => state.mode);
  const accent = useAppearanceStore((state) => state.accent);
  const bubbleAccent = useAppearanceStore((state) => state.bubbleAccent);
  const bubbleGradientId = useAppearanceStore((state) => state.bubbleGradient);
  const fontScale = useAppearanceStore((state) => state.fontScale);

  const scheme: ColorScheme =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  // Gradient tanlangan bo'lsa u USTUN (theme.store dagi tartib bilan bir xil).
  const bubbleGradient = useMemo(() => {
    if (!bubbleGradientId) return null;
    const found = findGradient(bubbleGradientId);
    if (!found) return null;
    return scheme === "dark" ? found.dark : found.light;
  }, [bubbleGradientId, scheme]);

  const palette = useMemo(() => {
    const base = colors[scheme];
    const accentTokens = deriveAccentTokens(accent, scheme, base.background);

    // Chat purakchasi: tanlanmagan bo'lsa brend rangi ishlatiladi.
    const bubble = bubbleAccent
      ? (scheme === "dark" ? findAccent(bubbleAccent).dark : findAccent(bubbleAccent).light)
      : accentTokens.primary;

    return {
      ...base,
      ...accentTokens,
      "bubble-own": bubble,
      // Gradient bo'lsa matn rangi uning O'RTACHASI bo'yicha tanlanadi:
      // bir uchi och, ikkinchisi to'q bo'lsa ham matn o'qiladigan qoladi.
      "bubble-own-foreground": bubbleGradient
        ? gradientForeground(bubbleGradient)
        : readableOn(bubble),
    } as Palette;
  }, [scheme, accent, bubbleAccent, bubbleGradient]);

  return { scheme, palette, fontScale, bubbleGradient };
}
