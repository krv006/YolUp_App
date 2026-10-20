import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./text";
import { useTheme } from "./theme";
import { radius } from "./tokens";

/**
 * Oyna pastidagi tugmalar qatori — veb `AppDialog` footeri:
 * `flex gap-3 px-5 py-4 border-t`, tugmalar `dialogButton.*` (h-12,
 * flex-1, rounded-full, 14/20/600).
 *
 * `Sheet` tanasi 16 bo'shliq bilan keladi; chiziq oynaning chetidan
 * chetigacha borishi uchun qator shu bo'shliqni manfiy chekka bilan
 * qoplaydi.
 */
export function SheetFooter({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  return <View style={[styles.footer, { borderTopColor: palette.border }]}>{children}</View>;
}

export interface SheetButtonProps {
  title: string;
  onPress: () => void;
  /** `secondary` — oq, chegarali; `primary` — ko'k; `danger` — qizil. */
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
}

export function SheetButton({
  title,
  onPress,
  variant = "secondary",
  disabled = false,
  loading = false,
}: SheetButtonProps) {
  const { palette } = useTheme();
  const filled = variant !== "secondary";
  const background =
    variant === "primary" ? palette.primary : variant === "danger" ? palette.destructive : palette.surface;
  const pressedBackground =
    variant === "primary"
      ? palette["primary-hover"]
      : variant === "danger"
        ? palette["destructive-strong"]
        : palette["surface-subtle"];
  const foreground = filled ? palette["primary-foreground"] : palette.foreground;
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? pressedBackground : background,
          borderColor: filled ? "transparent" : palette.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={foreground} /> : null}
      <Text variant="label" style={{ color: foreground }}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: radius.full,
  },
});
