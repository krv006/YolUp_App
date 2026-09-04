import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { radius } from "./tokens";
import { useTheme } from "./theme";
import { Text } from "./text";
import { IconButton } from "./misc";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Pastdan ochiladigan oyna — veb `Dialog` ning mobil o'rni.
 *
 * `@gorhom/bottom-sheet` ATAYLAB olinmadi: bu yerda sudrash bilan yopish,
 * bir nechta to'xtash nuqtasi yoki ro'yxat bilan integratsiya kerak emas —
 * oddiy `Modal` yetadi va bitta nativ bog'liqlik kam bo'ladi. Jonli darsda
 * (Faza 4) haqiqiy sudraladigan panel kerak bo'lsa, o'sha yerda kiritiladi.
 *
 * Klaviatura hisobga olinadi: forma maydonlari ko'p bo'lgani uchun busiz
 * pastdagi tugma klaviatura ostida qolib ketardi.
 */
export function Sheet({ open, onClose, title, description, children }: SheetProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yopish"
          style={[styles.backdrop, { backgroundColor: palette.overlay }]}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: palette["surface-elevated"],
              borderColor: palette.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: palette["border-strong"] }]} />

          <View style={styles.head}>
            <View style={styles.headBody}>
              <Text variant="subheading">{title}</Text>
              {description ? (
                <Text variant="caption" tone="muted">
                  {description}
                </Text>
              ) : null}
            </View>
            <IconButton accessibilityLabel="Yopish" onPress={onClose}>
              <X size={20} color={palette["muted-foreground"]} />
            </IconButton>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  sheet: {
    // Ekranning ko'pi bilan 88% i — orqadagi kontekst ko'rinib tursin.
    maxHeight: "88%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 10 },
  head: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, gap: 8 },
  headBody: { flex: 1, gap: 2, paddingTop: 6 },
  body: { padding: 16, gap: 14 },
});
