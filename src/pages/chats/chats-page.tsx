import { Fragment, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoleRoutes } from "@/modules/auth";
import { useNewConversationStore } from "@/modules/conversation";
import {
  ConversationActionsSheet,
  type ConversationActionsFocus,
} from "@/modules/conversation/ui/conversation-actions-sheet";
import type { Conversation, ConversationRole } from "@/shared/types";
import {
  Avatar,
  DsGradient,
  DsText,
  dsRadius,
  Icon,
  MobileEmptyCard,
  MobileRoundButton,
  MobileSearchField,
  MobileSegment,
  MobileTitleHeader,
  PullRefresh,
  useDs,
} from "@/shared/ui";
import { ConversationRowBody } from "@/widgets/chat-shell/conversation-row";
import { CONVERSATION_FILTERS, useConversationList } from "@/widgets/chat-shell/use-conversation-list";

/** Uzoq bosish — vebdagi `LONG_PRESS_MS`. */
const LONG_PRESS_MS = 450;

/**
 * Suhbatlar ro'yxati (M6.1–6.9) — veb `widgets/chat-shell/mobile-conversation-list.tsx`:
 * holat sarlavhasi (o'qilmaganlar soni / "Hammasi o'qilgan" / aloqa uzildi),
 * "+" (yangi guruh), qidiruv, filtrlar, qidiruvda "Odamlar" bo'limi, bo'sh va
 * xato holatlari. Uzoq bosilganda qator joyida ko'tariladi va amallar
 * menyusi ochiladi.
 */
