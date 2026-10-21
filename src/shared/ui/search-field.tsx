import { StyleSheet, TextInput, View } from "react-native";
import { Icon } from "./icon";
import { useTheme } from "./theme";
import { bodyFont } from "./fonts";
import { radius } from "./tokens";

export interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}

/**
 * Qidiruv maydoni — veb ro'yxat ekranlaridagi doimiy maydon.
 *
 * ┌─ NEGA ALOHIDA KOMPONENT ──────────────────────────────────────────────┐
 * │ Umumiy `Input` boshqa o'lchamda: u forma maydoni uchun. Vebdagi       │
 * │ qidiruv esa o'zgacha — balandligi 58, radiusi 24 va ichida chapda     │
 * │ ikonka turadi. O'lchamlar veb DOM'idan olingan:                      │
 * │   o'ram   58 balandlik, radius 24, oq fon, chegara 1px, pad 0 16,     │
 * │           elementlar orasi 12                                          │
 * │   matn    16/24, qalinlik 400                                          │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ILGARI mobilda qidiruv IKONKA ORTIDA yashiringan edi: bosilganda
 * sarlavha o'rnini maydon egallardi. Vebda u doim ko'rinadi.
 */
export function SearchField({ value, onChangeText, placeholder, autoFocus }: SearchFieldProps) {
  const { palette } = useTheme();

  return (
    <View
      style={[styles.wrap, { backgroundColor: palette.surface, borderColor: palette.border }]}
    >
      <Icon name="search" size={24} color={palette["muted-foreground"]} />
      <TextInput
        style={[styles.input, { color: palette.foreground }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette["muted-foreground"]}
        autoFocus={autoFocus}
        returnKeyType="search"
        // Qidiruvda bosh harf ham, avtomatik tuzatish ham xalaqit beradi.
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: radius["2xl"],
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: bodyFont("400"),
    // Androidda shrift ustidagi qo'shimcha bo'shliq matnni pastga suradi.
    includeFontPadding: false,
    padding: 0,
  },
});
