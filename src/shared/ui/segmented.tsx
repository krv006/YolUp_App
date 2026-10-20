import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./text";
import { useTheme } from "./theme";
import { radius } from "./tokens";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Ekran o'quvchisi uchun — bu nima tanlovi ekanini aytadi. */
  label: string;
}

/**
 * Segmentli boshqaruv — veb jadvaldagi ko'rinish almashtirgichi.
 *
 * ┌─ NEGA CHIP EMAS ──────────────────────────────────────────────────────┐
 * │ Mobilda bu yerda CHIP qatori turardi: har biri alohida, chegarali.    │
 * │ Vebda esa bitta KULRANG YO'LAKCHA ichida bo'laklar joylashadi va      │
 * │ tanlangani OQ fon oladi — ya'ni tanlov "yo'lakcha bo'ylab suriladi".  │
 * │ Chip bilan bu ko'rinish chiqmaydi, shuning uchun alohida komponent.    │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * O'lchamlar veb DOM'idan (390px):
 *   yo'lakcha  fon `--bg-subtle`, radius 999, ichki bo'shliq 4, oraliq 4
 *   bo'lak     radius 999, bo'shliq 0 12, yorliq 14/20 qalinlik 600
 *   tanlangan  OQ fon, matn `--text-primary`
 *   tanlanmagan shaffof, matn `--text-secondary`
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedProps<T>) {
  const { palette } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={[styles.track, { backgroundColor: palette["surface-subtle"] }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: palette.surface },
              pressed && !selected && { opacity: 0.7 },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: selected ? palette.foreground : palette["muted-foreground"] },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
    borderRadius: radius.full,
  },
  segment: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: radius.full,
  },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
});
