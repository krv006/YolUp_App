import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { DsText, dsRadius, Icon, MobileButton, MobileFieldLabel, MobileInput, Sheet, toast, useDs, type DsColor } from "@/shared/ui";
import type { SupportTicket, SupportTicketStatus } from "../api/support.dto";
import { useCloseSupportTicket, useCreateSupportTicket, useReplySupportTicket, useSupportTicket, useSupportTickets } from "../model/support.queries";

const STATUS_TONE: Record<SupportTicketStatus, { bg: DsColor; fg: DsColor }> = {
  open: { bg: "warning-bg", fg: "warning-fg" },
  answered: { bg: "success-bg", fg: "success-fg" },
  closed: { bg: "subtle", fg: "ink-secondary" },
};

function stamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId?: string | null;
}

type Screen = { kind: "list" } | { kind: "new" } | { kind: "thread"; id: string };

/**
 * Qo'llab-quvvatlash murojaatlari — veb `support-dialog.tsx` (`AppDialog
 * variant="panel"`) ning pastki oyna varianti: ro'yxat, yangi murojaat va
 * yozishma. Vebdan farqi — tugmalar oynaning aylanmaydigan pastki qatorida.
 */
export function SupportDialog({ open, onOpenChange, ticketId = null }: SupportDialogProps) {
  const { t } = useTranslation("account");
  const [screen, setScreen] = useState<Screen>(ticketId ? { kind: "thread", id: ticketId } : { kind: "list" });
  const [syncedOpen, setSyncedOpen] = useState(open);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const create = useCreateSupportTicket();
  const threadId = screen.kind === "thread" ? screen.id : "";
  const ticket = useSupportTicket(threadId || null);
  const send = useReplySupportTicket(threadId);
  const close = useCloseSupportTicket(threadId);
  if (syncedOpen !== open) {
    setSyncedOpen(open);
    if (open) {
      setScreen(ticketId ? { kind: "thread", id: ticketId } : { kind: "list" });
      setSubject("");
      setMessage("");
      setReply("");
    }
  }

  const title = screen.kind === "new" ? t("support.newTitle") : screen.kind === "thread" ? t("support.threadTitle") : t("support.title");
  const canCreate = Boolean(subject.trim() && message.trim());
  const threadOpen = screen.kind === "thread" && ticket.data && ticket.data.status !== "closed";

  function submitTicket() {
    if (!canCreate) return;
    create.mutate(
      { subject: subject.trim(), message: message.trim() },
      {
        onSuccess: (created) => {
          toast.success(t("support.sent"));
          setSubject("");
          setMessage("");
          setScreen({ kind: "thread", id: created.id });
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  function submitReply() {
    if (!reply.trim()) return;
    send.mutate(reply.trim(), { onSuccess: () => setReply(""), onError: (error: Error) => toast.error(error.message) });
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => onOpenChange(false)}
      title={title}
      description={screen.kind === "list" ? t("support.subtitle") : undefined}
      footer={
        screen.kind === "new" ? (
          <>
            <MobileButton variant="secondary" label={t("support.back")} onPress={() => setScreen({ kind: "list" })} />
            <MobileButton label={t("support.send")} disabled={!canCreate || create.isPending} onPress={submitTicket} />
          </>
        ) : threadOpen ? (
          <>
            <MobileButton
              variant="secondary"
              label={t("support.close")}
              disabled={close.isPending}
              onPress={() => close.mutate(undefined, { onError: (error: Error) => toast.error(error.message) })}
            />
            <MobileButton label={t("support.send")} disabled={!reply.trim() || send.isPending} onPress={submitReply} />
          </>
        ) : undefined
      }
    >
      {screen.kind === "list" ? (
        <TicketList onNew={() => setScreen({ kind: "new" })} onOpen={(id) => setScreen({ kind: "thread", id })} />
      ) : screen.kind === "new" ? (
        <View style={styles.form}>
          <MobileFieldLabel gap={8} label={t("support.subject")}>
            <MobileInput value={subject} maxLength={200} autoFocus placeholder={t("support.subjectPlaceholder")} onChangeText={setSubject} />
          </MobileFieldLabel>
          <MobileFieldLabel gap={8} label={t("support.message")}>
            <MobileInput multiline multilineHeight={128} value={message} maxLength={5000} placeholder={t("support.messagePlaceholder")} onChangeText={setMessage} />
          </MobileFieldLabel>
        </View>
      ) : (
        <SupportThread ticket={ticket.data} loading={ticket.isLoading} reply={reply} onReplyChange={setReply} onBack={() => setScreen({ kind: "list" })} />
      )}
    </Sheet>
  );
}

function StatusChip({ status }: { status: SupportTicketStatus }) {
  const { t } = useTranslation("account");
  const ds = useDs();
  const tone = STATUS_TONE[status];
  // `rounded-full px-2.5 py-1 text-caption-strong`
  return (
    <View style={[styles.chip, { backgroundColor: ds.c[tone.bg] }]}>
      <DsText v="caption-strong" c={tone.fg}>
        {t(`support.status.${status}`)}
      </DsText>
    </View>
  );
}

function TicketList({ onNew, onOpen }: { onNew: () => void; onOpen: (id: string) => void }) {
  const { t } = useTranslation("account");
  const ds = useDs();
  const tickets = useSupportTickets();
  const items = tickets.data ?? [];

  return (
    <View style={styles.list}>
      <MobileButton icon="add" label={t("support.new")} onPress={onNew} />
      {tickets.isLoading ? (
        Array.from({ length: 3 }, (_, index) => <View key={index} style={[styles.skeletonRow, { backgroundColor: ds.c.skeleton }]} />)
      ) : items.length ? (
        items.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} onOpen={() => onOpen(ticket.id)} />)
      ) : (
        <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
          {t("support.empty")}
        </DsText>
      )}
    </View>
  );
}

function TicketRow({ ticket, onOpen }: { ticket: SupportTicket; onOpen: () => void }) {
  const ds = useDs();
  return (
    // `flex items-center gap-3 rounded-xl border border-line px-4 py-3`
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [styles.row, { borderColor: ds.c.line, backgroundColor: pressed ? ds.c.subtle : "transparent" }]}
    >
      <View style={styles.grow}>
        <DsText v="label-strong" numberOfLines={1}>
          {ticket.subject}
        </DsText>
        <DsText v="caption" c="ink-tertiary" numberOfLines={1}>
          {[ticket.lastMessage, stamp(ticket.updatedAt)].filter(Boolean).join(" · ")}
        </DsText>
      </View>
      <StatusChip status={ticket.status} />
    </Pressable>
  );
}