export function ChatsPage(_props: { role: ConversationRole }) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const routes = useRoleRoutes();
  const openNewConversation = useNewConversationStore((state) => state.setOpen);
  const { data, isLoading, isError, refetch, filter, setFilter, search, setSearch, query, visible, peopleRows, unreadTotal, unreadByFilter } =
    useConversationList();
  const [actionsFor, setActionsFor] = useState<Conversation | null>(null);
  const [focus, setFocus] = useState<ConversationActionsFocus | null>(null);
  const rows = useRef(new Map<string, View | null>());

  const fresh = !isLoading && !isError && data.length === 0;
  const subtitle = isError
    ? t("panel.connectionLost")
    : fresh
      ? t("panel.freshStart")
      : unreadTotal
        ? t("panel.unreadCount", { count: unreadTotal })
        : t("panel.allRead");

  function openActions(conversation: Conversation) {
    rows.current.get(conversation.id)?.measureInWindow((_x, y, width, height) => {
      setActionsFor(conversation);
      setFocus({
        rect: { top: y, left: 16, width: width, height },
        content: <ConversationRowBody conversation={conversation} />,
      });
    });
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 22 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<PullRefresh onRefresh={() => refetch()} />}
        accessibilityLabel={t("panel.listAria")}
      >
        <DsGradient name="auth" />
        <MobileTitleHeader
          eyebrow={subtitle}
          title={t("panel.title")}
          action={<MobileRoundButton icon="add" iconSize={24} label={t("panel.newGroup")} onPress={() => openNewConversation(true)} />}
        />

        {fresh ? (
          <View style={styles.firstBlock}>
            <MobileEmptyCard
              icon="chat"
              iconColor="ink"
              title={t("panel.noChatsTitle")}
              description={t("panel.noChatsTeacherHint")}
              action={{ label: t("panel.createGroup"), icon: "add", onPress: () => openNewConversation(true) }}
            />
          </View>
        ) : (
          <>
            <MobileSearchField
              style={styles.firstBlock}
              value={search}
              onChange={setSearch}
              placeholder={t("panel.searchPlaceholder")}
              ariaLabel={t("panel.searchAria")}
              clearLabel={t("panel.closeSearchAria")}
            />

            {query ? (
              <DsText style={styles.block}>{t("panel.resultCount", { count: visible.length + peopleRows.length })}</DsText>
            ) : (
              <View style={styles.block}>
                <MobileSegment
                  scroll
                  items={CONVERSATION_FILTERS.map((id) => ({ id, label: t(`panel.filters.${id}`), badge: unreadByFilter[id] }))}
                  value={filter}
                  onChange={setFilter}
                />
              </View>
            )}

            {isLoading ? (
              <View style={[styles.card, styles.block, { backgroundColor: ds.c.surface }]}>
                {Array.from({ length: 6 }, (_, index) => (
                  <View key={index} style={[styles.skeletonRow, index < 5 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
                    <View style={[styles.skeletonAvatar, { backgroundColor: ds.c.subtle }]} />
                    <View style={styles.skeletonLines}>
                      <View style={[styles.skeletonLine, { width: 128, backgroundColor: ds.c.subtle }]} />
                      <View style={[styles.skeletonLine, { width: 192, backgroundColor: ds.c.subtle }]} />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {isError ? (
              <View style={styles.block}>
                <MobileEmptyCard
                  icon="wifi"
                  title={t("panel.loadError")}
                  description={t("panel.loadErrorHint")}
                  action={{ label: t("panel.retry"), icon: "refresh", onPress: () => void refetch() }}
                />
              </View>
            ) : null}

            {!isLoading && !isError && !visible.length && !peopleRows.length ? (
              <View style={styles.block}>
                <MobileEmptyCard
                  icon="search"
                  title={t("panel.emptyTitle")}
                  description={t("panel.emptyHint")}
                  action={{
                    label: t("panel.clearFilters"),
                    onPress: () => {
                      setFilter("all");
                      setSearch("");
                    },
                  }}
                />
              </View>
            ) : null}

            {!isLoading && !isError && visible.length ? (
              <View style={[styles.card, styles.list, query ? styles.listAfterCount : styles.block, { backgroundColor: ds.c.surface }]}>
                {visible.map((conversation, index) => (
                  <Fragment key={conversation.id}>
                    {index > 0 ? <View style={[styles.divider, { backgroundColor: ds.c.line }]} /> : null}
                    <Pressable
                      ref={(node) => {
                        rows.current.set(conversation.id, node);
                      }}
                      accessibilityRole="button"
                      delayLongPress={LONG_PRESS_MS}
                      onLongPress={() => openActions(conversation)}
                      onPress={() => router.push(routes.chat(conversation.id) as never)}
                      style={({ pressed }) => [styles.row, pressed && { backgroundColor: ds.c.subtle }]}
                    >
                      <ConversationRowBody conversation={conversation} />
                    </Pressable>
                  </Fragment>
                ))}
              </View>
            ) : null}

            {query && peopleRows.length ? (
              <>
                <DsText style={styles.peopleTitle}>{t("panel.peopleSection")}</DsText>
                <View style={[styles.card, styles.people, { backgroundColor: ds.c.surface }]}>
                  {peopleRows.map((person, index) => (
                    <Pressable
                      key={person.id}
                      accessibilityRole="button"
                      onPress={() => {
                        if (person.roomId) {
                          router.push(routes.chat(person.roomId) as never);
                          setSearch("");
                        }
                      }}
                      style={({ pressed }) => [
                        styles.person,
                        index < peopleRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
                        pressed && { backgroundColor: ds.c.subtle },
                      ]}
                    >
                      <Avatar variant="legacy" name={person.name} src={person.avatar} size="sm" box={48} />
                      <View style={styles.grow}>
                        <DsText v="title" numberOfLines={1}>
                          {person.name}
                        </DsText>
                        <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                          @{person.username}
                        </DsText>
                      </View>
                      <Icon name="more" size={22} color={ds.c["ink-secondary"]} />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <ConversationActionsSheet
        conversation={actionsFor}
        focus={focus}
        onClose={() => {
          setActionsFor(null);
          setFocus(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  /* `px-4 pt-5.5 pb-32` — pastda suzuvchi panelga joy */
  page: { paddingHorizontal: 16, paddingBottom: 128 },
  /* `mt-5.5` */
  firstBlock: { marginTop: 22 },
  block: { marginTop: 20 },
  card: { overflow: "hidden", borderRadius: dsRadius.xl },
  /* `py-1` */
  list: { paddingVertical: 4 },
  listAfterCount: { marginTop: 10 },
  divider: { height: 1 },
  /* `px-4 py-3 gap-3` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  peopleTitle: { marginTop: 24 },
  people: { marginTop: 12 },
  /* `px-4 py-4 gap-3` */
  person: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  skeletonRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  skeletonAvatar: { width: 48, height: 48, borderRadius: dsRadius.xl },
  skeletonLines: { flex: 1, minWidth: 0, gap: 10 },
  skeletonLine: { height: 12, maxWidth: "100%", borderRadius: dsRadius.full },
});
