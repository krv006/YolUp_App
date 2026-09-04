import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/modules/auth";
import { ChatHeader } from "@/modules/conversation/ui/chat-header";
import { ConversationInfoSheet } from "@/modules/conversation/ui/conversation-info-sheet";
import { useLiveLessons } from "@/modules/lesson";
import { useChat } from "@/modules/message";
import { MessageActionsSheet } from "@/modules/message/ui/message-actions-sheet";
import { MessageComposer } from "@/modules/message/ui/message-composer";
import { MessageList } from "@/modules/message/ui/message-list";
import {
  GroupTabsRow,
  GroupWorkspaceSection,
  type GroupTab,
} from "@/widgets/group-workspace/group-workspace";
import type { ChatMessage, ConversationRole } from "@/shared/types";
import { Screen, ScreenError, ScreenLoading, useTheme } from "@/shared/ui";

/**
 * Suhbat oynasi — veb `pages/teacher/conversation-page.tsx` va
 * `pages/student/conversation-page.tsx` ning mobil varianti.
 *
 * Butun ma'lumot oqimi `useChat` dan keladi — u veb'dan ko'chirilgan va
 * WebSocket, optimistik yuborish, REST zaxira polling'ining hammasini o'zi
 * boshqaradi. Bu yerda faqat ko'rinish.
 */
export function ConversationPage({ role }: { role: ConversationRole }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useAuth();

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [tab, setTab] = useState<GroupTab>("chat");
  const [infoOpen, setInfoOpen] = useState(false);

  const chat = useChat(conversationId, { role, senderId: user?.id ?? null });
  const conversation = chat.conversation.data;

  /** Shu kursda dars ketyaptimi — sarlavhadagi tugma shunga qarab chiqadi. */
  const liveLessons = useLiveLessons(Boolean(user)).data;
  // `courseId` alohida o'zgaruvchiga olinadi: memo ichida `conversation` ga
  // murojaat qilinsa React Compiler butun obyektni bog'liqlik deb hisoblaydi
  // va memoizatsiyani saqlab qololmaydi.
  const courseId = conversation?.courseId ?? null;
  const liveLesson = useMemo(
    () =>
      courseId ? (liveLessons ?? []).find((lesson) => lesson.courseId === courseId) : undefined,
    [courseId, liveLessons]
  );

  const backPath = role === "teacher" ? "/teacher/chats" : "/student/chats";

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(backPath);
  }

  if (chat.conversation.isLoading && !conversation) {
    return (
      <Screen>
        <ScreenLoading label="Suhbat ochilmoqda…" />
      </Screen>
    );
  }

  if (!conversation) {
    return (
      <Screen>
        <ScreenError
          message="Suhbat topilmadi"
          onRetry={() => void chat.conversation.refetch()}
        />
      </Screen>
    );
  }

  /**
   * Direct suhbat `pending` bo'lsa o'quvchi hali qabul qilinmagan, `blocked`
   * bo'lsa rad etilgan — ikkalasida ham yozish yopiladi. Backend baribir
   * rad etardi; sabab ko'rsatib, kompozitorni yopish halolroq.
   */
  const directStatus = conversation.directStatus;
  const composerDisabled = directStatus === "pending" || directStatus === "blocked";
  const disabledReason =
    directStatus === "pending"
      ? "So'rovingiz yuborildi. O'qituvchi qabul qilgach yozishingiz mumkin."
      : directStatus === "blocked"
        ? "Bu suhbat yopilgan."
        : undefined;

  return (
    <View style={[styles.root, { backgroundColor: palette["chat-bg"], paddingTop: insets.top }]}>
      <ChatHeader
        conversation={conversation}
        onBack={goBack}
        onOpenInfo={() => setInfoOpen(true)}
        socketOffline={chat.socketState !== "connected"}
        onJoinLive={liveLesson ? () => router.push(`/live/${liveLesson.id}`) : undefined}
      />

      {/* Bo'limlar faqat GURUH chatida: shaxsiy suhbatda kurs, dars va
          vazifa tushunchasi yo'q. */}
      {courseId ? (
        <GroupTabsRow active={tab} onChange={setTab} isTeacher={role === "teacher"} />
      ) : null}

      {courseId && tab !== "chat" ? (
        <GroupWorkspaceSection
          tab={tab}
          courseId={courseId}
          isTeacher={role === "teacher"}
          subject={conversation.subject ?? ""}
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.body}
          // iOS klaviaturani kontent USTIGA chiqaradi; Android oynani o'zi
          // kichraytiradi, shuning uchun u yerda hech narsa qilmaymiz.
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <MessageList
            messages={chat.messages.data}
            loading={chat.messages.isLoading}
            error={chat.messages.isError}
            onRetry={() => void chat.messages.refetch()}
            onLongPress={setActionMessage}
            onRetryMessage={chat.retryMessage}
            currentUserId={user?.id ?? null}
            typingName={conversation.typingName ?? null}
          />

          <MessageComposer
            onSend={(payload) => chat.sendMessage.mutate(payload)}
            onTyping={chat.sendTyping}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            disabled={composerDisabled}
            disabledReason={disabledReason}
          />
        </KeyboardAvoidingView>
      )}

      <MessageActionsSheet
        message={actionMessage}
        onClose={() => setActionMessage(null)}
        onReply={setReplyTo}
      />

      <ConversationInfoSheet
        conversation={conversation}
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
});