/** Yozishma — veb `SupportThread` (mobilda xodim ko'rinishi yo'q; javob maydoni shu yerda, tugmalar oyna pastida). */
function SupportThread({
  ticket,
  loading,
  reply,
  onReplyChange,
  onBack,
}: {
  ticket: SupportTicket | undefined;
  loading: boolean;
  reply: string;
  onReplyChange: (value: string) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation("account");
  const ds = useDs();

  if (loading || !ticket)
    return (
      <View style={styles.list}>
        <View style={[styles.skeletonTitle, { backgroundColor: ds.c.skeleton }]} />
        <View style={[styles.skeletonBubble, { backgroundColor: ds.c.skeleton }]} />
        <View style={[styles.skeletonBubble, styles.skeletonOwn, { backgroundColor: ds.c.skeleton }]} />
      </View>
    );

  return (
    <View style={styles.form}>
      <View style={styles.head}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("support.back")}
          onPress={onBack}
          style={({ pressed }) => [styles.back, { backgroundColor: pressed ? ds.c.tint : ds.c.subtle }]}
        >
          <Icon name="arrow-back" size={18} color={ds.c.ink} />
        </Pressable>
        <View style={styles.grow}>
          <DsText v="title">{ticket.subject}</DsText>
          <DsText v="caption" c="ink-tertiary">
            {stamp(ticket.createdAt)}
          </DsText>
        </View>
        <StatusChip status={ticket.status} />
      </View>

      <View style={styles.messages}>
        {ticket.messages.map((item) => {
          const own = !item.fromStaff;
          return (
            // `max-w-[85%] rounded-2xl px-4 py-2.5`
            <View
              key={item.id}
              style={[styles.bubble, own ? styles.own : styles.other, { backgroundColor: own ? ds.c["brand-subtle"] : ds.c.subtle }]}
            >
              <DsText v="caption-strong" c="ink-secondary">
                {own ? t("support.you") : t("support.staff")} · {stamp(item.createdAt)}
              </DsText>
              <DsText v="body-sm">{item.body}</DsText>
            </View>
          );
        })}
      </View>

      {ticket.status === "closed" ? (
        <View style={[styles.closed, { backgroundColor: ds.c.subtle }]}>
          <DsText v="body-sm" c="ink-secondary" style={styles.center}>
            {t("support.closedNote")}
          </DsText>
        </View>
      ) : (
        <MobileInput multiline multilineHeight={96} value={reply} maxLength={5000} placeholder={t("support.replyPlaceholder")} onChangeText={onReplyChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  grow: { flex: 1, minWidth: 0 },
  list: { gap: 12 },
  form: { gap: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: dsRadius.xl },
  chip: { flexShrink: 0, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  empty: { paddingVertical: 32, textAlign: "center" },
  skeletonRow: { height: 64, borderRadius: dsRadius.xl },
  skeletonTitle: { width: 224, height: 24, borderRadius: dsRadius.full },
  skeletonBubble: { height: 72, borderRadius: dsRadius.xl },
  skeletonOwn: { width: "75%", alignSelf: "flex-end" },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  back: { width: 36, height: 36, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  messages: { gap: 10 },
  bubble: { maxWidth: "85%", gap: 4, paddingHorizontal: 16, paddingVertical: 10, borderRadius: dsRadius["2xl"] },
  own: { alignSelf: "flex-end" },
  other: { alignSelf: "flex-start" },
  closed: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
});
