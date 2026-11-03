import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useAuth, useUpdateNotificationPrefsMutation } from "@/modules/auth";
import { useDeleteNotification, useMarkNotificationRead, useMarkNotificationsUnread, type InboxNotification } from "@/modules/notification";
import { DsText, dsRadius, Icon, Sheet, toast, useDs, type IconName } from "@/shared/ui";

/** Pastki oyna yopilib bo'lgach havola ochiladi. */
const SHEET_CLOSE_MS = 350;

/**
 * Bildirishnoma amallari — veb `notification-actions.tsx`: ochish, o'qildi /
 * o'qilmagan, bu turdagi xabarlarni o'chirish (bekor qilish bilan) va
 * o'chirib tashlash.
 */
export function NotificationActions({ item, onOpen, onClose }: { item: InboxNotification | null; onOpen: (item: InboxNotification) => void; onClose: () => void }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const { user } = useAuth();
  const markRead = useMarkNotificationRead();
  const markUnread = useMarkNotificationsUnread();
  const remove = useDeleteNotification();
  const prefs = useUpdateNotificationPrefsMutation();
  const muted = user?.mutedKinds ?? [];
  const kind = item?.kind ?? "";

  function mute() {
    const previous = muted;
    prefs.mutate(
      { mutedKinds: [...muted, kind] },
      {
        onSuccess: () =>
          toast.success(t("mobile.notifications.actions.muted"), {
            action: { label: t("mobile.notifications.actions.undo"), onClick: () => prefs.mutate({ mutedKinds: previous }) },
          }),
      }
    );
  }

  const actions: Array<{ id: string; icon: IconName; label: string; danger?: boolean; run: () => void }> = item
    ? [
        ...(item.link ? [{ id: "open", icon: "arrow-forward" as const, label: t("mobile.notifications.actions.open"), run: () => setTimeout(() => onOpen(item), SHEET_CLOSE_MS) }] : []),
        item.isRead
          ? { id: "unread", icon: "mark-chat-unread" as const, label: t("mobile.notifications.actions.unread"), run: () => markUnread.mutate([item.notificationId]) }
          : { id: "read", icon: "check" as const, label: t("mobile.notifications.actions.read"), run: () => markRead.mutate(item.notificationId) },
        ...(kind && !muted.includes(kind) ? [{ id: "mute", icon: "notifications-off" as const, label: t("mobile.notifications.actions.mute"), run: mute }] : []),
        {
          id: "delete",
          icon: "delete",
          label: t("mobile.notifications.actions.delete"),
          danger: true,
          run: () =>
            remove.mutate(item.notificationId, {
              onSuccess: () => toast.success(t("mobile.notifications.actions.deleted")),
              onError: () => toast.error(t("mobile.notifications.actions.failed")),
            }),
        },
      ]
    : [];

  return (
    <Sheet variant="app" open={Boolean(item)} onClose={onClose} title={item?.title || t("mobile.notifications.actions.title")} description={item?.body || undefined}>
      {/* `flex flex-col overflow-hidden rounded-2xl bg-subtle`, qator `h-14 px-4 gap-3 text-title-sm` */}
      <View style={[styles.list, { backgroundColor: ds.c.subtle }]}>
        {actions.map((action, index) => (
          <Pressable
            key={action.id}
            accessibilityRole="button"
            onPress={() => {
              action.run();
              onClose();
            }}
            style={({ pressed }) => [styles.row, index < actions.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }, pressed && { backgroundColor: ds.c.muted }]}
          >
            <Icon name={action.icon} size={22} color={ds.c[action.danger ? "error-text" : "icon-secondary"]} />
            <DsText v="title-sm" c={action.danger ? "error-text" : "ink"}>
              {action.label}
            </DsText>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { overflow: "hidden", marginBottom: 8, borderRadius: dsRadius["2xl"] },
  row: { height: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
});
