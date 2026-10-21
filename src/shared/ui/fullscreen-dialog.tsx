import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Text } from "./text";
import { useTheme } from "./theme";

export interface FullscreenDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Pastki qator — odatda ikki `SheetButton` (Bekor / Saqlash). */
  footer?: ReactNode;
}

/**
 * Butun ekranli oyna — veb `AppDialog variant="fullscreen"` ning telefon
 * ko'rinishi: chapda 40px dumaloq "×", yonida sarlavha (h3) va izoh,
 * o'rtada aylanadigan tana (20 chekka, bloklar orasi 16) va chiziq bilan
 * ajratilgan pastki tugmalar qatori. Pastdan sirpanib chiqadi.
 */
export function FullscreenDialog({ open, onClose, title, description, children, footer }: FullscreenDialogProps) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.root, { backgroundColor: palette.surface, paddingTop: insets.top }]}
      >
        <View style={[styles.head, description ? styles.headWithText : null]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("shared.yopish")}
            onPress={onClose}
            style={({ pressed }) => [
              styles.close,
              { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : "transparent" },
            ]}
          >
            <X size={18} color={palette.foreground} />
          </Pressable>
          <View style={styles.titles}>
            <Text variant="subheading" accessibilityRole="header">
              {title}
            </Text>
            {description ? (
              <Text variant="label" style={[styles.description, { color: palette["muted-foreground"] }]}>
                {description}
              </Text>
            ) : null}
          </View>
        </View>

        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {footer ? (
          <View style={[styles.footer, { borderTopColor: palette.border, paddingBottom: insets.bottom + 16 }]}>
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  /* `flex items-start gap-3 px-5 pt-5 pb-4` (izoh bo'lsa `pb-3`) */
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headWithText: { paddingBottom: 12 },
  close: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 999 },
  titles: { flex: 1, minWidth: 0, gap: 4 },
  description: { fontWeight: "400" },
  /* `flex flex-col gap-4 px-5 pb-5` */
  body: { gap: 16, paddingHorizontal: 20, paddingBottom: 20 },
  /* `flex gap-3 px-5 py-4 border-t` */
  footer: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1 },
});
