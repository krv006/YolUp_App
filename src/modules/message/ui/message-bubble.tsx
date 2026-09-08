import { Pressable, StyleSheet, View } from "react-native";
import { CheckCheck, RefreshCw } from "lucide-react-native";
import { formatMessageTime } from "@/shared/lib";
import type { ChatMessage } from "@/shared/types";
import { fontSize, radius, Text, useTheme } from "@/shared/ui";
import { MessageAttachment } from "./message-attachment";
import { MessageText } from "./message-text";

export interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string | null;
  /** Guruhda ketma-ket kelgan xabarlarda ism takrorlanmasin. */
  showSender?: boolean;
  onLongPress: (message: ChatMessage) => void;
  onRetryMessage?: (message: ChatMessage) => void;
}

/**
 * Veb `message-bubble.tsx` ning mobil varianti.
 *
 * Veb'da javob berish uchun pufakchani sudrash (framer-motion drag) bor edi.
 * Mobilda u ATAYLAB olib tashlandi: gorizontal sudrash Expo Router'ning
 * "orqaga surish" imkoniyati bilan to'qnashadi va foydalanuvchi javob
 * bermoqchi bo'lganda ekrandan chiqib ketadi. O'rniga uzoq bosish —
 * mobilda tanish va aniq harakat.
 */
export function MessageBubble({
  message,
  currentUserId = null,
  showSender = true,
  onLongPress,
  onRetryMessage,
}: MessageBubbleProps) {
  const { palette } = useTheme();
  const outgoing = message.senderId === currentUserId;

  if (message.type === "system") {
    return (
      <View style={styles.systemRow}>
        <View style={[styles.system, { backgroundColor: palette.muted }]}>
          <Text variant="caption" tone="muted" style={styles.systemText}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, outgoing ? styles.rowOutgoing : styles.rowIncoming]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${message.senderName || "Xabar"}: ${message.text}`}
        accessibilityHint="Amallar uchun uzoq bosing"
        onLongPress={() => onLongPress(message)}
        delayLongPress={280}
        style={({ pressed }) => [
          styles.bubble,
          {
            backgroundColor: outgoing ? palette["bubble-own"] : palette.surface,
            borderColor: outgoing ? "transparent" : palette.border,
            // Yuborilmagan xabar so'nik ko'rinadi — holat rang bilan ham
            // beriladi, faqat ikonka bilan emas.
            opacity: message.pending ? 0.6 : 1,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        {!outgoing && showSender && message.senderName ? (
          <Text variant="caption" tone="brand" style={styles.sender}>
            {message.senderName}
          </Text>
        ) : null}

        {message.replyTo ? (
          <View
            style={[
              styles.reply,
              {
                borderLeftColor: outgoing
                  ? palette["bubble-own-foreground"]
                  : palette["primary-text"],
                backgroundColor: outgoing ? "rgba(255,255,255,0.14)" : palette["primary-tint"],
              },
            ]}
          >
            <Text
              variant="caption"
              numberOfLines={1}
              style={{
                color: outgoing ? palette["bubble-own-foreground"] : palette["primary-text"],
              }}
            >
              {message.replyTo.author}
            </Text>
            <Text
              variant="caption"
              numberOfLines={1}
              tone={outgoing ? "onPrimary" : "muted"}
            >
              {message.replyTo.text}
            </Text>
          </View>
        ) : null}

        {message.text ? <MessageText text={message.text} outgoing={outgoing} /> : null}

        {/* Dars tugagach backend doska PDF'ini shu ko'rinishda yuboradi. */}
        {message.attachment ? (
          <MessageAttachment attachment={message.attachment} outgoing={outgoing} />
        ) : null}

        <View style={styles.meta}>
          {message.editedAt ? (
            <Text style={[styles.metaText, { color: metaColor(outgoing, palette) }]}>
              tahrirlangan
            </Text>
          ) : null}
          <Text style={[styles.metaText, { color: metaColor(outgoing, palette) }]}>
            {formatMessageTime(message.createdAt)}
          </Text>
          {outgoing && !message.pending && !message.failed ? (
            <CheckCheck
              size={14}
              color={
                message.status === "read"
                  ? palette["bubble-own-foreground"]
                  : metaColor(true, palette)
              }
            />
          ) : null}
        </View>

        {message.failed ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onRetryMessage?.(message)}
            style={styles.retry}
            hitSlop={6}
          >
            <RefreshCw size={13} color={palette["destructive-strong"]} />
            <Text variant="caption" tone="danger">
              Qayta yuborish
            </Text>
          </Pressable>
        ) : null}
      </Pressable>
    </View>
  );
}

function metaColor(outgoing: boolean, palette: ReturnType<typeof useTheme>["palette"]): string {
  // Chiquvchi pufakchada fon to'q ko'k — oq matnning so'niq varianti kerak,
  // `muted-foreground` u yerda o'qilmaydi.
  return outgoing ? "rgba(255,255,255,0.75)" : palette["muted-foreground"];
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 2 },
  rowIncoming: { alignItems: "flex-start" },
  rowOutgoing: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "84%",
    minWidth: 76,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  sender: { fontWeight: "600" },
  reply: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    paddingRight: 6,
    borderRadius: radius.xs,
    marginBottom: 2,
  },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 5 },
  metaText: { fontSize: fontSize["2xs"] },
  retry: { flexDirection: "row", alignItems: "center", gap: 5, paddingTop: 4 },
  systemRow: { alignItems: "center", paddingVertical: 6, paddingHorizontal: 16 },
  system: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full },
  systemText: { textAlign: "center" },
});
