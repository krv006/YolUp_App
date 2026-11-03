import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { useUnreadNotificationCount } from "@/modules/notification";
import { ROUTES } from "@/shared/config";
import { DsText, dsRadius, MobileRoundButton, useDs } from "@/shared/ui";

/**
 * Ota-ona qo'ng'irog'i — veb `widgets/parent-shell/parent-bell.tsx`
 * (`NotificationBell pageHref`): telefonda bildirishnomalar sahifasini ochadi,
 * o'qilmaganlar soni qizil belgida (`.notification-badge`, 99+ gacha).
 */
export function ParentBell() {
  const { t } = useTranslation("notification");
  const ds = useDs();
  const router = useRouter();
  const unread = useUnreadNotificationCount();
  const count = unread.data ?? 0;
  return (
    <MobileRoundButton
      icon="bell"
      iconNode={<Bell size={18} color={ds.c.icon} />}
      label={count ? t("unreadAria", { count }) : t("openAria")}
      background="surface"
      onPress={() => router.push(ROUTES.parent.notifications as never)}
      badge={
        count > 0 ? (
          <View style={[styles.badge, { backgroundColor: ds.c.danger, borderColor: ds.c.surface }]}>
            <DsText v="micro" w="700" c="on-action" style={styles.badgeText}>
              {count > 99 ? "99+" : count}
            </DsText>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  /* `.notification-badge`: `top/right -5px`, `17px`, `px-1`, `border-2 border-surface`, `--fs-2xs` 900 (shriftda 700 gacha) */
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderRadius: dsRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 9, lineHeight: 11, letterSpacing: 0 },
});
