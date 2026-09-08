import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { ChatMessage } from "@/shared/types";
import {
  MessageTextScale,
  radius,
  ScreenEmpty,
  ScreenError,
  Skeleton,
  Text,
  useTheme,
} from "@/shared/ui";
import { buildMessageRows, type MessageRow } from "../lib/message-day";
import { MessageBubble } from "./message-bubble";

export interface MessageListProps {
  messages?: ChatMessage[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onLongPress: (message: ChatMessage) => void;
  onRetryMessage?: (message: ChatMessage) => void;
  currentUserId?: string | null;
  /** Kimdir yozmoqda — teskari ro'yxatning eng pastida ko'rinadi. */
  typingName?: string | null;
}

export function MessageList({
  messages,
  loading,
  error,
  onRetry,
  onLongPress,
  onRetryMessage,
  currentUserId = null,
  typingName = null,
}: MessageListProps) {
  const rows = useMemo(() => buildMessageRows(messages ?? []), [messages]);

  if (loading) return <MessagesSkeleton />;

  if (error) {
    return <ScreenError message="Xabarlar yuklanmadi" onRetry={onRetry} />;
  }

  if (rows.length === 0) {
    return (
      <ScreenEmpty title="Xabarlar yo'q" description="Birinchi xabarni yozib suhbatni boshlang." />
    );
  }

  return (
    /*
     * Xabar matni o'lchami FAQAT shu daraxt ichida qo'llanadi. O'ram
     * ro'yxatning o'zida — shuning uchun ro'yxat qayerda ishlatilsa,
     * sozlama o'sha yerda ishlaydi va uni qo'shishni unutib bo'lmaydi.
     */
    <MessageTextScale>
      <FlashList
        data={rows}
        keyExtractor={(row) => (row.kind === "day" ? row.key : row.message.id)}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        /*
         * Chat xulqi (FlashList v2 da `inverted` o'rniga):
         *  - ro'yxat darhol pastdan ochiladi,
         *  - yangi xabar kelganda foydalanuvchi pastga yaqin bo'lsa avtomatik
         *    suriladi; yuqorida eski xabarlarni o'qiyotgan bo'lsa TEGILMAYDI.
         * Ikkinchisi muhim: aks holda har kelgan xabar o'qishni buzadi.
         */
        maintainVisibleContentPosition={{
          startRenderingFromBottom: true,
          autoscrollToBottomThreshold: 0.2,
        }}
        ListFooterComponent={typingName ? <TypingIndicator name={typingName} /> : null}
        renderItem={({ item }) => (
          <MessageRowView
            row={item}
            currentUserId={currentUserId}
            onLongPress={onLongPress}
            onRetryMessage={onRetryMessage}
          />
        )}
      />
    </MessageTextScale>
  );
}

function MessageRowView({
  row,
  currentUserId,
  onLongPress,
  onRetryMessage,
}: {
  row: MessageRow;
  currentUserId: string | null;
  onLongPress: (message: ChatMessage) => void;
  onRetryMessage?: (message: ChatMessage) => void;
}) {
  const { palette } = useTheme();

  if (row.kind === "day") {
    return (
      <View style={styles.dayRow}>
        <View style={[styles.day, { backgroundColor: palette.muted }]}>
          <Text variant="caption" tone="muted">
            {row.label}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <MessageBubble
      message={row.message}
      currentUserId={currentUserId}
      showSender={row.showSender}
      onLongPress={onLongPress}
      onRetryMessage={onRetryMessage}
    />
  );
}

/** Uch nuqta animatsiyasiz — statik matn low-end qurilmada arzonroq. */
function TypingIndicator({ name }: { name: string }) {
  return (
    <View style={styles.typing}>
      <Text variant="caption" tone="muted">
        {name.split(" ")[0]} yozmoqda…
      </Text>
    </View>
  );
}

function MessagesSkeleton() {
  return (
    <View style={styles.skeleton}>
      {Array.from({ length: 6 }, (_, index) => (
        <View key={index} style={index % 2 ? styles.skeletonRight : styles.skeletonLeft}>
          <Skeleton width={index % 3 === 0 ? 220 : 150} height={44} style={styles.skeletonBubble} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 10 },
  dayRow: { alignItems: "center", paddingVertical: 10 },
  day: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full },
  typing: { paddingHorizontal: 20, paddingVertical: 6 },
  skeleton: { flex: 1, paddingVertical: 16, gap: 10 },
  skeletonLeft: { paddingHorizontal: 12, alignItems: "flex-start" },
  skeletonRight: { paddingHorizontal: 12, alignItems: "flex-end" },
  skeletonBubble: { borderRadius: radius.md },
});
