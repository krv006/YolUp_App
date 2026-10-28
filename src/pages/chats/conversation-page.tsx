import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
/*
 * RN ning o'z `KeyboardAvoidingView` i emas: Androidda u oynaning
 * kichrayishiga tayanadi, `edgeToEdgeEnabled=true` bo'lganda esa Android 15+
 * oynani kichraytirmaydi va kompozitor klaviatura ostida qolardi.
 */
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/modules/auth";
import { useCourse } from "@/modules/course";
import { ChatHeader } from "@/modules/conversation/ui/chat-header";
import { ConversationInfoSheet } from "@/modules/conversation/ui/conversation-info-sheet";
import { LiveLessonBar, useLiveLessons } from "@/modules/lesson";
import { PinnedMessageBar, useChat, useChatUiStore } from "@/modules/message";
import { MessageComposer } from "@/modules/message/ui/message-composer";
import { MessageList } from "@/modules/message/ui/message-list";
import { useActiveVoiceRoom, useVoiceUiStore, VoiceRoomBar } from "@/modules/voice";
import type { ChatMessage, ConversationRole, SendMessagePayload } from "@/shared/types";
import { DsGradient, DsText, dsRadius, Icon, Screen, ScreenError, ScreenLoading, toast, useDs } from "@/shared/ui";
import { ForwardDialog } from "@/widgets/forward-dialog";
import { GroupTabsRow, GroupWorkspaceSection, type GroupTab } from "@/widgets/group-workspace/group-workspace";

/**
 * Suhbat oynasi — veb `pages/teacher/conversation-page.tsx` (shaxsiy suhbat)
 * va `widgets/group-workspace` (guruh chati) ning tor ekran varianti.
 *
 * Guruhda: `bg-auth-gradient` fon, sarlavha, ovozli xona chizig'i, 44px
 * tablar, e'lon rejimi banneri yoki qadalgan xabar, xabarlar va kompozer.
 * Tanlash rejimida kompozer o'rnini pastki amallar paneli egallaydi.
 * Ma'lumot oqimi `useChat` da (WebSocket, optimistik yuborish, zaxira polling).
 */
