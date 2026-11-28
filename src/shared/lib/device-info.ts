import { Dimensions, Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Murojaatga qo'shiladigan qurilma ma'lumoti (JSON matn) — veb
 * `ticket-helpers.ts` dagi `deviceInfo()` ning mobil manbasi.
 *
 * Vebda `navigator`/`window.screen`/`location` olinadi — RN'da yo'q
 * (`window.screen` murojaati yiqitardi). Maydon nomlari backend kutganidek.
 */
export function deviceInfoJson(): string {
  const screen = Dimensions.get("screen");
  const version = Constants.expoConfig?.version ?? "";
  return JSON.stringify({
    user_agent: `YolUp/${version} (${Platform.OS} ${String(Platform.Version)})`,
    language: Intl.DateTimeFormat().resolvedOptions().locale,
    platform: Platform.OS === "ios" ? "iOS" : "Android",
    screen: `${Math.round(screen.width * screen.scale)}x${Math.round(screen.height * screen.scale)}`,
    url: "app",
  });
}
