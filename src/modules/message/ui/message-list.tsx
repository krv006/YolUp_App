import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { HomeworkMessageCard } from "@/modules/homework";
import type { ChatMessage, Conversation, MessageCapabilities } from "@/shared/types";
import { ConfirmDialog, DsText, dsRadius, Icon, MessageTextScale, toast, useDs } from "@/shared/ui";
import { messageApi } from "../api/message.api";
import { buildMessageRows, type MessageRow } from "../lib/message-day";
import { useChatUiStore } from "../model/chat-ui.store";
import { messageKeys } from "../model/message.keys";
import { MessageActionsMenu, type MessageMenuAnchor } from "./message-actions-menu";
import { MessageBubble } from "./message-bubble";

export interface MessageListProps {
  messages?: ChatMessage[];
  conversation: Conversation;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage, scope: "me" | "everyone") => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  onRetryMessage?: (message: ChatMessage) => void;
  currentUserId?: string | null;
  capabilities?: MessageCapabilities;
  pinnedIds?: string[];
  onPin?: (message: ChatMessage, pinned: boolean) => void;
  onForward?: (messages: ChatMessage[]) => void;
  onBulkDelete?: (messageIds: string[], scope: "me" | "everyone") => void;
  onOpenAssignment?: (assignmentId: string) => void;
  assignmentSubmitted?: (assignmentId: string) => boolean | null;
}

/**
 * Xabarlar ro'yxati — veb `message-list.tsx` ning tor ekran varianti:
 * bo'sh holat kartasi, e'lon rejimi belgisi, kun ajratgichlari, vazifa
 * kartalari, "yuborilmadi" izohi, "yozmoqda" ko'rsatkichi, pastga tushish
 * tugmasi (o'qilmaganlar soni bilan), uzoq bosishdagi amallar menyusi va
 * tanlash rejimining pastki paneli.
 *
 * Qidiruvda (vebning tor ekranidagi kabi) barcha xabarlar qoladi — joriy
 * topilgani ajratiladi va ekran o'rtasiga suriladi.
 */
