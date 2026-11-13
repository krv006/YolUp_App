import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { countUnreadChats, useConversations } from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import { DsText, dsRadius, MobileRoundButton, useDs } from "@/shared/ui";

/**
 * Kuzatuvchi sarlavhasidagi chat tugmasi — veb `parent-chat-button.tsx`:
 * `/parent/chats` ni ochadi, o'qilmagan suhbatlar soni ko'k belgida.
 */
export function ParentChatButton() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const unread = countUnreadChats(useConversations("parent").data ?? [], "all");
  return (
    <MobileRoundButton
      icon="chat-outline"
      label={unread ? t("chats.openWithUnread", { count: unread }) : t("chats.title")}
      background="surface"
      onPress={() => router.push(ROUTES.parent.chats as never)}
      badge={
        unread ? (
          /* `-top-0.5 -right-0.5 h-4.5 min-w-4.5 rounded-full bg-brand px-1 text-[10px] font-semibold` */
          <View style={[styles.badge, { backgroundColor: ds.c.brand }]}>
            <DsText v="micro" w="600" c="ink-inverse" style={styles.badgeText}>
              {unread}
            </DsText>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: dsRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 10, lineHeight: 12, letterSpacing: 0 },
});
