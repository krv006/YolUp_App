import { Pressable, StyleSheet, View } from "react-native";
import { UsersRound, Video } from "lucide-react-native";
import { formatConversationTime } from "@/shared/lib";
import type { Conversation } from "@/shared/types";
import { Avatar, CountBadge, MIN_TOUCH_SIZE, Text, useTheme } from "@/shared/ui";

export interface ConversationItemProps {
  conversation: Conversation;
  onPress: (id: string) => void;
  /** Shu guruhda hozir jonli dars ketyapti — ro'yxatdan turib ko'rinadi. */
  live?: boolean;
}

/**
 * Veb `src/modules/conversation/ui/conversation-item.tsx` ning mobil varianti.
 *
 * Umumiy `ListItem` ATAYLAB ishlatilmadi: ko'rinish qatori oddiy matn emas —
 * ikonka, "yozmoqda" rangi va jonli dars holati bor.
 *
 * Xulq veb bilan bir xil: jonli dars oxirgi xabardan MUHIMROQ va uning
 * o'rnini egallaydi — o'quvchi qaysi guruhga kirishini ro'yxatdan turib
 * bilishi kerak.
 */
export function ConversationItem({ conversation, onPress, live = false }: ConversationItemProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${conversation.title}. ${
        conversation.unreadCount > 0 ? `${conversation.unreadCount} o'qilmagan xabar.` : ""
      } ${live ? "Dars ketmoqda." : ""}`}
      onPress={() => onPress(conversation.id)}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: palette["surface-subtle"] },
      ]}
    >
      <View>
        <Avatar
          name={conversation.title}
          tone={conversation.avatarTone}
          src={conversation.imageUrl}
          size="lg"
          // Onlayn nuqtasi faqat shaxsiy suhbatda ma'noga ega.
          status={conversation.type === "direct" ? conversation.status : undefined}
        />
        {live ? (
          <View
            style={[styles.liveRing, { borderColor: palette.destructive }]}
            pointerEvents="none"
          />
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text variant="label" numberOfLines={1} style={styles.title}>
            {conversation.title}
          </Text>
          <Text variant="caption" tone="muted">
            {formatConversationTime(conversation.updatedAt)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          {live ? (
            <View style={styles.preview}>
              <Video size={13} color={palette.destructive} />
              <Text
                variant="caption"
                style={{ color: palette["destructive-strong"] }}
                numberOfLines={1}
              >
                Dars ketmoqda
              </Text>
            </View>
          ) : (
            <View style={styles.preview}>
              {conversation.type === "group" ? (
                <UsersRound size={13} color={palette["muted-foreground"]} />
              ) : null}
              <Text
                variant="caption"
                tone={conversation.typing ? "brand" : "muted"}
                numberOfLines={1}
                style={styles.previewText}
              >
                {conversation.typing ? "yozmoqda…" : conversation.lastMessage || "Xabar yo'q"}
              </Text>
            </View>
          )}
          <CountBadge count={conversation.unreadCount} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: MIN_TOUCH_SIZE + 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  body: { flex: 1, gap: 4 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1 },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  preview: { flex: 1, flexDirection: "row", alignItems: "center", gap: 5 },
  previewText: { flexShrink: 1 },
  liveRing: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 26,
    borderWidth: 2,
  },
});
