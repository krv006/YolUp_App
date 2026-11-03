import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  NOTIFICATION_CATEGORIES,
  notificationCategory,
  notificationGroupKey,
  notificationIcon,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationsUnread,
  useNotificationInbox,
  type InboxNotification,
  type NotificationCategory,
  type NotificationGroupKey,
} from "@/modules/notification";
import { splitHtml } from "@/pages/notifications/notifications-page";
import { ROUTES } from "@/shared/config";
import { formatMessageTime } from "@/shared/lib";
import { DsText, dsRadius, Icon, MobilePageHeader, MobileRoundButton, toast, toneColors, useDs, type IconName } from "@/shared/ui";
import { ParentScreen, useParentBack, useParentNotificationLink } from "@/widgets/parent-shell";
import { NotificationActions } from "./notification-actions";

const GROUPS: NotificationGroupKey[] = ["today", "yesterday", "earlier"];

/**
 * Ota-ona bildirishnomalari — veb `parent-notifications-page.tsx`: toifa
 * chiplari (Barchasi / Davomat / Vazifalar / Xavfsizlik), kun bo'yicha
 * guruhlar, o'qilmaganlari ko'k fonda, har birida "…" amallar oynasi;
 * "hammasini o'qildi" (bekor qilish bilan). Havola farzandni tanlab
 * bo'limni ochadi.
 */
export function ParentNotificationsPage() {
  const { t } = useTranslation("notification");
  const { t: tp } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const back = useParentBack(ROUTES.parent.dashboard);
  const inbox = useNotificationInbox({ page_size: 30 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const markUnread = useMarkNotificationsUnread();
  const openLink = useParentNotificationLink();
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [acting, setActing] = useState<InboxNotification | null>(null);

  const all = inbox.data?.items ?? [];
  const items = category === "all" ? all : all.filter((item) => notificationCategory(item) === category);
  const unread = all.filter((item) => !item.isRead).length;

  function open(item: InboxNotification) {
    if (!item.isRead) markRead.mutate(item.notificationId);
    if (item.link) openLink(item.link, item.kind, item.data);
  }

  function readAll() {
    const ids = all.filter((item) => !item.isRead).map((item) => item.notificationId);
    markAll.mutate(undefined, {
      onSuccess: () =>
        toast.success(tp("mobile.notifications.actions.allRead", { count: ids.length }), {
          action: { label: tp("mobile.notifications.actions.undo"), onClick: () => markUnread.mutate(ids) },
        }),
    });
  }

  const groups = GROUPS.map((key) => ({ key, items: items.filter((item) => notificationGroupKey(item.createdAt) === key) })).filter((group) => group.items.length);

  return (
    <ParentScreen onRefresh={() => inbox.refetch()}>
      <MobilePageHeader
        title={t("title")}
        backLabel={t("back")}
        onBack={back}
        action={unread ? <MobileRoundButton icon="done-all" label={t("markAllRead")} disabled={markAll.isPending} onPress={readAll} /> : undefined}
      />
      {/* `-mx-4 flex gap-2 overflow-x-auto px-4`, chip `h-11 rounded-full px-5 text-title-sm font-medium` */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.chips}>
        {(["all", ...NOTIFICATION_CATEGORIES] as const).map((id) => {
          const active = category === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setCategory(id)}
              style={[styles.chip, { backgroundColor: active ? ds.c.brand : ds.c.surface }]}
            >
              <DsText v="title-sm" w="500" c={active ? "on-action" : "ink"}>
                {t(`categories.${id}`)}
              </DsText>
            </Pressable>
          );
        })}
      </ScrollView>

      {inbox.isLoading ? <View style={[styles.skeleton, { backgroundColor: ds.c.surface }]} /> : null}

      {inbox.isSuccess && !items.length ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
            <Icon name="notifications-off" size={30} color={ds.c.brand} />
          </View>
          <DsText v="title-lg" heading style={styles.center}>
            {t("emptyTitle")}
          </DsText>
          <DsText v="body-sm" c="ink-secondary" style={styles.center}>
            {tp("mobile.notifications.empty")}
          </DsText>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(ROUTES.parent.settings() as never)}
            style={({ pressed }) => [styles.settings, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
          >
            <Icon name="settings" size={18} color={ds.c["on-action"]} />
            <DsText v="button" c="on-action">
              {tp("mobile.notifications.settings")}
            </DsText>
          </Pressable>
        </View>
      ) : null}

      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <DsText v="body-sm" c="ink-secondary" style={styles.groupTitle}>
            {t(`groups.${group.key}`)}
          </DsText>
          <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
            {group.items.map((item, index) => {
              const { icon, tone } = notificationIcon(item);
              const colors = toneColors(tone, ds);
              const text = item.title ? { title: item.title, body: item.body } : splitHtml(item.html);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.item,
                    index < group.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
                    !item.isRead && { backgroundColor: ds.c["brand-subtle"] },
                  ]}
                >
                  <Pressable accessibilityRole="button" onPress={() => open(item)} style={({ pressed }) => [styles.itemMain, pressed && styles.pressed]}>
                    <View style={[styles.itemIcon, { backgroundColor: colors.bg }]}>
                      <Icon name={icon as IconName} size={22} color={colors.fg ?? ds.c.ink} />
                    </View>
                    <View style={styles.itemText}>
                      {text.title ? (
                        <DsText v="title-sm" numberOfLines={2}>
                          {text.title}
                        </DsText>
                      ) : null}
                      {text.body ? (
                        <DsText v="body-xs" c="ink-secondary" numberOfLines={text.title ? 2 : 3}>
                          {text.body}
                        </DsText>
                      ) : null}
                    </View>
                    <View style={styles.itemMeta}>
                      <DsText v="caption" c="ink-secondary">
                        {item.createdAt ? formatMessageTime(item.createdAt) : ""}
                      </DsText>
                      {item.isRead ? null : <View style={[styles.dot, { backgroundColor: ds.c.brand }]} />}
                    </View>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={tp("mobile.notifications.actions.title")} onPress={() => setActing(item)} style={styles.more}>
                    <Icon name="more-horiz" size={20} color={ds.c["icon-tertiary"]} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      ))}
      <NotificationActions item={acting} onOpen={open} onClose={() => setActing(null)} />
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  pressed: { opacity: 0.8 },
  strip: { marginHorizontal: -16, flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 16 },
  chip: { height: 44, justifyContent: "center", paddingHorizontal: 20, borderRadius: dsRadius.full },
  skeleton: { height: 256, borderRadius: 20 },
  empty: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingTop: 96 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  settings: { marginTop: 4, height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, borderRadius: dsRadius.full },
  group: { gap: 8 },
  groupTitle: { paddingHorizontal: 4 },
  list: { overflow: "hidden", borderRadius: 20 },
  item: { flexDirection: "row", alignItems: "flex-start" },
  /* `flex min-w-0 flex-1 items-start gap-3 py-3.5 pl-4` */
  itemMain: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 14, paddingLeft: 16 },
  itemIcon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  itemText: { flex: 1, minWidth: 0, gap: 2 },
  itemMeta: { flexShrink: 0, alignItems: "flex-end", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  /* `grid h-12 w-11 place-items-center` */
  more: { width: 44, height: 48, alignItems: "center", justifyContent: "center" },
});
