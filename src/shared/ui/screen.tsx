import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "./button";
import { Text } from "./text";
import { useTheme } from "./theme";

export interface ScreenProps {
  children: ReactNode;
  /** Kontent skrollansinmi (forma va uzun ro'yxatlar uchun). */
  scroll?: boolean;
  /** Klaviatura ochilganda kontent siljisinmi (formalarda kerak). */
  avoidKeyboard?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Har ekranning tashqi qobig'i: fon rangi, xavfsiz maydon, klaviatura.
 *
 * Bular har ekranda takrorlanadigan va UNUTILADIGAN narsalar — notch ostiga
 * kirib ketgan sarlavha yoki klaviatura ostida qolgan tugma shundan chiqadi.
 */
export function Screen({
  children,
  scroll = false,
  avoidKeyboard = false,
  padded = true,
  style,
}: ScreenProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <View
      style={[
        styles.body,
        padded && styles.padded,
        { paddingBottom: insets.bottom + (padded ? 16 : 0) },
        style,
      ]}
    >
      {children}
    </View>
  );

  const scrollable = scroll ? (
    <ScrollView
      contentContainerStyle={styles.grow}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.background, paddingTop: insets.top }]}>
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={styles.grow}
          // iOS klaviaturani ustiga chiqaradi, Android o'zi resize qiladi.
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {scrollable}
        </KeyboardAvoidingView>
      ) : (
        scrollable
      )}
    </View>
  );
}

/** Ma'lumot yuklanayotgan holat — har ekranning uch holatidan biri (§18.12). */
export function ScreenLoading({ label = "Yuklanmoqda…" }: { label?: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={palette.primary} />
      <Text tone="muted">{label}</Text>
    </View>
  );
}

/** Xato holati — qayta urinish tugmasi bilan (§18.12). */
export function ScreenError({
  message = "Nimadir noto'g'ri ketdi",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text variant="subheading" style={styles.centered}>
        {message}
      </Text>
      {onRetry ? <Button title="Qayta urinish" variant="secondary" fullWidth={false} onPress={onRetry} /> : null}
    </View>
  );
}

/** Bo'sh holat — uchinchi majburiy holat (§18.12). */
export function ScreenEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.center}>
      <Text variant="subheading" style={styles.centered}>
        {title}
      </Text>
      {description ? (
        <Text tone="muted" style={styles.centered}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  grow: { flexGrow: 1 },
  body: { flex: 1 },
  padded: { paddingHorizontal: 20, paddingTop: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  centered: { textAlign: "center" },
});
