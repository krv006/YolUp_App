import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Video } from "lucide-react-native";
import type { Conversation } from "@/shared/types";
import { Avatar, Icon, IconButton, radius, Text, useTheme } from "@/shared/ui";

export interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void;
  /** Sarlavha bosilganda — suhbat ma'lumoti oynasi. */
  onOpenInfo?: () => void;
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
export function ChatHeader({
  conversation,
  onBack,
  onOpenInfo,
  onJoinLive,
  socketOffline,
}: ChatHeaderProps) {
  const { t } = useTranslation("mobile");
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
      <IconButton accessibilityLabel={t("conversation.suhbatlar_royxatiga_qaytish")} onPress={onBack}>
        <ArrowLeft size={22} color={palette.foreground} />
      </IconButton>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${conversation.title} ma'lumotlarini ochish`}
        onPress={onOpenInfo}
        disabled={!onOpenInfo}
        style={({ pressed }) => [styles.identityRow, pressed && { opacity: 0.8 }]}
      >
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
            // Veb: ostki matn 12/16, qalinligi 500 (mobil `caption` 400).
            style={styles.subtitle}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </Pressable>

      {onJoinLive ? (
        <IconButton accessibilityLabel={t("conversation.jonli_darsga_kirish")} onPress={onJoinLive}>
          <Video size={22} color={palette.destructive} />
        </IconButton>
      ) : null}

      {/*
        * Vebdagi "..." tugmasi — u ham suhbat ma'lumotini ochadi.
        * Vebda yonida "Xabarlardan qidirish" ham bor, lekin mobilda
        * xabar bo'yicha qidiruv YO'Q, shuning uchun u qo'shilmadi:
        * ishlamaydigan tugma qo'yishdan ko'ra yo'qligi to'g'riroq.
        */}
      {onOpenInfo ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("conversation.suhbat_malumoti")}
          onPress={onOpenInfo}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Icon name="more" size={24} color={palette.foreground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /*
   * O'lchamlar veb DOM'idan (390px): panel 64 balandlik, OQ fon,
   * pastki chegara 1px, bo'shliq 0 12, oraliq 8; ichki tugma 44x44,
   * radius 999, oq fon va 1px chegara.
   */
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    gap: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  identityRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  identity: { flex: 1, gap: 2 },
  subtitle: { fontWeight: "500" },
  action: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
