import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useConversationSync, useConversations } from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import { DsText, dsRadius, headingFont, Icon, MobileRoundButton, MobileSearchField, MobileButton, Skeleton, useDs } from "@/shared/ui";
import { ConversationRowBody } from "@/widgets/chat-shell/conversation-row";
import { ParentScreen, useParentBack } from "@/widgets/parent-shell";
import { ParentNewChatDialog } from "./parent-new-chat-dialog";

/**
 * Kuzatuvchi chatlari — veb `parent-chat-list.tsx` (tor ekran): orqaga,
 * "Chatlar" sarlavhasi va "+" (o'qituvchiga yozish), qidiruv, suhbatlar
 * ro'yxati (oxirgi xabar bo'yicha). Suhbat `ConversationPage` da ochiladi.
 */
export function ParentChatList() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const back = useParentBack(ROUTES.parent.dashboard);
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  useConversationSync("parent");
  const rooms = useConversations("parent");
  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      [...(rooms.data ?? [])]
        .filter((room) => (query ? room.title.toLowerCase().includes(query) : true))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [rooms.data, query]
  );

  return (
    <ParentScreen onRefresh={() => rooms.refetch()}>
      {/* `flex items-center gap-3`: orqaga, `text-[26px]/9` sarlavha, `bg-brand` "+" */}
      <View style={styles.header}>
        <MobileRoundButton icon="arrow-back" label={t("chats.back")} background="surface" onPress={back} />
        <DsText numberOfLines={1} style={[styles.title, { color: ds.c.ink }]}>
          {t("chats.title")}
        </DsText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("chats.newTitle")}
          onPress={() => setNewOpen(true)}
          style={({ pressed }) => [styles.add, { backgroundColor: ds.c.brand }, pressed && styles.pressed]}
        >
          <Icon name="add" size={22} color={ds.c["on-action"]} />
        </Pressable>
      </View>

      <MobileSearchField value={search} onChange={setSearch} placeholder={t("chats.searchPlaceholder")} ariaLabel={t("chats.searchPlaceholder")} clearLabel={t("attendanceView.clearSearch")} />

      <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
        {rooms.isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <View key={index} style={styles.skeleton}>
                <Skeleton width={48} height={48} style={styles.round} />
                <View style={styles.grow}>
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
            ))
          : visible.map((room, index) => (
              <Pressable
                key={room.id}
                accessibilityRole="button"
                onPress={() => router.push(ROUTES.parent.chat(room.id) as never)}
                style={({ pressed }) => [
                  styles.row,
                  index < visible.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
                  pressed && { backgroundColor: ds.c.subtle },
                ]}
              >
                <ConversationRowBody conversation={room} />
              </Pressable>
            ))}
        {!rooms.isLoading && !visible.length ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
              <Icon name="chat" size={28} color={ds.c.brand} />
            </View>
            <DsText v="title" style={styles.center}>
              {query ? t("chats.noResults") : t("chats.emptyTitle")}
            </DsText>
            {query ? null : (
              <>
                <DsText v="body-sm" c="ink-secondary" style={styles.center}>
                  {t("chats.emptyHint")}
                </DsText>
                <MobileButton icon="add" label={t("chats.newTitle")} onPress={() => setNewOpen(true)} style={styles.emptyButton} />
              </>
            )}
          </View>
        ) : null}
      </View>

      <ParentNewChatDialog open={newOpen} onOpenChange={setNewOpen} />
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { flex: 1, minWidth: 0, fontFamily: headingFont("600"), fontSize: 26, lineHeight: 36 },
  add: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.9 },
  /* `rounded-xl bg-surface` */
  list: { overflow: "hidden", borderRadius: dsRadius.xl },
  /* `gap-3 border-b px-5 py-3` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  skeleton: { height: 72, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20 },
  grow: { flex: 1, gap: 8 },
  round: { borderRadius: 24 },
  empty: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingVertical: 40 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center" },
  emptyButton: { marginTop: 4, alignSelf: "center" },
});
