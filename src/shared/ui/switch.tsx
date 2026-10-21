import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "./theme";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}

/**
 * Kalit — veb `shared/ui/switch.tsx` (radix) porti: 32x18.4 yo'lak,
 * 16px oq tugmacha; yoqilganda action rangi, o'chiqda `--input`.
 * Nativ `Switch` ATAYLAB olinmadi: u Android va iOS'da butunlay boshqa
 * o'lcham va rangda chiqadi.
 */
export function Switch({ checked, onCheckedChange, accessibilityLabel, disabled = false }: SwitchProps) {
  const { palette } = useTheme();
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
        { backgroundColor: checked ? palette.primary : palette.input, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <View
        style={[
          styles.thumb,
          { backgroundColor: palette.surface, transform: [{ translateX: checked ? 14 : 0 }] },
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
    borderRadius: 999,
    boxShadow: "0 1px 3px rgba(36, 38, 77, 0.06)",
  },
  thumb: { width: 16, height: 16, borderRadius: 999 },
});
