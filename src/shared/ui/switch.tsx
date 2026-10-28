import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "./theme";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  /** `lg` — `h-7.5 w-12.5`, tugmacha `size-6.5` (yangi dizayndagi oynalarda). */
  size?: "default" | "lg";
}

/**
 * Kalit — veb `shared/ui/switch.tsx` (radix) porti: 32x18.4 yo'lak,
 * 16px oq tugmacha; yoqilganda action rangi, o'chiqda `--input`.
 * Nativ `Switch` ATAYLAB olinmadi: u Android va iOS'da butunlay boshqa
 * o'lcham va rangda chiqadi.
 */
export function Switch({ checked, onCheckedChange, accessibilityLabel, disabled = false, size = "default" }: SwitchProps) {
  const { palette } = useTheme();
  const lg = size === "lg";
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={10}
      onPress={() => onCheckedChange(!checked)}
      style={[
        styles.track,
        lg && styles.trackLg,
        { backgroundColor: checked ? palette.primary : palette.input, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <View
        style={[
          lg ? styles.thumbLg : styles.thumb,
          { backgroundColor: palette.surface, transform: [{ translateX: lg ? (checked ? 22 : 2) : checked ? 14 : 0 }] },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 32,
    height: 18.4,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    // Yarim balandlik (999 emas) — Android `boxShadow` ni 999 bilan kesmaydi.
    borderRadius: 9.2,
    boxShadow: "0 1px 3px rgba(36, 38, 77, 0.06)",
  },
  thumb: { width: 16, height: 16, borderRadius: 999 },
  trackLg: { width: 50, height: 30, borderRadius: 15 },
  thumbLg: { width: 26, height: 26, borderRadius: 999 },
});
