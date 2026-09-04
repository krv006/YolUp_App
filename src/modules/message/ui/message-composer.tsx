import { useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SendHorizontal, X } from "lucide-react-native";
import type { ChatMessage, SendMessagePayload } from "@/shared/types";
import { fontSize, IconButton, MIN_TOUCH_SIZE, radius, Text, useTheme } from "@/shared/ui";

export interface MessageComposerProps {
  onSend: (payload: SendMessagePayload) => void;
  onTyping: () => void;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  disabled?: boolean;
  /** Blok holati sababi — direct suhbat `pending`/`blocked` bo'lsa. */
  disabledReason?: string;
}

/** "Yozmoqda" signali shu oraliqda bir martadan ko'p yuborilmaydi. */
const TYPING_THROTTLE_MS = 2500;

/**
 * Xabar yozish paneli.
 *
 * Balandligi matn bilan birga o'sadi, lekin cheklangan: aks holda uzun xabar
 * yozayotganda butun ekranni egallab, suhbatning o'zi ko'rinmay qoladi.
 */
export function MessageComposer({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  disabled = false,
  disabledReason,
}: MessageComposerProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [lastTypingAt, setLastTypingAt] = useState(0);

  const canSend = text.trim().length > 0 && !disabled;

  function handleChange(value: string) {
    setText(value);
    const now = Date.now();
    if (now - lastTypingAt > TYPING_THROTTLE_MS) {
      setLastTypingAt(now);
      onTyping();
    }
  }

  function send() {
    const value = text.trim();
    if (!value) return;
    onSend({
      text: value,
      replyTo: replyTo
        ? { author: replyTo.senderName || "Xabar", text: replyTo.text }
        : undefined,
    });
    setText("");
    onCancelReply();
  }

  if (disabled && disabledReason) {
    return (
      <View
        style={[
          styles.blocked,
          {
            backgroundColor: palette.surface,
            borderTopColor: palette.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <Text variant="caption" tone="muted" style={styles.blockedText}>
          {disabledReason}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
      ]}
    >
      {replyTo ? (
        <View style={[styles.replyBar, { backgroundColor: palette["primary-tint"] }]}>
          <View style={[styles.replyAccent, { backgroundColor: palette["primary-text"] }]} />
          <View style={styles.replyBody}>
            <Text variant="caption" tone="brand" numberOfLines={1}>
              {replyTo.senderName || "Xabar"}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {replyTo.text}
            </Text>
          </View>
          <IconButton accessibilityLabel="Javobni bekor qilish" onPress={onCancelReply}>
            <X size={18} color={palette["muted-foreground"]} />
          </IconButton>
        </View>
      ) : null}

      <View style={styles.row}>
        <TextInput
          style={[
            styles.input,
            {
              color: palette.foreground,
              backgroundColor: palette["surface-subtle"],
              borderColor: palette.border,
            },
          ]}
          placeholder="Xabar yozing…"
          placeholderTextColor={palette["muted-foreground"]}
          value={text}
          onChangeText={handleChange}
          multiline
          // iOS'da `multiline` bilan `blurOnSubmit=false` bo'lmasa Enter
          // klaviaturani yopib yuboradi.
          blurOnSubmit={false}
          accessibilityLabel="Xabar matni"
          maxLength={4000}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yuborish"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={send}
          style={({ pressed }) => [
            styles.send,
            {
              backgroundColor: canSend ? palette.primary : palette.muted,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <SendHorizontal
            size={20}
            color={canSend ? palette["primary-foreground"] : palette["muted-foreground"]}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 10, gap: 8 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    // Uzun xabar butun ekranni egallab ketmasin.
    maxHeight: 130,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "ios" ? 12 : 8,
    paddingBottom: Platform.OS === "ios" ? 12 : 8,
    fontSize: fontSize.lg,
  },
  send: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: MIN_TOUCH_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  replyBar: { flexDirection: "row", alignItems: "center", borderRadius: radius.sm, overflow: "hidden" },
  replyAccent: { width: 3, alignSelf: "stretch" },
  replyBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 6, gap: 2 },
  blocked: { borderTopWidth: StyleSheet.hairlineWidth, padding: 16 },
  blockedText: { textAlign: "center" },
});
