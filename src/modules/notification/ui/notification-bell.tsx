import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { AppBarAction, CountBadge } from "@/shared/ui";
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
  const unread = useUnreadNotificationCount();
  const count = unread.data ?? 0;

  return (
    <AppBarAction
      name="bell"
      label={t("chats.bildirishnomalar")}
      onPress={() => router.push("/notifications")}
      badge={
        count > 0 ? (
          <View style={styles.badge}>
            <CountBadge count={count} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  badge: { position: "absolute", top: -2, right: -2 },
});
