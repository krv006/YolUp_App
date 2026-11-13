import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChannelAvatar } from "@/modules/conversation";
import { MessageComposer, MessageList, type ChatController } from "@/modules/message";
import type { ChatMessage, Conversation, ConversationRole, SendMessagePayload } from "@/shared/types";
import { DsGradient, DsText, dsRadius, MobileRoundButton, toast, useDs } from "@/shared/ui";
import { ChannelInfoDialog } from "./channel-info-dialog";
import { ChannelThread } from "./channel-thread";

export interface ChannelViewProps {
  chat: ChatController;
  conversation: Conversation;
  role: ConversationRole;
  backTo: string;
  currentUserId: string | null;
}

/**
 * Kanal — veb `channel-view.tsx` (tor ekran): sarlavha (rasm, nom, a'zolar
 * soni, ma'lumot), postlar ro'yxati, har post ostida "N izoh" tugmasi va
 * izohlar to'liq ekranda. Faqat egasi (`canWrite`) post yozadi, qolganlarga
 * "faqat o'qish" yozuvi.
 */
export function ChannelView({ chat, conversation, role, backTo, currentUserId }: ChannelViewProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { messages, sendMessage, retryMessage, updateMessage, deleteMessage, toggleReaction, sendTyping } = chat;
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [threadPostId, setThreadPostId] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const owner = Boolean(conversation.canWrite);
  const canComment = conversation.canComment ?? true;
  const threadPost = (messages.data ?? []).find((item) => item.id === threadPostId) ?? null;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(backTo as never);
  }

  async function handleSend(payload: SendMessagePayload) {
    try {
      if (editing) {
        await updateMessage.mutateAsync({ messageId: editing.id, text: payload.text });
        setEditing(null);
        return;
      }
      await sendMessage.mutateAsync(payload);
    } catch {
      toast.error(t("directPage.actionFailed"));
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: ds.c.canvas }]}>
      <DsGradient name="auth" />
      {/* `h-[73px] gap-3 px-4` */}
      <View style={[styles.header, { marginTop: insets.top }]}>
        <MobileRoundButton icon="chevron-left" label={t("header.backAria")} background="surface" onPress={goBack} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("header.openInfoAria", { title: conversation.title })}
          onPress={() => setInfoOpen(true)}
          style={styles.title}
        >
          <ChannelAvatar src={conversation.imageUrl} size={44} radius={dsRadius.xl} iconSize={22} />
          <View style={styles.grow}>
            <DsText v="title" numberOfLines={1}>
              {conversation.title}
            </DsText>
            <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
              {t("channel.subtitle", { count: conversation.memberCount })}
            </DsText>
          </View>
        </Pressable>
        <MobileRoundButton icon="info" iconSize={20} label={t("channel.infoTitle")} background="surface" onPress={() => setInfoOpen(true)} />
      </View>

      <KeyboardAvoidingView style={styles.body} behavior="padding">
        <MessageList
          messages={messages.data}
          conversation={conversation}
          loading={messages.isLoading}
          error={messages.isError}
          onRetry={() => void messages.refetch()}
          onRetryMessage={retryMessage}
          currentUserId={currentUserId}
          onReply={(message) => setThreadPostId(message.id)}
          onEdit={(message) => setEditing(message)}
          onDelete={(message, scope) => deleteMessage.mutate({ messageId: message.id, scope })}
          onReact={(message, emoji) => toggleReaction.mutate({ messageId: message.id, emoji })}
          onOpenThread={(message) => setThreadPostId(message.id)}
        />

        {owner ? (
          <MessageComposer
            key={editing?.id ?? "channel-compose"}
            onSend={handleSend}
            onTyping={sendTyping}
            sending={sendMessage.isPending || updateMessage.isPending}
            editingMessage={editing}
            currentUserId={currentUserId}
            onCancelContext={() => setEditing(null)}
            roomId={conversation.id}
          />
        ) : (
          /* `border-t border-line bg-surface px-6 py-4 text-center` */
          <View style={[styles.readOnly, { backgroundColor: ds.c.surface, borderTopColor: ds.c.line, paddingBottom: Math.max(16, insets.bottom + 8) }]}>
            <DsText v="body-sm" c="ink-secondary" style={styles.center}>
              {t("channel.readOnly")}
            </DsText>
          </View>
        )}
      </KeyboardAvoidingView>

      <ChannelThread
        roomId={conversation.id}
        role={role}
        post={threadPost}
        canComment={canComment}
        currentUserId={currentUserId}
        onClose={() => setThreadPostId(null)}
      />

      <ChannelInfoDialog
        conversation={conversation}
        open={infoOpen}
        onOpenChange={setInfoOpen}
        manage={owner}
        currentUserId={currentUserId}
        afterDelete={backTo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  header: { height: 73, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  title: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  readOnly: { paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1 },
  center: { textAlign: "center" },
});
