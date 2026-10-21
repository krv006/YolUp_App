import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius } from "./tokens";
import { useTheme } from "./theme";
import { Text } from "./text";

export interface CardProps {
  children: ReactNode;
  title?: string;
  /** Sarlavha yonidagi element — tugma, badge, sana. */
  action?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Kartochka — ma'lumot bloklarining asosiy idishi.
 *
 * `onPress` berilsa bosiladigan bo'ladi; bunda `accessibilityRole` ham
 * o'zgaradi, aks holda screen reader uni oddiy matn deb o'qiydi.
 */
export function Card({ children, title, action, onPress, style }: CardProps) {
  const { palette } = useTheme();

  const body = (
    <>
      {title || action ? (
        <View style={styles.header}>
          {title ? (
            <Text variant="subheading" style={styles.title}>
              {title}
            </Text>
          ) : (
            <View style={styles.title} />
          )}
          {action}
        </View>
      ) : null}
      {children}
    </>
  );

  const boxStyle = [
    styles.card,
    { backgroundColor: palette.card, borderColor: palette.border },
    style,
  ];

  if (!onPress) return <View style={boxStyle}>{body}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [...boxStyle, pressed && { opacity: 0.8 }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /*
   * Veb DOM'idan o'lchandi: radius 20 (`--radius-xl`), chegara 1px,
   * ichki bo'shliq 16. Ilgari radius 16 va chegara `hairlineWidth` edi —
   * kartochka burchaklari o'tkirroq va chekkasi yupqaroq chiqardi.
   */
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 16,
    gap: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { flex: 1 },
});
