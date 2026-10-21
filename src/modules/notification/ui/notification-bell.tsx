import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { AppBarAction, Text, useTheme } from "@/shared/ui";
import { useUnreadNotificationCount } from "../model/notification.queries";

/**
 * Tepa paneldagi qo'ng'iroq — veb `modules/notification/ui/notification-bell.tsx`
 * ning mobil o'rni. Vebda u har bir bo'lim tepa panelida o'qilmagan
 * bildirishnomalar sonini ko'rsatadi; mobilda ham har ekranda bir xil.
 *
 * Vebda bosilganda ochiladigan qalqib chiquvchi ro'yxat (popover) bor;
 * telefonda u bildirishnomalar sahifasiga olib boradi.
 */
export function NotificationBell() {
  const { t } = useTranslation("mobile");
  const router = useRouter();
  const { palette } = useTheme();
  const unread = useUnreadNotificationCount();
  const count = unread.data ?? 0;

  return (
    <AppBarAction
      name="bell"
      label={t("chats.bildirishnomalar")}
      onPress={() => router.push("/notifications")}
      badge={
        count > 0 ? (
          // `.notification-badge` — qizil, 17px, atrofida 2px oq chegara.
          <View style={[styles.badge, { backgroundColor: "#cd3a4b", borderColor: palette.surface }]}>
            <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#ffffff", fontSize: 11, lineHeight: 13, fontWeight: "700" },
});
