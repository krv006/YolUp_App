import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { useAppearanceStore } from "@/shared/model/theme.store";
import { colors, type ColorScheme } from "./tokens";
import { deriveAccentTokens, findAccent, readableOn } from "./accents";

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
} {
  const systemScheme = useColorScheme();
  const mode = useAppearanceStore((state) => state.mode);
  const accent = useAppearanceStore((state) => state.accent);
  const bubbleAccent = useAppearanceStore((state) => state.bubbleAccent);
  const fontScale = useAppearanceStore((state) => state.fontScale);

  const scheme: ColorScheme =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

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
      "bubble-own-foreground": readableOn(bubble),
    } as Palette;
  }, [scheme, accent, bubbleAccent]);

  return { scheme, palette, fontScale };
}
