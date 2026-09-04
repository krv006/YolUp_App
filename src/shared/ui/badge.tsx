import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { fontSize, radius } from "./tokens";
import { useTheme, type Palette } from "./theme";
import { Text } from "./text";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}

function toneColors(palette: Palette, tone: BadgeTone) {
  return {
    neutral: { background: palette.secondary, text: palette["muted-foreground"] },
    brand: { background: palette["primary-soft"], text: palette["accent-foreground"] },
    success: { background: palette["success-soft"], text: palette["success-strong"] },
    warning: { background: palette["warning-soft"], text: palette["warning-strong"] },
    danger: { background: palette["destructive-soft"], text: palette["destructive-strong"] },
  }[tone];
}

/** Holat yorlig'i — dars holati, vazifa bahosi, rol va h.k. */
export function Badge({ label, tone = "neutral", style }: BadgeProps) {
  const { palette } = useTheme();
  const { background, text } = toneColors(palette, tone);

  return (
    <View style={[styles.badge, { backgroundColor: background }, style]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

/**
 * O'qilmagan xabarlar soni. 99 dan oshsa "99+" — aks holda doira cho'zilib
 * ro'yxat qatorini buzadi.
 */
export function CountBadge({ count }: { count: number }) {
  const { palette } = useTheme();
  if (count <= 0) return null;

  return (
    <View style={[styles.count, { backgroundColor: palette.primary }]}>
      <Text style={[styles.countLabel, { color: palette["primary-foreground"] }]}>
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  label: { fontSize: fontSize.xs, fontWeight: "600" },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  countLabel: { fontSize: fontSize["2xs"], fontWeight: "700" },
});
