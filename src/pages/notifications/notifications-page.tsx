import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/modules/auth";
import {
  notificationActionKey,
  notificationGroupKey,
  notificationIcon,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationInbox,
  type NotificationGroupKey,
} from "@/modules/notification";
import { ROLES } from "@/shared/constants";
import { formatMessageTime, htmlToPlainText } from "@/shared/lib";
import {
  DsGradient,
  DsText,
  dsRadius,
  Icon,
  MobileEmptyCard,
  MobilePageHeader,
  MobileRoundButton,
  MobileSegment,
  PullRefresh,
  toneColors,
  useDs,
  type IconName,
} from "@/shared/ui";
import { useOpenNotificationLink } from "@/widgets/notification-link";

const GROUP_ORDER: NotificationGroupKey[] = ["today", "yesterday", "earlier"];

/**
 * Vebdagi `NotificationHtml` da birinchi `<b>`/`<strong>` alohida qator
 * (`text-title text-ink`), qolgani izoh (`text-body-sm text-ink-secondary`).
 */
function splitHtml(html: string): { title: string; body: string } {
  const match = /<(b|strong)>([\s\S]*?)<\/\1>/i.exec(html);
  if (!match) return { title: "", body: htmlToPlainText(html, 240) };
  return {
    title: htmlToPlainText(match[2] ?? "", 120),
    body: htmlToPlainText(html.replace(match[0], ""), 240),
  };
}

/**
 * Bildirishnomalar (M5.7–5.8) — veb `pages/notifications/notifications-page.tsx`:
 * sarlavha va "hammasini o'qildi", "Hammasi / O'qilmagan" segmenti, kun
 * bo'yicha guruhlar, rangli belgilar, amal havolasi va o'qilmagan nuqta.
 * Bosilganda o'qilgan deb belgilanadi va havola ochiladi.
 *
 * Vebda bu sahifa faqat o'qituvchi va o'quvchida; mobilda ota-ona va admin
 * ham shu sahifadan foydalanadi.
 */
export function NotificationsPage() {
  const { t } = useTranslation("notification");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const inbox = useNotificationInbox({ page_size: 30 }, true);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const openLink = useOpenNotificationLink();

  const all = inbox.data?.items ?? [];
  const unreadCount = all.filter((item) => !item.isRead).length;
  const items = tab === "unread" ? all.filter((item) => !item.isRead) : all;
  const groups = GROUP_ORDER.map((key) => ({
    key,
    items: items.filter((item) => notificationGroupKey(item.createdAt) === key),
  })).filter((group) => group.items.length > 0);

  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;
  const home = isAdmin
    ? "/admin/dashboard"
    : user?.role === ROLES.STUDENT
      ? "/student/workspace"
      : user?.role === ROLES.PARENT
        ? "/parent/workspace"
        : "/teacher/dashboard";

  // Vebdagi `navigate(-1)`; tarix bo'lmasa (bildirishnomadan ochilgan) — bosh sahifa.
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(home as never);
  }, [router, home]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        goBack();
        return true;
      });
      return () => subscription.remove();
    }, [goBack])
  );

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        refreshControl={<PullRefresh onRefresh={() => inbox.refetch()} />}
      >
        <DsGradient name="auth" />
        <MobilePageHeader
          title={t("title")}
          backLabel={t("back")}
          onBack={goBack}
          action={
            unreadCount ? (
              <MobileRoundButton
                icon="done-all"
                label={t("markAllRead")}
                disabled={markAllRead.isPending}
                onPress={() => markAllRead.mutate()}
              />
            ) : undefined
          }
        />

        <View style={styles.segment}>
          <MobileSegment
            items={[
              { id: "all", label: t("tabs.all") },
              { id: "unread", label: unreadCount ? t("tabs.unread", { count: unreadCount }) : t("tabs.unreadPlain") },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>

        {inbox.isLoading ? (
          <View style={[styles.card, styles.loading, { backgroundColor: ds.c.surface }]}>
            {Array.from({ length: 3 }, (_, index) => (
              <View key={index} style={[styles.skeletonRow, index < 2 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
                <View style={[styles.skeletonIcon, { backgroundColor: ds.c.subtle }]} />
                <View style={styles.skeletonLines}>
                  <View style={[styles.skeletonLine, { width: 160, backgroundColor: ds.c.subtle }]} />
                  <View style={[styles.skeletonLine, { width: 224, backgroundColor: ds.c.subtle }]} />
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {inbox.isError ? (
          <View style={styles.loading}>
            <MobileEmptyCard icon="wifi" title={t("loadError")} />
          </View>
        ) : null}

        {inbox.isSuccess && !items.length ? (
          <View style={styles.segment}>
            <MobileEmptyCard icon="notifications" title={t("emptyTitle")} description={t("emptyDescription")} />
          </View>
        ) : null}

        {groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <DsText>{t(`groups.${group.key}`)}</DsText>
            <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
              {group.items.map((item, index) => {
                const { icon, tone } = notificationIcon(item);
                const colors = toneColors(tone, ds);
                const action = notificationActionKey(item.link);
                const { title, body } = splitHtml(item.html);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => {
                      if (!item.isRead) markRead.mutate(item.notificationId);
                      if (item.link) openLink(item.link, item.kind);
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      index < group.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
                      !item.isRead ? { backgroundColor: ds.c["brand-subtle"] } : pressed && { backgroundColor: ds.c.subtle },
                    ]}
                  >
                    <View style={[styles.icon, { backgroundColor: colors.bg }]}>
                      <Icon name={icon as IconName} size={22} color={colors.fg ?? ds.c.brand} />
                    </View>
                    <View style={styles.text}>
                      <DsText v="body-sm" c="ink-secondary" numberOfLines={3}>
                        {title ? (
                          <DsText v="title">
                            {title}
                            {body ? "\n" : ""}
                          </DsText>
                        ) : null}
                        {body}
                      </DsText>
                      {action ? (
                        <DsText v="body-sm" w="600" c="brand-strong">
                          {t(`actions.${action}`)}
                        </DsText>
                      ) : null}
                    </View>
                    <View style={styles.meta}>
                      <DsText v="caption" c="ink-secondary">
                        {item.createdAt ? formatMessageTime(item.createdAt) : ""}
                      </DsText>
                      {item.isRead ? null : <View style={[styles.dot, { backgroundColor: ds.c.brand }]} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* `px-4 pt-5 pb-8` */
  page: { paddingHorizontal: 16 },
  segment: { marginTop: 20 },
  loading: { marginTop: 24 },
  /* `mt-5 gap-3` */
  group: { marginTop: 20, gap: 12 },
  /* `rounded-xl bg-surface` */
  card: { overflow: "hidden", borderRadius: dsRadius.xl },
  /* `items-start gap-3 px-4 py-3.5` */
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  /* `mt-0.5 size-10 rounded-lg` */
  icon: { marginTop: 2, width: 40, height: 40, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0, gap: 4 },
  /* `items-end gap-2.5 pt-0.5` */
  meta: { alignItems: "flex-end", gap: 10, paddingTop: 2 },
  dot: { width: 8, height: 8, borderRadius: dsRadius.full },
  skeletonRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  skeletonIcon: { width: 40, height: 40, borderRadius: dsRadius.lg },
  skeletonLines: { flex: 1, minWidth: 0, gap: 10, paddingTop: 4 },
  skeletonLine: { height: 12, maxWidth: "100%", borderRadius: dsRadius.full },
});