export function ConversationPage({ role }: { role: ConversationRole }) {
  const { t } = useTranslation("chat");
  const { t: tm } = useTranslation("mobile");
  const { t: tg } = useTranslation("group");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  /* `tab` — boshqa ekrandan aniq bo'limni ochish (masalan jadvaldan davomatga). */
  const { conversationId, tab: initialTab } = useLocalSearchParams<{ conversationId: string; tab?: GroupTab }>();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const selectionMode = useChatUiStore((state) => state.selected.length > 0);

  const [reply, setReply] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [forwardTarget, setForwardTarget] = useState<ChatMessage[]>([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [tab, setTab] = useState<GroupTab>(
    initialTab === "lessons" || initialTab === "assignments" || initialTab === "attendance" ? initialTab : "chat"
  );

  const chat = useChat(conversationId, { role, senderId: currentUserId });
  const raw = chat.conversation.data;

  /* Guruh ma'lumoti kursdan to'ldiriladi — veb `group-workspace.tsx` dagi `hydrated`. */
  const course = useCourse(raw?.courseId ?? null);
  const conversation = useMemo(() => {
    if (!raw) return undefined;
    if (raw.type !== "group" || !course.data) return raw;
    return {
      ...raw,
      title: course.data.title || raw.title,
      subject: course.data.subject ?? raw.subject,
      subjectLabel: course.data.subjectLabel ?? raw.subjectLabel,
      description: course.data.description ?? raw.description,
      memberCount: course.data.studentCount ?? 0,
    };
  }, [raw, course.data]);

  const courseId = conversation?.courseId ?? null;
  const voice = useActiveVoiceRoom(courseId);
  const openVoiceCreate = useVoiceUiStore((state) => state.setCreateOpen);

  /* O'quvchida dars ketayotgan bo'lsa qo'shilish chizig'i (o'quvchi ekranlari 6-bosqichda). */
  const liveLessons = useLiveLessons(role === "student" && Boolean(user)).data;
  const liveLesson = useMemo(
    () => (courseId ? (liveLessons ?? []).find((lesson) => lesson.courseId === courseId) : undefined),
    [courseId, liveLessons]
  );

  const lastMessageId = chat.messages.data?.[chat.messages.data.length - 1]?.id ?? null;
  const readRef = useRef<string | null>(null);
  const markRead = chat.markRead;
  useEffect(() => {
    if (!lastMessageId || lastMessageId.startsWith("temp-") || readRef.current === lastMessageId) return;
    readRef.current = lastMessageId;
    markRead.mutate(lastMessageId);
  }, [lastMessageId, markRead]);

  const backPath = role === "teacher" ? "/teacher/chats" : "/student/chats";
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(backPath);
  }

  if (chat.conversation.isLoading && !conversation) {
    return (
      <Screen>
        <ScreenLoading label={tm("chats.suhbat_ochilmoqda")} />
      </Screen>
    );
  }

  if (!conversation) {
    return (
      <Screen>
        <ScreenError message={tm("chats.suhbat_topilmadi")} onRetry={() => void chat.conversation.refetch()} />
      </Screen>
    );
  }

  const group = conversation.type === "group" && Boolean(courseId);

  /* Shaxsiy suhbat `pending` — o'quvchi hali qabul qilinmagan, `blocked` — rad etilgan. */
  const disabledReason =
    conversation.directStatus === "pending"
      ? "So'rovingiz yuborildi. O'qituvchi qabul qilgach yozishingiz mumkin."
      : conversation.directStatus === "blocked"
        ? "Bu suhbat yopilgan."
        : undefined;

  async function send(payload: SendMessagePayload) {
    if (!conversation) return;
    try {
      if (editing) {
        await chat.updateMessage.mutateAsync({ messageId: editing.id, text: payload.text });
        setEditing(null);
        if (!group) toast.success(t("directPage.messageEdited"));
        return;
      }
      await chat.sendMessage.mutateAsync({
        ...payload,
        replyToId: reply?.id ?? null,
        replyTo: reply
          ? {
              author: group
                ? reply.senderName || tg("replyFallback")
                : reply.senderName || (reply.senderId === currentUserId ? t("composer.youLabel") : conversation.title),
              text: reply.text,
            }
          : undefined,
      });
      setReply(null);
    } catch {
      toast.error(group ? tg("sendFailed") : t("directPage.actionFailedRetry"));
    }
  }

  function deleteOne(message: ChatMessage, scope: "me" | "everyone") {
    chat.deleteMessage.mutate(
      { messageId: message.id, scope },
      {
        onSuccess: () => {
          if (reply?.id === message.id) setReply(null);
          if (editing?.id === message.id) setEditing(null);
          if (!group) toast.success(scope === "everyone" ? t("directPage.deletedForEveryone") : t("directPage.deletedForMe"));
        },
        onError: () => {
          if (!group) toast.error(t("directPage.deleteFailed"));
        },
      }
    );
  }

  const chatTab = !group || tab === "chat";

  return (
    <View style={[styles.root, { backgroundColor: ds.c.canvas }]}>
      {group ? <DsGradient name="auth" /> : null}
      <ChatHeader
        conversation={conversation}
        topInset={insets.top}
        onBack={goBack}
        onOpenInfo={() => setInfoOpen(true)}
        onVoice={group && tab === "chat" && !voice.active ? () => openVoiceCreate(true) : undefined}
        workspace={group}
        onUnpin={(messageId) => chat.pinMessage.mutate({ messageId, pinned: true })}
      />

      {role === "student" && liveLesson ? (
        <LiveLessonBar lesson={liveLesson} onJoin={() => router.push(`/live/${liveLesson.id}` as never)} />
      ) : null}

      {group ? <VoiceRoomBar courseId={courseId} hideIdle /> : null}
      {group ? <GroupTabsRow active={tab} onChange={setTab} isTeacher={role === "teacher"} compact={selectionMode} /> : null}

      {group && tab === "chat" && !selectionMode ? (
        conversation.announcementOnly ? (
          <View style={[styles.banner, { backgroundColor: ds.c["brand-subtle"] }]}>
            <Icon name="bolt" size={18} color={ds.c.brand} />
            <DsText v="body-sm" c="brand" numberOfLines={1} style={styles.grow}>
              {tg("announcementBanner")}
            </DsText>
          </View>
        ) : (
          <PinnedMessageBar
            roomId={conversation.id}
            variant="workspace"
            onUnpin={(messageId) => chat.pinMessage.mutate({ messageId, pinned: true })}
          />
        )
      ) : null}

      {chatTab ? (
        <KeyboardAvoidingView style={styles.body} behavior="padding">
          <MessageList
            messages={chat.messages.data}
            conversation={conversation}
            loading={chat.messages.isLoading}
            error={chat.messages.isError}
            onRetry={() => void chat.messages.refetch()}
            onRetryMessage={chat.retryMessage}
            currentUserId={currentUserId}
            onReply={(message) => {
              setEditing(null);
              setReply(message);
            }}
            onEdit={(message) => {
              setReply(null);
              setEditing(message);
            }}
            onDelete={deleteOne}
            onReact={(message, emoji) => chat.toggleReaction.mutate({ messageId: message.id, emoji })}
            pinnedIds={(chat.pinnedMessages.data ?? []).map((item) => item.messageId)}
            onPin={(message, pinned) => chat.pinMessage.mutate({ messageId: message.id, pinned })}
            onForward={setForwardTarget}
            onBulkDelete={(messageIds, scope) => chat.deleteMessages.mutate({ messageIds, scope })}
          />
          {selectionMode ? null : (
            <MessageComposer
              key={editing?.id ?? "compose"}
              onSend={send}
              onTyping={chat.sendTyping}
              sending={chat.sendMessage.isPending || chat.updateMessage.isPending}
              replyTo={reply}
              editingMessage={editing}
              onCancelContext={() => {
                setReply(null);
                setEditing(null);
              }}
              currentUserId={currentUserId}
              roomId={conversation.id}
              onAssignment={group && role === "teacher" ? () => setTab("assignments") : undefined}
              disabledReason={disabledReason}
            />
          )}
        </KeyboardAvoidingView>
      ) : courseId ? (
        <GroupWorkspaceSection tab={tab} courseId={courseId} isTeacher={role === "teacher"} />
      ) : null}

      <ForwardDialog
        open={forwardTarget.length > 0}
        onOpenChange={(open) => !open && setForwardTarget([])}
        messages={forwardTarget}
        role={role}
        pending={chat.forwardMessages.isPending}
        onConfirm={(roomIds) =>
          chat.forwardMessages.mutate(
            { messageIds: forwardTarget.map((item) => item.id), roomIds },
            {
              onSuccess: () => {
                setForwardTarget([]);
                toast.success(t("forward.done"));
              },
            }
          )
        }
      />

      <ConversationInfoSheet conversation={conversation} open={infoOpen} onClose={() => setInfoOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  /* `mx-4 mt-3 h-11 rounded-xl bg-brand-subtle px-4 gap-2.5` */
  banner: { marginHorizontal: 16, marginTop: 12, height: 44, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, borderRadius: dsRadius.xl },
});
