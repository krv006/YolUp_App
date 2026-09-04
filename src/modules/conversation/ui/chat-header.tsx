import { StyleSheet, View } from "react-native";
import { ArrowLeft, Video } from "lucide-react-native";
import type { Conversation } from "@/shared/types";
import { Avatar, IconButton, Text, useTheme } from "@/shared/ui";

export interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void;
  /** Shu guruhda dars ketyapti — tugma darsga olib kiradi. */
  onJoinLive?: () => void;
  socketOffline?: boolean;
}

/**
 * Veb `chat-header.tsx` ning mobil varianti.
 *
 * Qo'shimcha: ulanish holati. Veb'da tab doim ochiq turadi va uzilish kam
 * uchraydi; mobilda esa tarmoq muntazam uziladi va foydalanuvchi nega yangi
 * xabar kelmayotganini bilishi kerak (§9.1).
 */
export function ChatHeader({ conversation, onBack, onJoinLive, socketOffline }: ChatHeaderProps) {
  const { palette } = useTheme();

  const subtitle = socketOffline
    ? "Ulanish tiklanmoqda…"
    : conversation.type === "group"
      ? `${conversation.memberCount ?? 1} ishtirokchi`
      : conversation.status === "online"
        ? "Hozir onlayn"
        : "Yaqinda faol edi";

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: palette.surface, borderBottomColor: palette.border },
      ]}
    >
      <IconButton accessibilityLabel="Suhbatlar ro'yxatiga qaytish" onPress={onBack}>
        <ArrowLeft size={22} color={palette.foreground} />
      </IconButton>

      <Avatar
        name={conversation.title}
        tone={conversation.avatarTone}
        src={conversation.imageUrl}
        size="md"
        status={conversation.type === "direct" ? conversation.status : undefined}
      />

      <View style={styles.identity}>
        <Text variant="label" numberOfLines={1}>
          {conversation.title}
        </Text>
        <Text
          variant="caption"
          tone={socketOffline ? "danger" : "muted"}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>

      {onJoinLive ? (
        <IconButton accessibilityLabel="Jonli darsga kirish" onPress={onJoinLive}>
          <Video size={22} color={palette.destructive} />
        </IconButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  identity: { flex: 1, gap: 2 },
});