export function MessageList({
  messages,
  conversation,
  loading,
  error,
  onRetry,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRetryMessage,
  currentUserId = null,
  capabilities,
  pinnedIds = [],
  onPin,
  onForward,
  onBulkDelete,
  onOpenAssignment,
  assignmentSubmitted,
}: MessageListProps) {
  const { t } = useTranslation("chat");
  const { t: tn } = useTranslation("notification");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlashListRef<MessageRow>>(null);

  const search = useChatUiStore((state) => state.search).trim();
  const searchIndex = useChatUiStore((state) => state.searchIndex);
  const setSearchCount = useChatUiStore((state) => state.setSearchCount);
  const selected = useChatUiStore((state) => state.selected);
  const toggleSelected = useChatUiStore((state) => state.toggleSelected);
  const clearSelection = useChatUiStore((state) => state.clearSelection);
  const selectionMode = selected.length > 0;
  const announcement = Boolean(conversation.announcementOnly);

  const serverSearch = useQuery({
    queryKey: messageKeys.search(conversation.id, search.toLowerCase()),
    queryFn: ({ signal }) => messageApi.search(conversation.id, search, { signal }),
    enabled: search.length > 0,
  });
  const matches = useMemo(() => {
    if (!search) return [];
    const matched = new Set((serverSearch.data?.items ?? []).map((item) => item.id));
    const needle = search.toLowerCase();
    return (messages ?? []).filter((message) => matched.has(message.id) || message.text.toLowerCase().includes(needle));
  }, [messages, search, serverSearch.data]);
  const serverTotal = serverSearch.data?.total ?? 0;
  const activeMatchId = search ? (matches[searchIndex]?.id ?? null) : null;

  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<MessageMenuAnchor | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const atBottomRef = useRef(true);
  const seenCountRef = useRef(0);
  const [unread, setUnread] = useState(conversation.unreadCount ?? 0);
  const [dividerId, setDividerId] = useState<string | null>(conversation.firstUnreadMessageId ?? null);

  const rows = useMemo(
    () => buildMessageRows(messages ?? [], { days: !announcement, dividerId }),
    [messages, announcement, dividerId]
  );
  const months = tl("list.months", { returnObjects: true }) as string[];

  useEffect(() => {
    if (search) setSearchCount(Math.max(matches.length, serverTotal));
  }, [search, matches.length, serverTotal, setSearchCount]);

  useEffect(() => {
    if (!activeMatchId) return;
    const index = rows.findIndex((row) => row.key === activeMatchId);
    if (index >= 0) void listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true });
  }, [activeMatchId, rows]);

  useEffect(() => clearSelection, [clearSelection, conversation.id]);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
    setUnread(0);
  }, []);

  // Pastda bo'lmaganda kelgan xabarlar sanaladi va "yangi xabarlar" chizig'i qo'yiladi.
  useEffect(() => {
    const total = messages?.length ?? 0;
    const added = total - seenCountRef.current;
    const firstLoad = seenCountRef.current === 0;
    seenCountRef.current = total;
    if (added <= 0 || firstLoad || atBottomRef.current) return;
    setUnread((count) => count + added);
    setDividerId((current) => current ?? messages?.[total - added]?.id ?? null);
  }, [messages]);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const bottom = contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    if (bottom) setUnread(0);
  }

  function dayLabel(value: string): string {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return t("list.today");
    if (date.toDateString() === yesterday.toDateString()) return tn("groups.yesterday");
    const label = `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;
    return date.getFullYear() === today.getFullYear() ? label : `${label} ${date.getFullYear()}`;
  }

  function openActions(message: ChatMessage, bubble: View | null) {
    const outgoing = message.senderId === currentUserId;
    if (!bubble) {
      setMenuAnchor(null);
      setActionMessage(message);
      return;
    }
    bubble.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ top: y, left: x, width, height, outgoing });
      setActionMessage(message);
    });
  }

  function copySelection() {
    const text = (messages ?? [])
      .filter((message) => selected.includes(message.id))
      .map((message) => message.text)
      .filter(Boolean)
      .join("\n");
    if (text) void Clipboard.setStringAsync(text);
    toast.success(t("actionsMenu.copied"));
    clearSelection();
  }

  function forwardSelection() {
    const picked = (messages ?? []).filter((message) => selected.includes(message.id));
    if (onForward) onForward(picked);
    else toast.info(t("actions.notAvailable"));
  }

  if (loading) {
    return (
      <View style={styles.skeleton}>
        {Array.from({ length: 5 }, (_, index) => (
          <View key={index} style={[styles.skeletonBubble, { backgroundColor: ds.c.muted }, index % 2 ? styles.alignEnd : null]} />
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.error}>
        <DsText v="h3" heading style={styles.center}>
          {t("list.loadError")}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" style={[styles.center, styles.errorHint]}>
          {t("list.loadErrorHint")}
        </DsText>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, { backgroundColor: pressed ? ds.c.subtle : ds.c.muted }]}
        >
          <DsText v="label-strong">{t("list.retry")}</DsText>
        </Pressable>
      </View>
    );
  }

  const empty = !search && !rows.length && !conversation.typing;

  function renderRow({ item }: { item: MessageRow }) {
    if (item.kind === "day") {
      return (
        <View style={styles.separatorRow}>
          <View style={[styles.separator, { backgroundColor: ds.c.surface }]}>
            <DsText v="caption" c="ink-secondary">
              {dayLabel(item.date)}
            </DsText>
          </View>
        </View>
      );
    }
    if (item.kind === "unread") {
      return (
        <View style={styles.separatorRow}>
          <View style={[styles.separator, { backgroundColor: ds.c.surface }]}>
            <DsText v="caption" c="ink-secondary">
              {t("actionsMenu.newMessages", { count: unread })}
            </DsText>
          </View>
        </View>
      );
    }
    if (item.kind === "assignment" && item.message.assignment) {
      const assignment = item.message.assignment;
      return (
        <HomeworkMessageCard
          assignment={assignment}
          canReview={item.message.senderId === currentUserId}
          submitted={assignmentSubmitted?.(assignment.id) ?? null}
          onOpen={onOpenAssignment ? () => onOpenAssignment(assignment.id) : undefined}
        />
      );
    }
    if (item.kind !== "message") return null;
    const message = item.message;
    return (
      <View>
        <MessageBubble
          message={message}
          currentUserId={currentUserId}
          showName={item.showName}
          showAvatar={item.showAvatar}
          selectionMode={selectionMode}
          selected={selected.includes(message.id)}
          onToggleSelect={(target) => toggleSelected(target.id)}
          onReact={onReact}
          onOpenActions={openActions}
          highlighted={message.id === activeMatchId}
        />
        {message.failed ? (
          <View style={styles.failed}>
            <Icon name="refresh" size={15} color={ds.c["error-text"]} />
            <DsText v="caption" c="error-text">
              {t("offline.failed")} ·{" "}
              <DsText v="caption" c="error-text" onPress={() => onRetryMessage?.(message)}>
                {t("offline.resend")}
              </DsText>
            </DsText>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {empty ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.empty, { backgroundColor: ds.c.surface }]}>
            <View style={[styles.emptyIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
              <Icon name="forum" size={32} color={ds.c.brand} />
            </View>
            <DsText v="title" heading w="700" style={[styles.center, styles.emptyTitle]}>
              {conversation.kind === "course" ? t("list.emptyGroupTitle") : t("list.emptyTitle")}
            </DsText>
            <DsText v="body-sm" c="ink-secondary" style={[styles.center, styles.emptyHint]}>
              {conversation.kind === "course" ? t("list.emptyGroupHint") : t("list.emptyHint")}
            </DsText>
          </View>
        </View>
      ) : (
        <MessageTextScale>
          <FlashList
            ref={listRef}
            data={rows}
            keyExtractor={(row) => row.key}
            getItemType={(row) => row.kind}
            extraData={{ selected, activeMatchId, selectionMode, unread }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
            onScroll={handleScroll}
            scrollEventThrottle={64}
            maintainVisibleContentPosition={{ startRenderingFromBottom: true, autoscrollToBottomThreshold: 0.2 }}
            ItemSeparatorComponent={RowGap}
            ListHeaderComponent={
              announcement && !search ? (
                <View style={styles.chipRow}>
                  <View style={[styles.chip, { backgroundColor: ds.c.subtle }]}>
                    <Icon name="person" size={14} color={ds.c["ink-secondary"]} />
                    <DsText v="caption" c="ink-secondary">
                      {t("list.announcementChip")}
                    </DsText>
                  </View>
                </View>
              ) : null
            }
            ListFooterComponent={!search && conversation.typing ? <TypingIndicator name={conversation.typingName || conversation.title} /> : null}
            renderItem={renderRow}
          />
        </MessageTextScale>
      )}

      {atBottom || empty ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("actionsMenu.scrollDown")}
          onPress={scrollToBottom}
          style={({ pressed }) => [
            styles.down,
            { borderColor: ds.c.line, backgroundColor: pressed ? ds.c.subtle : ds.c.surface, boxShadow: ds.shadow.lg },
          ]}
        >
          <Icon name="chevron-down" size={20} color={ds.c.ink} />
          {unread > 0 ? (
            <View style={[styles.downBadge, { backgroundColor: ds.c.action }]}>
              <DsText v="caption-strong" c="on-action" numeric>
                {unread}
              </DsText>
            </View>
          ) : null}
        </Pressable>
      )}

      {selectionMode ? (
        <View style={[styles.selectionBar, { backgroundColor: ds.c.surface, paddingBottom: Math.max(36, insets.bottom + 12) }]}>
          <Pressable
            accessibilityRole="button"
            onPress={forwardSelection}
            style={({ pressed }) => [styles.selectionAction, { backgroundColor: ds.c["brand-subtle"], opacity: pressed ? 0.85 : 1 }]}
          >
            <Icon name="send" size={18} color={ds.c.brand} />
            <DsText v="button" c="brand" numberOfLines={1}>
              {t("actionsMenu.forward")}
            </DsText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={copySelection}
            style={({ pressed }) => [
              styles.selectionAction,
              { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
            ]}
          >
            <Icon name="assign" size={18} color={ds.c.ink} />
            <DsText v="button" numberOfLines={1}>
              {t("actionsMenu.copy")}
            </DsText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDeleteOpen(true)}
            style={({ pressed }) => [styles.selectionAction, { backgroundColor: ds.c["danger-bg"], opacity: pressed ? 0.85 : 1 }]}
          >
            <Icon name="logout" size={18} color={ds.c["error-text"]} />
            <DsText v="button" c="error-text" numberOfLines={1}>
              {t("actionsMenu.delete")}
            </DsText>
          </Pressable>
        </View>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        icon="trash"
        title={t("actionsMenu.deleteTitle", { count: selected.length })}
        description={t("actionsMenu.deleteDescription")}
        confirmLabel={t("actionsMenu.delete")}
        cancelLabel={t("actionsMenu.cancel")}
        onConfirm={() => {
          if (onBulkDelete) onBulkDelete(selected, "everyone");
          else (messages ?? []).filter((message) => selected.includes(message.id)).forEach((message) => onDelete(message, "everyone"));
          setDeleteOpen(false);
          clearSelection();
        }}
      />

      <MessageActionsMenu
        message={actionMessage}
        anchor={menuAnchor}
        onClose={() => setActionMessage(null)}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onReact={onReact}
        onPin={onPin}
        pinnedIds={pinnedIds}
        onForward={onForward ? (message) => onForward([message]) : undefined}
        capabilities={capabilities}
      />
    </View>
  );
}

/** `gap-[11px]` — FlashList'da `gap` yo'q. */
function RowGap() {
  return <View style={styles.gap} />;
}

/** "Yozmoqda" — `rounded-full bg-surface px-3 py-2 shadow-xs` ichida sakraydigan uch nuqta. */
function TypingIndicator({ name }: { name: string }) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  return (
    <View style={styles.typing} accessibilityLabel={`${name} ${t("typing.suffix")}`}>
      <View style={[styles.typingDots, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.xs }]}>
        {[0, 1, 2].map((dot) => (
          <TypingDot key={dot} delay={dot * 120} color={ds.c["ink-tertiary"]} />
        ))}
      </View>
      <DsText v="caption" c="ink-tertiary">
        {name.split(" ")[0]} {t("typing.suffix")}
      </DsText>
    </View>
  );
}

function TypingDot({ delay, color }: { delay: number; color: string }) {
  const offset = useSharedValue(0);
  useEffect(() => {
    offset.set(withDelay(delay, withRepeat(withSequence(withTiming(-4, { duration: 300 }), withTiming(0, { duration: 300 })), -1)));
  }, [delay, offset]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { textAlign: "center" },
  alignEnd: { alignSelf: "flex-end" },
  /* `px-4 pt-4 pb-2` */
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  gap: { height: 11 },
  skeleton: { flex: 1, gap: 12, paddingHorizontal: 16, paddingVertical: 20, overflow: "hidden" },
  skeletonBubble: { height: 64, width: "60%", maxWidth: 420, borderRadius: dsRadius["2xl"] },
  error: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24 },
  errorHint: { maxWidth: 320 },
  retry: { marginTop: 12, height: 48, paddingHorizontal: 20, justifyContent: "center", borderRadius: 24 },
  emptyWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 16, paddingBottom: 82 },
  /* `rounded-2xl bg-surface px-6 pt-7 pb-[26px]` */
  empty: { alignItems: "center", paddingHorizontal: 24, paddingTop: 28, paddingBottom: 26, borderRadius: dsRadius["2xl"] },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 12, letterSpacing: -0.2 },
  emptyHint: { marginTop: 12, maxWidth: 260 },
  separatorRow: { alignItems: "center" },
  /* `h-6 rounded-full bg-surface px-3 text-caption` */
  separator: { height: 24, justifyContent: "center", paddingHorizontal: 12, borderRadius: 12 },
  chipRow: { alignItems: "center", paddingVertical: 4, marginBottom: 11 },
  chip: { height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: 12 },
  failed: { marginTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 },
  typing: { marginTop: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  typingDots: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: dsRadius.full },
  dot: { width: 6, height: 6, borderRadius: 3 },
  /* `absolute right-4 bottom-4 size-11 rounded-full border bg-surface shadow-lg` */
  down: { position: "absolute", right: 16, bottom: 16, width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  downBadge: { position: "absolute", top: -4, right: -4, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  /* `gap-2 bg-surface px-4 pt-3 pb-9` */
  selectionBar: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  selectionAction: { flex: 1, minWidth: 0, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 22 },
});
