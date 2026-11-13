import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { messageApi, messageKeys, upsertMessage } from "@/modules/message";
import { formatMessageTime } from "@/shared/lib";
import type { ChatMessage, ConversationRole } from "@/shared/types";
import { Avatar, bodyFont, DsText, dsRadius, dsType, Icon, RoleTag, toast, useDs } from "@/shared/ui";

const MAX_COMMENT = 2000;

export interface ChannelThreadProps {
  roomId: string;
  role: ConversationRole;
  post: ChatMessage | null;
  canComment: boolean;
  currentUserId: string | null;
  onClose: () => void;
}

/**
 * Kanal posti ostidagi izohlar — veb `channel-thread.tsx`. Tor ekranda
 * vebdagidek to'liq ekran (`fixed inset-0`): sarlavha, post, izohlar va
 * pastda izoh yozish maydoni.
 */
export function ChannelThread({ roomId, role, post, canComment, currentUserId, onClose }: ChannelThreadProps) {
  const ds = useDs();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={Boolean(post)} animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: ds.c.surface, paddingTop: insets.top }]}>
        {post ? (
          <ThreadBody key={post.id} roomId={roomId} role={role} post={post} canComment={canComment} currentUserId={currentUserId} onClose={onClose} />
        ) : null}
      </View>
    </Modal>
  );
}

function ThreadBody({ roomId, role, post, canComment, currentUserId, onClose }: Omit<ChannelThreadProps, "post"> & { post: ChatMessage }) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const [text, setText] = useState("");
  const threadKey = messageKeys.thread(roomId, post.id);
  const comments = useQuery({
    queryKey: threadKey,
    queryFn: ({ signal }) => messageApi.getThread(roomId, post.id, { signal }, currentUserId),
  });
  const send = useMutation({
    mutationFn: (body: string) => messageApi.sendComment(roomId, post.id, body, currentUserId),
    onSuccess: (comment) => {
      const next = upsertMessage(client.getQueryData<ChatMessage[]>(threadKey) ?? [], comment);
      client.setQueryData(threadKey, next);
      client.setQueryData<ChatMessage[]>(messageKeys.all(roomId, role), (current) =>
        current?.map((item) => (item.id === post.id ? { ...item, commentCount: next.length } : item))
      );
      setText("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function submit() {
    const body = text.trim();
    if (body && !send.isPending) send.mutate(body);
  }

  const items = comments.data ?? [];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* `h-16 gap-3 border-b border-line px-4` */}
      <View style={[styles.header, { borderBottomColor: ds.c.line }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("channel.closeThread")} onPress={onClose} style={styles.close}>
          <Icon name="close" size={20} color={ds.c.ink} />
        </Pressable>
        <DsText v="title" numberOfLines={1} style={styles.grow}>
          {t("channel.threadTitle", { count: items.length })}
        </DsText>
      </View>

      <ScrollView style={styles.grow} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.post, { backgroundColor: ds.c["brand-subtle"] }]}>
          <DsText v="caption-strong" c="brand">
            {post.senderName} · {formatMessageTime(post.createdAt)}
          </DsText>
          <DsText v="body" style={styles.postText}>
            {post.text || post.attachment?.name || "—"}
          </DsText>
        </View>

        {comments.isLoading ? (
          <DsText v="body-sm" c="ink-secondary">
            {t("channel.loading")}
          </DsText>
        ) : null}
        {!comments.isLoading && !items.length ? (
          <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
            {t("channel.noComments")}
          </DsText>
        ) : null}

        {items.map((comment) => (
          <View key={comment.id} style={styles.comment}>
            <Avatar variant="legacy" name={comment.senderName} src={comment.senderAvatarUrl ?? undefined} size="sm" box={32} />
            <View style={[styles.bubble, { backgroundColor: ds.c.subtle }]}>
              <View style={styles.meta}>
                <DsText v="caption-strong" numberOfLines={1} style={styles.shrink}>
                  {comment.senderId === currentUserId ? t("panel.you") : comment.senderName}
                </DsText>
                {comment.senderRole === "teacher" || comment.senderRole === "parent" ? <RoleTag role={comment.senderRole} /> : null}
                <DsText v="caption" c="ink-tertiary" style={styles.time}>
                  {formatMessageTime(comment.createdAt)}
                </DsText>
              </View>
              <DsText v="body-sm">{comment.text}</DsText>
            </View>
          </View>
        ))}
      </ScrollView>

      {canComment ? (
        <View style={[styles.form, { borderTopColor: ds.c.line, paddingBottom: Math.max(12, insets.bottom + 8) }]}>
          <TextInput
            multiline
            maxLength={MAX_COMMENT}
            value={text}
            placeholder={t("channel.commentPlaceholder")}
            placeholderTextColor={ds.c["ink-tertiary"]}
            onChangeText={setText}
            style={[styles.input, { fontSize: dsType.body.fontSize, fontFamily: bodyFont("400"), color: ds.c.ink, backgroundColor: ds.c.subtle, borderColor: ds.c.line }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("channel.sendComment")}
            disabled={!text.trim() || send.isPending}
            onPress={submit}
            style={[styles.send, { backgroundColor: ds.c.brand }, (!text.trim() || send.isPending) && styles.dim]}
          >
            <Icon name="send" size={20} color={ds.c["on-action"]} />
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  header: { height: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  /* `gap-3 px-4 py-4` */
  content: { gap: 12, padding: 16 },
  post: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
  postText: { marginTop: 4 },
  empty: { paddingVertical: 24, textAlign: "center" },
  comment: { flexDirection: "row", gap: 10 },
  /* `gap-0.5 rounded-xl bg-subtle px-3 py-2` */
  bubble: { flex: 1, minWidth: 0, gap: 2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: dsRadius.xl },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  time: { marginLeft: "auto" },
  /* `items-end gap-2 border-t px-4 py-3` */
  form: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  input: { flex: 1, minHeight: 44, maxHeight: 128, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, borderWidth: 1, borderRadius: 24 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.5 },
});
