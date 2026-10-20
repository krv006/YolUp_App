import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Bell } from "lucide-react-native";
import { Icon, type IconName } from "./icon";
import { Logo } from "./logo";
import { Text } from "./text";
import { useTheme } from "./theme";
import { radius } from "./tokens";

/**
 * Ekranning tepa paneli — veb `<header>` ining porti.
 *
 * ┌─ O'LCHAMLAR VEBDAN ───────────────────────────────────────────────────┐
 * │ Hammasi 390px kenglikdagi veb DOM'idan o'lchandi:                     │
 * │   panel     balandlik 64, fon `--bg-canvas` (OQ EMAS — sahifa foni    │
 * │             bilan bir xil), pastki chegara 1px, bo'shliq 0 16,        │
 * │             elementlar orasi 12                                        │
 * │   sarlavha  22/30/500, Unbounded, tracking -0.44px                     │
 * │   tugma     44x44, radius 999                                          │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ NEGA SARLAVHA IXTIYORIY ─────────────────────────────────────────────┐
 * │ Vebda naqsh ekranga qarab o'zgaradi: Suhbatlarda chapda LOGOTIP       │
 * │ turadi va ko'rinadigan sarlavha yo'q (u yerda `<h1>` bor, lekin       │
 * │ o'lchami 0x0 — faqat ekran o'quvchisi uchun), Jadvalda esa "Jadval"   │
 * │ sarlavhasi chiziladi. Shuning uchun `title` berilmasa logotip         │
 * │ chiziladi, `a11yTitle` esa ekran o'quvchisiga baribir yetkaziladi.     │
 * └───────────────────────────────────────────────────────────────────────┘
 */
export interface AppBarProps {
  /** Ko'rinadigan sarlavha. Berilmasa logotip chiziladi. */
  title?: string;
  /**
   * Ekran nomi — ko'rinmaydi, faqat ekran o'quvchisi uchun.
   * Logotipli ko'rinishda SHART, aks holda ekranning nomi aytilmaydi.
   */
  a11yTitle?: string;
  /** O'ng tomondagi tugmalar. */
  children?: ReactNode;
}

export function AppBar({ title, a11yTitle, children }: AppBarProps) {
  const { palette } = useTheme();

  return (
    <View
      accessibilityRole="header"
      accessibilityLabel={a11yTitle ?? title}
      style={[
        styles.bar,
        { backgroundColor: palette.background, borderBottomColor: palette.border },
      ]}
    >
      {title ? (
        <Text variant="heading" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      ) : (
        <>
          <Logo size={32} />
          <View style={styles.spacer} />
        </>
      )}
      {children}
    </View>
  );
}

export interface AppBarActionProps {
  name: IconName;
  /** Ekran o'quvchisi uchun — ikonkada matn yo'q. */
  label: string;
  onPress?: () => void;
  /**
   * `primary` — to'ldirilgan ko'k (vebdagi "+" tugmasi),
   * `plain` — oq fon va chegara (qo'ng'iroq).
   */
  variant?: "plain" | "primary";
  /** O'ng yuqoridagi son (o'qilmagan bildirishnomalar). */
  badge?: ReactNode;
}

/**
 * Ikonka o'lchamlari vebdagi tepa paneldan: "+" `size={20}`, qidiruv
 * `size={19}`.
 */
const ICON_SIZES: Partial<Record<IconName, number>> = { add: 20, search: 19 };

/**
 * Tepa paneldagi dumaloq tugma — 44x44, vebdagi kabi.
 *
 * Qo'ng'iroq ALOHIDA: vebdagi `NotificationBell` loyiha ikonkalaridan
 * (to'ldirilgan `bell.svg`) emas, lucide `Bell` (chiziqli, 18) bilan
 * chiziladi.
 */
export function AppBarAction({
  name,
  label,
  onPress,
  variant = "plain",
  badge,
}: AppBarActionProps) {
  const { palette } = useTheme();
  const primary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: primary ? palette.primary : palette.surface,
          // Faqat oq tugmada chegara bor — to'ldirilganida u ortiqcha.
          borderWidth: primary ? 0 : 1,
          borderColor: palette.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {name === "bell" ? (
        <Bell size={18} color={primary ? palette["primary-foreground"] : palette.foreground} />
      ) : (
        <Icon
          name={name}
          size={ICON_SIZES[name] ?? 20}
          color={primary ? palette["primary-foreground"] : palette.foreground}
        />
      )}
      {badge}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  /* Sarlavha bo'sh joyni egallaydi, tugmalar o'ngga suriladi. */
  title: { flex: 1 },
  spacer: { flex: 1 },
  action: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
