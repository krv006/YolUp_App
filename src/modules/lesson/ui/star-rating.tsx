import { Pressable, StyleSheet, View } from "react-native";
import { Star } from "lucide-react-native";
import { MIN_TOUCH_SIZE, Text, useTheme } from "@/shared/ui";

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  /** O'qish rejimi — o'rtacha bahoni ko'rsatishda. */
  readOnly?: boolean;
}

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * Yulduzli baho — veb `star-rating.tsx` ning mobil varianti.
 *
 * Tahrirlanadigan rejimda har yulduz 44pt teginish maydoniga ega bo'ladi
 * (ko'rinishi kichik bo'lsa ham) — barmoq bilan 3 va 4 ni chalkashtirmaslik
 * uchun.
 */
export function StarRating({ value, onChange, size = 28, readOnly = false }: StarRatingProps) {
  const { palette } = useTheme();

  return (
    <View
      style={styles.row}
      accessibilityRole={readOnly ? "text" : "adjustable"}
      accessibilityLabel={`Baho: ${value} yulduzdan 5`}
    >
      {STARS.map((star) => {
        const filled = star <= value;
        const icon = (
          <Star
            size={size}
            color={filled ? palette.warning : palette["border-strong"]}
            fill={filled ? palette.warning : "transparent"}
          />
        );

        if (readOnly || !onChange) return <View key={star}>{icon}</View>;

        return (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`${star} yulduz`}
            onPress={() => onChange(star)}
            style={styles.hit}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

/** O'rtacha baho + baholovchilar soni — kartochkalarda. */
export function RatingSummary({ average, count }: { average: number | null; count: number }) {
  const { palette } = useTheme();
  if (average === null) return null;

  return (
    <View style={styles.summary}>
      <Star size={14} color={palette.warning} fill={palette.warning} />
      <Text variant="caption" tone="muted">
        {average.toFixed(1)} ({count})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  hit: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  summary: { flexDirection: "row", alignItems: "center", gap: 5 },
});
