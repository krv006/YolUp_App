import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { MIN_TOUCH_SIZE } from "./tokens";
import { useTheme } from "./theme";
import { Text } from "./text";

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Chapdagi element — avatar yoki ikonka. */
  leading?: ReactNode;
  /** O'ngdagi element — badge, vaqt, switch. */
  trailing?: ReactNode;
  onPress?: () => void;
  /** O'ngdagi ">" ko'rsatkichi (`trailing` bo'lmasa). */
  chevron?: boolean;
  active?: boolean;
  /** Bosilmaydigan holat — masalan so'rov ketayotganda. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Ro'yxat qatori — suhbatlar, o'quvchilar, sozlamalar uchun umumiy shakl.
 *
 * Balandligi kamida 44pt: bu shunchaki uslub emas, teginish maydoni talabi.
 */
export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  chevron = false,
  active = false,
  disabled = false,
  style,
}: ListItemProps) {
  const { palette } = useTheme();

  const content = (
    <>
      {leading}
      <View style={styles.body}>
        <Text variant="label" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {!trailing && chevron ? (
        <ChevronRight size={18} color={palette["muted-foreground"]} />
      ) : null}
    </>
  );

  const base: StyleProp<ViewStyle> = [
    styles.row,
    active && { backgroundColor: palette["primary-tint"] },
    style,
  ];

  if (!onPress) return <View style={base}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        base,
        disabled && styles.disabled,
        pressed && { backgroundColor: palette["surface-subtle"] },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: MIN_TOUCH_SIZE + 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  body: { flex: 1, gap: 2, justifyContent: "center" },
});
