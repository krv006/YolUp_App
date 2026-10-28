import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Play } from "lucide-react-native";
import { ROLES } from "@/shared/constants";
import { formatMessageTime } from "@/shared/lib";
import type { ChatMessage } from "@/shared/types";
import { Avatar, dsAlpha, DsText, dsRadius, Icon, useDs, type DsColor } from "@/shared/ui";
import { useChatUiStore } from "../model/chat-ui.store";
import { MessageAttachment } from "./message-attachment";
import { MessageText } from "./message-text";
import { VoiceMessage } from "./voice-message";

export interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string | null;
  /** Uzoq bosilganda — pufakning o'zi (`measureInWindow` uchun) bilan. */
  onOpenActions: (message: ChatMessage, bubble: View | null) => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (message: ChatMessage) => void;
  /** Qidiruvda joriy topilgan xabar — `ring-[1.5px] ring-saffron`. */
  highlighted?: boolean;
  /** Ketma-ket xabarlarda avatar faqat oxirgisida, ism faqat birinchisida. */
  showAvatar?: boolean;
  showName?: boolean;
}

const SENDER_COLORS: DsColor[] = ["action", "success-text", "saffron-strong", "link"];

function senderColor(id: string): DsColor {
  let total = 0;
  for (const char of id) total += char.charCodeAt(0);
  return SENDER_COLORS[total % SENDER_COLORS.length] ?? "action";
}

const RECORDING_PATH = /\/recordings\/([\w-]+)/;
const QUOTED_TITLE = /[“"']([^“”"']+)[”"']/;

