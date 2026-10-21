import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/modules/auth";
import {
  NotificationBell,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationInbox,
  type InboxNotification,
  type NotificationLink,
} from "@/modules/notification";
import { ROLES } from "@/shared/constants";
import { formatMessageTime, htmlToPlainText } from "@/shared/lib";
import { AppBar, AppBarAction, Icon, type IconName, PullRefresh, radius, Screen, Text, useTheme } from "@/shared/ui";

const LESSON_REMINDER_KIND = "lesson_reminder";
type GroupKey = "today" | "yesterday" | "earlier";

function groupKeyOf(value: string): GroupKey {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "earlier";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (date.getTime() >= start.getTime()) return "today";
  if (date.getTime() >= start.getTime() - 86_400_000) return "yesterday";
  return "earlier";
}

/**
 * Bildirishnomalar — veb `pages/notifications/notifications-page.tsx` va
 * `notification-inbox-panel.tsx`: "Hammasi / O'qilmagan" filtrlari, kun
 * bo'yicha guruhlar ("Bugun", "Kecha", "Avvalgi") va rangli ikonkalar.
 *
 * Vebdan farqi: bosilganda bildirishnoma havolasi (test, imtihon,
 * vazifa) ham ochiladi — vebda u faqat o'qilgan deb belgilanadi.
 */
