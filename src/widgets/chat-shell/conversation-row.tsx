import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useCurrentUser } from "@/modules/auth";
import { isDirectLocked, isOwnLastMessage, lastMessageBody, useDirectStatusLabel } from "@/modules/conversation";
import { formatMessageTime } from "@/shared/lib";
import type { Conversation } from "@/shared/types";
import { Avatar, DsText, dsRadius, GroupTile, Icon, useDs } from "@/shared/ui";

function preview(conversation: Conversation, mine: boolean, youLabel: string, body: string): string {
  if (!conversation.lastMessage) return "";
  const sender = conversation.lastSender;
  if (!sender) return body;
  return `${mine ? youLabel : sender}: ${body}`;
}

/** Bugun — soat, kecha — "Kecha", hafta ichida — kun nomi, undan oldin — `kk.oo`. */
function listTime(value: string, yesterday: string, weekdays: string[]): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((start.getTime() - date.getTime()) / 86_400_000) + 1;
  if (date.getTime() >= start.getTime()) return formatMessageTime(date);
  if (diffDays <= 1) return yesterday;
  if (diffDays < 7) return weekdays[date.getDay()] ?? "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Suhbat qatorining tarkibi — veb `widgets/chat-shell/conversation-row.tsx`:
 * guruh belgisi yoki avatar (onlayn nuqta bilan), nom, oxirgi xabar (o'zimniki
 * bo'lsa "Siz:" va ikki belgi; ovoz/rasm/video belgisi bilan), "yozmoqda"
 * yoki shaxsiy chat holati (kutilmoqda/bloklangan), vaqt, qadalgan belgi va o'qilmaganlar soni yoki
 * ovozsiz belgisi. Qator va uzoq bosishdagi "ko'tarilgan" nusxa shu
 * komponentdan.
 */
export function ConversationRowBody({ conversation }: { conversation: Conversation }) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const user = useCurrentUser();
  const weekdays = t("listTime.weekdays", { returnObjects: true }) as string[];
  const unread = conversation.unreadCount > 0;
  const directStatusLabel = useDirectStatusLabel();
  const mine = isOwnLastMessage(conversation, user);
  const body = lastMessageBody(conversation, {
    voice: t("panel.voiceMessage"),
    image: t("panel.imageMessage"),
    video: t("panel.videoMessage"),
  });

  return (
    <>
      {conversation.type === "group" ? (
        <GroupTile name={conversation.title} tone={conversation.avatarTone} src={conversation.imageUrl} box={48} radius={dsRadius.lg} />
      ) : (
        <Avatar
          variant="legacy"
          name={conversation.title}
          tone={conversation.avatarTone}
          src={conversation.imageUrl ?? undefined}
          size="lg"
          box={48}
          status={conversation.status === "online" ? "online" : undefined}
        />
      )}

      <View style={styles.body}>
        <DsText v="title" numberOfLines={1}>
          {conversation.title}
        </DsText>
        {conversation.typing ? (
          <DsText v="body-sm" c="brand" numberOfLines={1}>
            {conversation.typingKind === "voice"
              ? t("panel.recordingVoice", { name: conversation.typingName ?? "" })
              : t("panel.typing", { name: conversation.typingName ?? "" })}
          </DsText>
        ) : isDirectLocked(conversation) ? (
          <DsText v="body-sm" c={conversation.directStatus === "blocked" ? "error-text" : "saffron-strong"} numberOfLines={1}>
            {directStatusLabel(conversation.directStatus)}
          </DsText>
        ) : (
          <View style={styles.preview}>
            {mine ? <Icon name="done-all" size={16} color={ds.c.brand} /> : null}
            <DsText v="body-sm" c={unread ? "ink" : "ink-secondary"} numberOfLines={1} style={styles.previewText}>
              {preview(conversation, mine, t("panel.you"), body)}
            </DsText>
          </View>
        )}
      </View>

      <View style={styles.meta}>
        <View style={styles.time}>
          {conversation.isPinned ? <Icon name="pin" size={14} color={ds.c["icon-secondary"]} /> : null}
          <DsText v="caption" c={unread ? "brand" : "ink-secondary"}>
            {conversation.updatedAt ? listTime(conversation.updatedAt, t("listTime.yesterday"), weekdays) : ""}
          </DsText>
        </View>
        {unread ? (
          <View style={[styles.count, { backgroundColor: ds.c.brand }]}>
            <DsText v="caption-strong" c="ink-inverse">
              {conversation.unreadCount}
            </DsText>
          </View>
        ) : conversation.isMuted ? (
          <Icon name="notifications-off" size={16} color={ds.c["icon-tertiary"]} />
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  /* `flex-1 flex-col gap-0.5` */
  body: { flex: 1, minWidth: 0, gap: 2 },
  preview: { flexDirection: "row", alignItems: "center", gap: 4 },
  previewText: { flexShrink: 1 },
  /* `items-end gap-1` */
  meta: { alignItems: "flex-end", gap: 4 },
  time: { flexDirection: "row", alignItems: "center", gap: 4 },
  /* `h-5 min-w-5 rounded-full bg-brand px-1.5` */
  count: { height: 20, minWidth: 20, paddingHorizontal: 6, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
});
