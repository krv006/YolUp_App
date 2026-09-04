import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { fontSize, MIN_TOUCH_SIZE, radius } from "./tokens";
import { useTheme, type Palette } from "./theme";
import { Text } from "./text";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Chapdagi ikonka — matn bilan bir qatorda. */
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  md: { height: MIN_TOUCH_SIZE, paddingHorizontal: 16, fontSize: fontSize.md },
  lg: { height: 52, paddingHorizontal: 20, fontSize: fontSize.lg },
};

/**
 * `--primary` (#1A66E0) ATAYLAB fon sifatida ishlatiladi: ustidagi OQ matn
 * bilan 5.22:1 beradi (veb `theme.css` izohi). Yorug'roq brend ko'ki faqat
 * MATN rangi sifatida yaraydi — shu sabab `ghost` da `primary-text` olinadi.
 */
function resolveColors(palette: Palette, variant: ButtonVariant, disabled: boolean) {
  const base = {
    primary: { background: palette.primary, label: palette["primary-foreground"], border: "transparent" },
    secondary: { background: palette.secondary, label: palette["secondary-foreground"], border: palette.border },
    ghost: { background: "transparent", label: palette["primary-text"], border: "transparent" },
    danger: { background: palette.destructive, label: palette["destructive-foreground"], border: "transparent" },
  }[variant];

  return disabled ? { ...base, opacity: 0.5 } : { ...base, opacity: 1 };
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { palette } = useTheme();
  const isDisabled = Boolean(disabled) || loading;
  const { background, label, border, opacity } = resolveColors(palette, variant, isDisabled);
  const metrics = SIZES[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: metrics.height,
          paddingHorizontal: metrics.paddingHorizontal,
          backgroundColor: background,
          borderColor: border,
          opacity: pressed && !isDisabled ? 0.85 : opacity,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={label} size="small" />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: label, fontSize: metrics.fontSize }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontWeight: "600" },
});
