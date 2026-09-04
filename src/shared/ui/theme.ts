import { useColorScheme } from "react-native";
import { colors, type ColorScheme } from "./tokens";

export type Palette = (typeof colors)["light"];

/**
 * Joriy mavzu palitrasi.
 *
 * Veb'da bu CSS o'zgaruvchisi orqali avtomatik ishlardi (`.dark` klassi).
 * RN'da StyleSheet qiymatlari statik, shuning uchun palitra hook orqali
 * olinadi va komponent mavzu almashganda qayta render bo'ladi.
 *
 * `useColorScheme()` qurilma sozlamasini beradi. Foydalanuvchi ilova ichida
 * mavzuni majburlashi Faza 1 da `theme.store` bilan qo'shiladi (veb'dagi
 * `shared/model/theme.store.ts` naqshi).
 */
export function useTheme(): { scheme: ColorScheme; palette: Palette } {
  const scheme: ColorScheme = useColorScheme() === "dark" ? "dark" : "light";
  return { scheme, palette: colors[scheme] };
}
