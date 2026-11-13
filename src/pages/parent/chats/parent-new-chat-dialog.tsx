import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { DIRECT_STATUS, useDirectStatusLabel, useRequestDirect, useTeachersForDirect, type DirectTeacher } from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import { Avatar, DsText, dsRadius, Icon, Sheet, toast, useDs } from "@/shared/ui";

/**
 * O'qituvchiga yozish — veb `parent-new-chat-dialog.tsx` (pastki oyna):
 * o'quvchining o'qituvchilari, suhbat bo'lsa "Ochish", aks holda "So'rov".
 * Bloklangan yoki spam suhbatda tugma o'chiq.
 */
export function ParentNewChatDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const statusLabel = useDirectStatusLabel();
  const teachers = useTeachersForDirect(open);
  const request = useRequestDirect();

  function openChat(teacher: DirectTeacher) {
    if (teacher.roomId) {
      onOpenChange(false);
      router.push(ROUTES.parent.chat(teacher.roomId) as never);
      return;
    }
    request.mutate(teacher.id, {
      onSuccess: (room) => {
        if (room.directStatus !== DIRECT_STATUS.ACTIVE) toast.success(t("chats.requestSent"));
        onOpenChange(false);
        router.push(ROUTES.parent.chat(room.id) as never);
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  const items = teachers.data ?? [];

  return (
    <Sheet variant="app" open={open} onClose={() => onOpenChange(false)} title={t("chats.newTitle")} description={t("chats.newDescription")}>
      {/* `rounded-xl border border-line` */}
      <View style={[styles.list, { borderColor: ds.c.line }]}>
        {items.map((teacher, index) => {
          const locked = teacher.directStatus === DIRECT_STATUS.BLOCKED || teacher.directStatus === DIRECT_STATUS.SPAM;
          const disabled = locked || request.isPending;
          return (
            <View key={teacher.id} style={[styles.row, index < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
              <Avatar variant="legacy" name={teacher.name} src={teacher.avatarUrl ?? undefined} size="sm" box={40} />
              <View style={styles.grow}>
                <DsText v="title-sm" numberOfLines={1}>
                  {teacher.name}
                </DsText>
                <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                  @{teacher.username} · {statusLabel(teacher.directStatus)}
                </DsText>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={disabled}
                onPress={() => openChat(teacher)}
                style={({ pressed }) => [styles.action, { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }, disabled && styles.dim]}
              >
                <Icon name="chat" size={16} color={ds.c.brand} />
                <DsText v="caption-strong" c="brand">
                  {teacher.roomId ? t("chats.open") : t("chats.request")}
                </DsText>
              </Pressable>
            </View>
          );
        })}
        {!items.length ? (
          <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
            {teachers.isLoading ? t("chats.loading") : t("chats.noTeachers")}
          </DsText>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { overflow: "hidden", borderWidth: 1, borderRadius: dsRadius.xl, marginBottom: 8 },
  /* `gap-3 px-4 py-3` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  grow: { flex: 1, minWidth: 0 },
  /* `h-9 gap-1.5 rounded-full bg-brand-subtle px-3` */
  action: { height: 36, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: dsRadius.full },
  dim: { opacity: 0.5 },
  empty: { paddingHorizontal: 16, paddingVertical: 24, textAlign: "center" },
});
