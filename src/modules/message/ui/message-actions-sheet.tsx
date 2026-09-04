import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { Copy, Reply } from "lucide-react-native";
import type { ChatMessage } from "@/shared/types";
import { MIN_TOUCH_SIZE, radius, Text, toast, useTheme } from "@/shared/ui";

export interface MessageActionsSheetProps {
  message: ChatMessage | null;
  onClose: () => void;
  onReply: (message: ChatMessage) => void;
}

/**
 * Xabar ustida uzoq bosilganda ochiladigan amallar oynasi.
 *
 * Faqat IKKI amal bor va bu ataylab: backend hozircha xabarni tahrirlash,
 * o'chirish va reaksiyani QO'LLAB-QUVVATLAMAYDI (`message.api.ts` da ular
 * `unsupported()` qaytaradi). Ishlamaydigan tugmani ko'rsatib, bosilganda
 * xato chiqarishdan ko'ra umuman ko'rsatmaslik to'g'ri.
 *
 * `@gorhom/bottom-sheet` bu yerda ortiqcha — ro'yxat qisqa va statik,
 * shuning uchun oddiy `Modal` yetadi va bitta bog'liqlik kam bo'ladi.
 */
export function MessageActionsSheet({ message, onClose, onReply }: MessageActionsSheetProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  async function copyText() {
    if (!message) return;
    await Clipboard.setStringAsync(message.text);
    toast.success("Nusxalandi");
    onClose();
  }

  return (
    <Modal
      visible={Boolean(message)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Tashqariga bosilganda yopiladi — mobilda kutilgan xulq. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Yopish"
        style={[styles.backdrop, { backgroundColor: palette.overlay }]}
        onPress={onClose}
      >
        <Pressable
          // Ichkariga bosish yopmasin.
          onPress={() => undefined}
          style={[
            styles.sheet,
            {
              backgroundColor: palette["surface-elevated"],
              borderColor: palette.border,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: palette["border-strong"] }]} />

          {message?.text ? (
            <Text variant="caption" tone="muted" numberOfLines={2} style={styles.preview}>
              {message.text}
            </Text>
          ) : null}

          <Action
            icon={<Reply size={20} color={palette.foreground} />}
            label="Javob berish"
            onPress={() => {
              if (message) onReply(message);
              onClose();
            }}
          />
          <Action
            icon={<Copy size={20} color={palette.foreground} />}
            label="Nusxalash"
            onPress={() => void copyText()}
            disabled={!message?.text}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Action({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { opacity: disabled ? 0.4 : 1 },
        pressed && { backgroundColor: palette["surface-subtle"] },
      ]}
    >
      {icon}
      <Text variant="label">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  preview: { paddingHorizontal: 16, paddingBottom: 10 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: MIN_TOUCH_SIZE + 6,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
  },
});
