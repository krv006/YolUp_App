import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { fontSize, MIN_TOUCH_SIZE, radius } from "./tokens";
import { useTheme } from "./theme";
import { Text } from "./text";

/** Ro'yxat qatorlari orasidagi chiziq. */
export function Separator({ inset = 0 }: { inset?: number }) {
  const { palette } = useTheme();
  return <View style={[styles.separator, { backgroundColor: palette.border, marginLeft: inset }]} />;
}

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Filtr tugmachasi — suhbat filtrlari, fan tanlash va h.k. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? palette.primary : palette.secondary,
          borderColor: selected ? palette.primary : palette.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          { color: selected ? palette["primary-foreground"] : palette["muted-foreground"] },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Gorizontal skrollanadigan chip qatori. */
export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      /*
       * `flexGrow: 0` SHART. RN'da `ScrollView` ning ichki uslubi
       * `{ flexGrow: 1, flexShrink: 1 }` — ya'ni GORIZONTAL ScrollView ham
       * ustun ichida VERTIKAL bo'yicha cho'ziladi va bo'sh joyni bo'lib oladi.
       *
       * Suhbat ekranida bu chip qatori va xabarlar bloki ekranni teng ikkiga
       * bo'lib olishiga olib kelgan edi: tablar ekranning yarmini egallardi.
       */
      style={styles.chipRowOuter}
      contentContainerStyle={styles.chipRow}
      // Chip'lar ekranga sig'sa skroll kerak emas, lekin uzbekcha yorliqlar
      // uzun bo'lgani uchun ko'pincha sig'maydi.
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export interface IconButtonProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Faqat ikonkali tugma — sarlavha panellarida. Teginish maydoni 44pt. */
export function IconButton({
  children,
  onPress,
  accessibilityLabel,
  disabled = false,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

/**
 * Yuklanish o'rnini bosuvchi to'rtburchak.
 *
 * Animatsiyasiz — ataylab: low-end Androidda o'nlab skeleton'ning bir vaqtda
 * pulsatsiyasi ro'yxat ochilishini sezilarli sekinlashtiradi.
 */
export function Skeleton({
  width,
  height = 14,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        { width: width ?? "100%", height, borderRadius: radius.xs, backgroundColor: palette.muted },
        style,
      ]}
    />
  );
}

/** Ekran sarlavhasi — stack'da o'z header'i o'chirilgani uchun qo'lda. */
export function ScreenHeader({
  title,
  subtitle,
  leading,
  trailing,
}: {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  const { palette } = useTheme();

  return (
    <View style={[styles.header, { borderBottomColor: palette.border }]}>
      {leading}
      <View style={styles.headerBody}>
        <Text variant="subheading" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  separator: { height: StyleSheet.hairlineWidth },
  chip: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipLabel: { fontSize: fontSize.sm, fontWeight: "600" },
  chipRowOuter: { flexGrow: 0, flexShrink: 0 },
  chipRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  iconButton: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBody: { flex: 1, gap: 2, paddingHorizontal: 8 },
});
