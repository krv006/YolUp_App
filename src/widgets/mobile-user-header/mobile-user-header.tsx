import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { useAuth, useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { useUnreadNotificationCount } from "@/modules/notification";
import { Avatar, DsText, dsRadius, MobileRoundButton, useDs } from "@/shared/ui";

/**
 * Bosh sahifa sarlavhasi — veb `widgets/mobile-user-header`: 48px avatar,
 * ustida rol (o'qituvchida fani, o'quvchida guruhi), ostida ism va o'ngda
 * qo'ng'iroq. O'qilmagan bildirishnoma bo'lsa qo'ng'iroqda qizil nuqta
 * (son emas — vebda belgi `text-[0px]` bilan nuqtaga aylantirilgan).
 */
export function MobileUserHeader() {
  const { t } = useTranslation("dashboard");
  const { t: tn } = useTranslation("nav");
  const { t: tb } = useTranslation("notification");
  const ds = useDs();
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = useIsStudent();
  const routes = useRoleRoutes();
  const conversations = useConversations(isStudent ? "student" : "teacher");
  const unread = useUnreadNotificationCount();
  const name = user?.name ?? "";
  const unreadCount = unread.data ?? 0;
  const group = (conversations.data ?? []).find((item) => item.type === "group")?.title;

  return (
    <View style={styles.header}>
      <Avatar variant="legacy" name={name} src={user?.avatarUrl ?? undefined} size="lg" box={48} />
      <View style={styles.text}>
        <DsText v="caption" c="ink-secondary" numberOfLines={1}>
          {isStudent
            ? [tn("roles.student"), group].filter(Boolean).join(" · ")
            : user?.subject
              ? t("mobile.role", { subject: user.subject })
              : t("mobile.roleFallback")}
        </DsText>
        <DsText v="title-lg" numberOfLines={1}>
          {name}
        </DsText>
      </View>
      <MobileRoundButton
        icon="bell"
        iconNode={<Bell size={18} color={ds.c.ink} />}
        label={unreadCount ? tb("unreadAria", { count: unreadCount }) : tb("openAria")}
        background="surface"
        onPress={() => router.push(routes.notifications as never)}
        badge={
          unreadCount > 0 ? (
            <View style={[styles.dot, { backgroundColor: ds.c.danger, borderColor: ds.c.surface }]} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* `items-center gap-2.5` */
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  text: { flex: 1, minWidth: 0 },
  /* `absolute top-2.5 right-2.5 size-2 rounded-full bg-danger ring-2 ring-surface` */
  dot: { position: "absolute", top: 9, right: 9, width: 12, height: 12, borderWidth: 2, borderRadius: dsRadius.full },
});