/** Tizim xabari — kulrang pilyulka; dars yozuvi havolasi bo'lsa yozuv kartasi. */
function SystemMessage({ text }: { text: string }) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const router = useRouter();
  const lessonId = text.match(RECORDING_PATH)?.[1] ?? null;

  if (lessonId) {
    const title = text.match(QUOTED_TITLE)?.[1] ?? "";
    return (
      <View style={styles.recordingRow}>
        <View style={[styles.recording, { borderColor: ds.c.line, backgroundColor: ds.c.surface, boxShadow: ds.shadow.sm }]}>
          <View style={[styles.recordingIcon, { backgroundColor: ds.c["action-subtle"] }]}>
            <Play size={18} color={ds.c.action} />
          </View>
          <View style={styles.grow}>
            <DsText v="label-strong" numberOfLines={1}>
              {t("system.recordingTitle")}
            </DsText>
            <DsText v="caption" c="ink-tertiary" numberOfLines={1}>
              {title || t("system.recordingHint")}
            </DsText>
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/recordings/${lessonId}` as never)}
            style={({ pressed }) => [styles.recordingAction, { backgroundColor: pressed ? ds.c["action-hover"] : ds.c.action }]}
          >
            <DsText v="label-strong" c="on-action">
              {t("system.recordingAction")}
            </DsText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.systemRow}>
      <View style={[styles.system, { backgroundColor: ds.c.subtle }]}>
        <DsText v="caption" c="ink-tertiary" style={styles.center}>
          {text}
        </DsText>
      </View>
    </View>
  );
}

export interface MessageBubbleCardProps {
  message: ChatMessage;
  outgoing: boolean;
  showName?: boolean;
  highlighted?: boolean;
  onReact?: (message: ChatMessage, emoji: string) => void;
  /** Fokus menyusidagi nusxa — o'lcham o'lchangan pufakdan olinadi. */
  fill?: boolean;
}

/**
 * Pufakning o'zi (vebdagi `[data-bubble]`) — `w-66 max-w-[85%] rounded-lg
 * px-3.5 pt-2.5 pb-2 gap-1`, chiquvchida `bg-brand` va pastki o'ng burchak
 * 6px, kiruvchida `bg-surface` va pastki chap burchak 6px. Fokus menyusi
 * ko'targan nusxa ham shu komponent.
 */
export function MessageBubbleCard({ message, outgoing, showName = true, highlighted = false, onReact, fill = false }: MessageBubbleCardProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const searchTerm = useChatUiStore((state) => state.search);
  const isTeacherSender = message.senderRole === ROLES.TEACHER;
  const onAction = ds.c["on-action"];
  const meta = outgoing ? dsAlpha(onAction, 0.75) : ds.c["ink-tertiary"];

  return (
    <View
      style={[
        styles.bubble,
        fill ? styles.fill : null,
        outgoing
          ? { backgroundColor: ds.c.brand, borderBottomRightRadius: 6 }
          : { backgroundColor: ds.c.surface, borderBottomLeftRadius: 6 },
        highlighted ? { borderWidth: 1.5, borderColor: ds.c.saffron, margin: -1.5 } : null,
      ]}
    >
      {message.senderName && !outgoing && showName ? (
        <View style={styles.sender}>
          {isTeacherSender ? <Icon name="school" size={13} color={ds.c[senderColor(message.senderId || message.senderName)]} /> : null}
          <DsText v="caption-strong" c={senderColor(message.senderId || message.senderName)} numberOfLines={1}>
            {message.senderName}
          </DsText>
        </View>
      ) : null}

      {message.replyTo ? (
        <View
          style={[
            styles.reply,
            outgoing
              ? { borderLeftColor: dsAlpha("#ffffff", 0.6), backgroundColor: dsAlpha("#ffffff", 0.15) }
              : { borderLeftColor: ds.c.action, backgroundColor: ds.c["action-subtle"] },
          ]}
        >
          <DsText v="caption-strong" numberOfLines={1} style={{ color: outgoing ? onAction : ds.c["ink-secondary"] }}>
            {message.replyTo.author}
          </DsText>
          <DsText v="caption" numberOfLines={2} style={{ color: outgoing ? onAction : ds.c["ink-secondary"] }}>
            {message.replyTo.text}
          </DsText>
        </View>
      ) : null}

      {message.text ? <MessageText text={message.text} outgoing={outgoing} highlight={highlighted ? searchTerm : undefined} /> : null}

      {message.attachment ? (
        message.attachment.kind === "voice" || message.attachment.mimeType?.startsWith("audio/") ? (
          <VoiceMessage attachment={message.attachment} outgoing={outgoing} />
        ) : (
          <MessageAttachment attachment={message.attachment} failed={message.failed} uploading={message.pending} />
        )
      ) : null}

      <View style={styles.meta}>
        {message.editedAt ? (
          <DsText v="caption" style={{ color: meta }}>
            {t("bubble.edited")}
          </DsText>
        ) : null}
        <DsText v="caption" numeric style={{ color: meta }}>
          {formatMessageTime(message.createdAt)}
        </DsText>
        {outgoing && message.failed ? (
          <Icon name="warning-fill" size={14} color={ds.c["accent-red-bg"]} />
        ) : outgoing && message.pending ? (
          <Icon name="schedule" size={14} color={meta} />
        ) : outgoing ? (
          <View style={{ opacity: message.status === "read" ? 1 : 0.6 }}>
            <Icon name="done-all" size={15} color={meta} />
          </View>
        ) : null}
      </View>

      {message.reactions?.length ? (
        <View style={styles.reactions} accessibilityLabel={t("bubble.reactionsAria")}>
          {message.reactions.map((reaction) => (
            <Pressable
              key={reaction.emoji}
              accessibilityRole="button"
              disabled={!onReact}
              onPress={() => onReact?.(message, reaction.emoji)}
              style={({ pressed }) => [
                styles.reaction,
                reaction.reacted
                  ? { borderColor: ds.c.action, backgroundColor: ds.c["action-subtle"] }
                  : { borderColor: ds.c.line, backgroundColor: ds.c.surface },
                pressed && { transform: [{ scale: 0.9 }] },
              ]}
            >
              <DsText v="caption">{reaction.emoji}</DsText>
              <DsText v="caption" numeric c={reaction.reacted ? "action" : "ink-secondary"}>
                {reaction.count}
              </DsText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Xabar qatori — veb `message-bubble.tsx` ning tor ekran varianti: kiruvchi
 * xabarda chapda 28px avatar (guruhning oxirgi xabarida), uzoq bosishda
 * (450ms) amallar menyusi, tanlash rejimida bosish tanlaydi va tanlangan
 * qator `rounded-xl bg-brand-subtle px-2 py-2` bo'ladi.
 *
 * Vebdagi "sudrab javob berish" mobilda yo'q: gorizontal sudrash orqaga
 * qaytish imo-ishorasi bilan to'qnashadi — javob amallar menyusidan.
 */
export function MessageBubble({
  message,
  currentUserId = null,
  onOpenActions,
  onReact,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  highlighted = false,
  showAvatar = true,
  showName = true,
}: MessageBubbleProps) {
  const ds = useDs();
  const bubbleRef = useRef<View>(null);
  const outgoing = message.senderId === currentUserId;

  if (message.type === "system") return <SystemMessage text={message.text} />;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={selectionMode ? { selected } : undefined}
      delayLongPress={450}
      onLongPress={selectionMode ? undefined : () => onOpenActions(message, bubbleRef.current)}
      onPress={selectionMode ? () => onToggleSelect?.(message) : undefined}
      style={[
        styles.row,
        outgoing ? styles.rowOutgoing : null,
        selected ? [styles.selected, { backgroundColor: ds.c["brand-subtle"] }] : null,
      ]}
    >
      {outgoing ? null : (
        <View style={styles.avatarSlot}>{showAvatar ? <Avatar variant="legacy" name={message.senderName} size="sm" box={28} /> : null}</View>
      )}
      <View ref={bubbleRef} collapsable={false} style={styles.bubbleBox}>
        <MessageBubbleCard message={message} outgoing={outgoing} showName={showName} highlighted={highlighted} onReact={onReact} fill />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  /* `flex items-end gap-2` */
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  rowOutgoing: { flexDirection: "row-reverse" },
  selected: { borderRadius: dsRadius.xl, paddingHorizontal: 8, paddingVertical: 8 },
  /* `mb-1 w-7` */
  avatarSlot: { width: 28, marginBottom: 4 },
  /* pufak o'lchami: `w-66 max-w-[85%]` (qator kengligidan) */
  bubbleBox: { width: 264, maxWidth: "85%" },
  bubble: { width: 264, maxWidth: "85%", gap: 4, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, borderRadius: dsRadius.lg },
  fill: { width: "100%", maxWidth: "100%" },
  sender: { flexDirection: "row", alignItems: "center", gap: 4 },
  /* `gap-0.5 rounded-lg border-l-2 py-1 pl-2.5` */
  reply: { gap: 2, paddingVertical: 4, paddingLeft: 10, paddingRight: 8, borderLeftWidth: 2, borderRadius: dsRadius.lg },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 },
  reactions: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  reaction: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderRadius: dsRadius.full },
  systemRow: { alignItems: "center", paddingVertical: 4 },
  system: { maxWidth: "100%", paddingHorizontal: 12, paddingVertical: 4, borderRadius: dsRadius.full },
  recordingRow: { alignItems: "flex-end", paddingVertical: 4 },
  /* `w-full items-center gap-3 rounded-2xl border bg-surface p-3 shadow-sm` */
  recording: { width: "100%", flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderWidth: 1, borderRadius: dsRadius["2xl"] },
  recordingIcon: { width: 40, height: 40, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  recordingAction: { height: 36, paddingHorizontal: 16, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