export function NotificationsPage() {
  const { t } = useTranslation("notification");
  const { t: tw } = useTranslation("workspace");
  const { palette } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const inbox = useNotificationInbox({ page_size: 30 }, true);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;
  const rolePrefix = user?.role === ROLES.STUDENT ? "/student" : user?.role === ROLES.PARENT ? "/parent" : "/teacher";
  const all = inbox.data?.items ?? [];
  const unreadCount = all.filter((item) => !item.isRead).length;
  const items = unreadOnly ? all.filter((item) => !item.isRead) : all;
  const groups = (["today", "yesterday", "earlier"] as GroupKey[])
    .map((key) => ({ key, items: items.filter((item) => groupKeyOf(item.createdAt) === key) }))
    .filter((group) => group.items.length > 0);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    // Adminda Ish maydoni yo'q — boshqaruv paneliga qaytadi.
    else router.replace((isAdmin ? "/admin/dashboard" : `${rolePrefix}/workspace`) as never);
  }, [router, rolePrefix, isAdmin]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        goBack();
        return true;
      });
      return () => subscription.remove();
    }, [goBack])
  );

  function openLink(link: NotificationLink | null) {
    if (!link) return;
    // Veb admin paneli: o'qituvchi haqidagi xabar o'qituvchilar ro'yxatida o'sha qatorni ochadi.
    if (link.type === "teacher") router.push(`/admin/teachers?teacher=${encodeURIComponent(link.id)}` as never);
    else if (link.type === "quiz") router.push(`${rolePrefix}/quizzes?quiz=${link.id}` as never);
    else if (link.type === "exam") router.push((rolePrefix === "/student" ? `/student/exams/${link.id}` : `${rolePrefix}/exams`) as never);
    else if (link.type === "assignment" || link.type === "submission")
      router.push((rolePrefix === "/teacher" ? "/teacher/assignments" : `${rolePrefix}/chats`) as never);
  }

  function openItem(item: InboxNotification) {
    if (!item.isRead) markRead.mutate(item.notificationId);
    openLink(item.link);
  }

  function iconFor(item: InboxNotification): { icon: IconName; bg: string; fg: string } {
    const lesson = { bg: palette["saffron-soft"], fg: palette["saffron-strong"] };
    const done = { bg: palette["success-soft"], fg: palette["success-strong"] };
    const action = { bg: palette["primary-soft"], fg: palette.primary };
    if (item.kind === LESSON_REMINDER_KIND) return { icon: "clock", ...lesson };
    if (item.link?.type === "submission") return { icon: "check-circle", ...done };
    if (item.link?.type === "assignment" || item.link?.type === "quiz") return { icon: "assign", ...action };
    if (item.targetType === "all") return { icon: "bell", ...action };
    if (item.kind === "mention") return { icon: "person", ...action };
    return { icon: "groups", ...done };
  }

  return (
    <Screen padded={false}>
      <AppBar title={tw("title")} back={{ label: tw("searchBack"), onPress: goBack }}>
        <AppBarAction name="search" label={tw("searchAria")} onPress={() => router.push(`${rolePrefix}/search` as never)} />
        <NotificationBell />
      </AppBar>

      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("openAria")} onPress={goBack} style={styles.back}>
          <Icon name="arrow-back" size={22} color={palette.foreground} />
        </Pressable>
        <Text variant="heading" numberOfLines={1} style={styles.grow}>
          {t("title")}
        </Text>
      </View>

      <View style={styles.filters}>
        {[
          { id: "all", label: t("filterAll"), active: !unreadOnly },
          { id: "unread", label: t("filterUnread", { count: unreadCount }), active: unreadOnly },
        ].map((chip) => (
          <Pressable
            key={chip.id}
            accessibilityRole="button"
            onPress={() => setUnreadOnly(chip.id === "unread")}
            style={[
              styles.filter,
              chip.active
                ? { borderColor: palette.primary, backgroundColor: palette["primary-soft"] }
                : { borderColor: palette.border, backgroundColor: palette.surface },
            ]}
          >
            <Text variant="caption" style={[styles.strong, { color: chip.active ? palette.primary : palette["muted-foreground"] }]}>
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.grow}
        contentContainerStyle={styles.body}
        refreshControl={<PullRefresh onRefresh={() => inbox.refetch()} />}
      >
        {/* `px-5 pt-4 pb-3` — o'ng tomonda "Hammasini o'qildi". */}
        <View style={styles.toolbar}>
          <View style={styles.grow} />
          {items.some((item) => !item.isRead) ? (
            <Pressable accessibilityRole="button" disabled={markAllRead.isPending} onPress={() => markAllRead.mutate()}>
              <Text variant="label" style={{ color: palette.primary, opacity: markAllRead.isPending ? 0.5 : 1 }}>
                {t("markAllRead")}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {inbox.isLoading ? (
          <View style={styles.skeletons}>
            {Array.from({ length: 3 }, (_, index) => (
              <View key={index} style={styles.skeletonRow}>
                <View style={[styles.skeletonDot, { backgroundColor: palette.muted }]} />
                <View style={[styles.grow, styles.skeletonLines]}>
                  <View style={[styles.skeletonLine, { width: "80%", backgroundColor: palette.muted }]} />
                  <View style={[styles.skeletonLine, { width: "40%", backgroundColor: palette.muted }]} />
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {inbox.isError ? (
          <View style={styles.state}>
            <Text variant="body" style={styles.strong}>
              {t("loadError")}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => void inbox.refetch()} style={[styles.retry, { backgroundColor: palette.muted }]}>
              <Text variant="label">{t("retry")}</Text>
            </Pressable>
          </View>
        ) : null}

        {inbox.isSuccess && !items.length ? (
          <View style={styles.state}>
            <View style={[styles.emptyIcon, { backgroundColor: palette["primary-soft"] }]}>
              <Icon name="bell" size={28} color={palette.primary} />
            </View>
            <Text variant="subheading" style={styles.emptyTitle}>
              {t("emptyTitle")}
            </Text>
            <Text variant="label" style={[styles.regular, styles.centerText, { color: palette["muted-foreground"] }]}>
              {t("emptyDescription")}
            </Text>
          </View>
        ) : null}

        {groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <Text variant="label" style={[styles.groupLabel, { color: palette["subtle-foreground"] }]}>
              {t(`groups.${group.key}`)}
            </Text>
            <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
              {group.items.map((item) => {
                const { icon, bg, fg } = iconFor(item);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => openItem(item)}
                    style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette["surface-subtle"] }]}
                  >
                    <View style={[styles.icon, { backgroundColor: bg }]}>
                      <Icon name={icon} size={17} color={fg} />
                    </View>
                    <View style={[styles.grow, styles.rowText]}>
                      <Text variant="label" numberOfLines={2} style={styles.regular}>
                        {htmlToPlainText(item.html, 240)}
                      </Text>
                      <Text variant="caption" numberOfLines={1} style={[styles.caption, { color: palette["subtle-foreground"] }]}>
                        {item.sender?.name ?? t("system")} · {item.createdAt ? formatMessageTime(item.createdAt) : ""}
                      </Text>
                    </View>
                    {item.isRead ? null : (
                      <View accessibilityLabel={t("markRead")} style={[styles.unread, { backgroundColor: palette.primary }]} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  strong: { fontWeight: "600" },
  regular: { fontWeight: "400" },
  caption: { fontWeight: "500" },
  centerText: { textAlign: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  back: { width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  /* `px-4 pb-2 gap-2` */
  filters: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  filter: { height: 36, justifyContent: "center", paddingHorizontal: 16, borderWidth: 1, borderRadius: radius.full },
  body: { paddingBottom: 16 },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  skeletons: { gap: 12, paddingHorizontal: 20, paddingBottom: 20 },
  skeletonRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  skeletonDot: { width: 36, height: 36, borderRadius: radius.full },
  skeletonLines: { gap: 8 },
  skeletonLine: { height: 10, borderRadius: radius.full },
  state: { alignItems: "center", gap: 8, paddingHorizontal: 32, paddingVertical: 40 },
  retry: { marginTop: 8, height: 40, justifyContent: "center", paddingHorizontal: 16, borderRadius: radius.full },
  emptyIcon: { width: 64, height: 64, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 8 },
  /* `px-4 pb-4 gap-2`, guruh ichida `gap-1.5` */
  group: { gap: 6, paddingHorizontal: 16, marginBottom: 8 },
  groupLabel: { paddingHorizontal: 8, paddingTop: 8 },
  card: { overflow: "hidden", borderWidth: 1, borderRadius: radius.xl },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderRadius: radius.xl },
  icon: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  rowText: { gap: 2 },
  unread: { marginTop: 6, width: 8, height: 8, borderRadius: radius.full },
});
