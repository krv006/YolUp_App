import { Pressable, StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";
import { MIN_TOUCH_SIZE, radius } from "./tokens";
import { useTheme } from "./theme";
import { Text } from "./text";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled = false }: CheckboxProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      // Quti 20px, lekin bosiladigan maydon 44px — HIG/Material talabi.
      style={[styles.row, { opacity: disabled ? 0.5 : 1 }]}
      hitSlop={8}
    >
      <View
        style={[
          styles.box,
          {
            backgroundColor: checked ? palette.primary : palette.surface,
            borderColor: checked ? palette.primary : palette["border-strong"],
          },
        ]}
      >
        {checked ? <Check size={14} strokeWidth={3} color={palette["primary-foreground"]} /> : null}
      </View>
      {label ? <Text>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: MIN_TOUCH_SIZE,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: radius.xs - 2,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
