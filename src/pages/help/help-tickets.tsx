import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import {
  filterTickets,
  groupTickets,
  markTicketSeen,
  staffName,
  ticketLabel,
  ticketTopic,
  ticketUnread,
  TICKET_FILE_TYPES,
  useCloseSupportTicket,
  useHelpConfig,
  useRateSupportTicket,
  useReplySupportTicket,
  useSupportTicket,
  useSupportTickets,
  type SupportAttachment,
  type SupportTicket,
  type TicketFilter,
} from "@/modules/support";
import { apiClient } from "@/shared/api";
import { bodyFont } from "@/shared/ui/fonts";
import { downloadBlob, pickDocuments, toUploadFile } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import { ConfirmDialog, DsText, dsAlpha, dsRadius, dsType, Icon, MobileButton, MobileInput, MobileRoundButton, Sheet, toast, useDs } from "@/shared/ui";
import { useHelpActions } from "./help-actions";
import { MobileHelpScreen } from "./help-screen";
import { EmptyBlock, HelpRow, HelpRows, RowsSkeleton, StatusChip, ToneTile } from "./help-ui";
import { useHelpDate, useHelpPaths, useReplyMinutes } from "./use-help";

/*
 * Mening murojaatlarim va murojaat suhbati — veb `pages/help/help-tickets.tsx`
 * ning mobil varianti: filtrlar, haftalik/oylik guruhlash, yangi javob
 * belgisi, suhbat, "Muammo hal bo'ldimi?", yopish va xizmatga baho,
 * yuborilmagan xabarni qayta yuborish.
 */

const FILTERS: TicketFilter[] = ["all", "open", "answered", "closed"];
const RATING_TAGS = ["fast", "clear", "polite", "solved"] as const;

function clock(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function useDates() {
  const { t } = useTranslation("help");
  const helpDate = useHelpDate();
  return useMemo(() => {
    const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    const short = (value: string) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      const now = new Date();
      if (sameDay(date, now)) return clock(value);
      if (sameDay(date, new Date(now.getTime() - 86_400_000))) return `${t("tickets.yesterday")}, ${clock(value)}`;
      return helpDate(value);
    };
    const day = (value: string) => {
      const date = new Date(value);
      const now = new Date();
      if (sameDay(date, now)) return t("tickets.today");
      if (sameDay(date, new Date(now.getTime() - 86_400_000))) return t("tickets.yesterday");
      return helpDate(value);
    };
    const month = (date: Date) => helpDate(date.toISOString(), "month");
    return { short, day, month };
  }, [helpDate, t]);
}

function TicketRows({ tickets, onOpen }: { tickets: SupportTicket[]; onOpen: (id: string) => void }) {
  const { t } = useTranslation("help");
  const ds = useDs();
  const dates = useDates();
  const groups = groupTickets(tickets, new Date(), dates.month, t("tickets.thisWeek"));
  return (
    <View style={styles.groups}>
      {groups.map((group) => (
        <View key={group.label} style={styles.group}>
          <DsText v="caption-strong" c="ink-tertiary" style={styles.groupLabel}>
            {group.label}
          </DsText>
          {/* `overflow-hidden rounded-xl bg-surface`, qatorlar `border-b` */}
          <View style={[styles.groupCard, { backgroundColor: ds.c.surface }]}>
            {group.items.map((ticket, index) => {
              const topic = ticketTopic(ticket.category);
              const unread = ticketUnread(ticket);
              const meta = [ticketLabel(ticket), dates.short(ticket.updatedAt)].filter(Boolean).join(" · ");
              return (
                <Pressable
                  key={ticket.id}
                  accessibilityRole="button"
                  onPress={() => onOpen(ticket.id)}
                  style={({ pressed }) => [
                    styles.ticketRow,
                    index < group.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
                    pressed && { backgroundColor: ds.c.subtle },
                  ]}
                >
                  <ToneTile icon={topic?.icon ?? "forum"} tone={topic?.tone ?? "bg-brand-subtle text-brand"} />
                  <View style={styles.ticketText}>
                    <View style={styles.inline}>
                      <DsText v="title-sm" w="600" numberOfLines={1} style={styles.grow}>
                        {ticket.subject}
                      </DsText>
                      {unread ? <View style={[styles.dot, { backgroundColor: ds.c.brand }]} /> : null}
                    </View>
                    <View style={[styles.inline, styles.wrap]}>
                      <StatusChip status={ticket.status} />
                      {meta ? (
                        <DsText v="caption" c="ink-secondary">
                          {meta}
                        </DsText>
                      ) : null}
                    </View>
                  </View>
                  <Icon name="chevron-right" size={18} color={ds.c["icon-secondary"]} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

/** `rounded-full bg-surface p-1 gap-1`, tab `h-10 flex-1 rounded-full`. */
function FilterTabs({ value, onChange }: { value: TicketFilter; onChange: (value: TicketFilter) => void }) {
  const { t } = useTranslation("help");
  const ds = useDs();
  return (
    <View accessibilityRole="tablist" style={[styles.filters, { backgroundColor: ds.c.surface }]}>
      {FILTERS.map((filter) => {
        const on = value === filter;
        return (
          <Pressable
            key={filter}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(filter)}
            style={({ pressed }) => [styles.filter, { backgroundColor: on ? ds.c.brand : pressed ? ds.c.subtle : "transparent" }]}
          >
            <DsText v="body-sm" w="500" c={on ? "on-action" : "ink"} numberOfLines={1}>
              {t(`tickets.filters.${filter}`)}
            </DsText>
          </Pressable>
        );
      })}
    </View>
  );
}

function ListEmpty({ filter }: { filter: TicketFilter }) {
  const { t } = useTranslation("help");
  const minutes = useReplyMinutes();
  const { openNewTicket } = useHelpActions();
  if (filter === "all")
    return (
      <EmptyBlock
        icon="forum"
        title={t("tickets.emptyTitle")}
        text={t("tickets.emptyText", { minutes })}
        action={{ label: t("home.send"), icon: "add", onPress: () => openNewTicket() }}
      />
    );
  const key = filter === "open" ? "Open" : filter === "answered" ? "Answered" : "Closed";
  return <EmptyBlock plain icon={filter === "open" ? "check-circle" : "forum"} title={t(`tickets.empty${key}Title`)} text={t(`tickets.empty${key}Text`)} />;
}

/** 🟡 Vebda blob yangi oynada; mobilda keshga yoziladi va tizim oynasida ochiladi/saqlanadi. */
async function openAttachment(file: SupportAttachment): Promise<void> {
  const blob = await apiClient.get<Blob>(file.url, { responseType: "blob" });
  if (!(await downloadBlob(blob, file.name || undefined))) throw new Error("download");
}

function RatingSheet({ ticket, open, onClose }: { ticket: SupportTicket; open: boolean; onClose: () => void }) {
  const { t } = useTranslation("help");
  const ds = useDs();
  const rate = useRateSupportTicket(ticket.id);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const labels = t("rating.labels", { returnObjects: true }) as string[];
  const name = staffName(ticket);

  function submit() {
    rate.mutate(
      { stars, tags, comment: comment.trim() },
      {
        onSuccess: () => {
          toast.success(t("rating.sent"));
          onClose();
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={onClose}
      title={t("rating.title")}
      description={name ? t("rating.subtitle", { name }) : t("rating.subtitleNoName")}
      footer={<MobileButton label={t("rating.submit")} disabled={!stars || rate.isPending} onPress={submit} />}
    >
      <View style={styles.rating}>
        <View style={styles.stars} accessibilityRole="radiogroup" accessibilityLabel={t("rating.title")}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: stars === value }}
              accessibilityLabel={t("rating.star", { count: value })}
              onPress={() => setStars(value)}
              hitSlop={4}
            >
              <Icon name={value <= stars ? "star" : "star-outline"} size={32} color={value <= stars ? ds.c.warning : ds.c["line-strong"]} />
            </Pressable>
          ))}
        </View>
        {stars ? (
          <DsText v="title" w="600">
            {labels[stars - 1]}
          </DsText>
        ) : null}
        <View style={styles.tags}>
          {RATING_TAGS.map((tag) => {
            const on = tags.includes(tag);
            return (
              <Pressable
                key={tag}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setTags((current) => (on ? current.filter((item) => item !== tag) : [...current, tag]))}
                style={[styles.tag, { borderColor: on ? ds.c.brand : ds.c.line, backgroundColor: on ? ds.c.brand : ds.c.surface }]}
              >
                <DsText v="body-sm" c={on ? "on-action" : "ink"}>
                  {t(`rating.tags.${tag}`)}
                </DsText>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.field}>
          <DsText v="body-sm" w="500">
            {t("rating.comment")}
          </DsText>
          <MobileInput multiline value={comment} maxLength={500} onChangeText={setComment} placeholder={t("rating.commentPlaceholder")} />
        </View>
      </View>
    </Sheet>
  );
}

interface PendingMessage {
  id: string;
  body: string;
  failed: boolean;
}

export function HelpTicketThread({ ticketId }: { ticketId: string }) {
  const { t } = useTranslation("help");
  const ds = useDs();
  const router = useRouter();
  const paths = useHelpPaths();
  const online = useOnlineStatus();
  const dates = useDates();
  const config = useHelpConfig();
  const ticket = useSupportTicket(ticketId);
  const reply = useReplySupportTicket(ticketId);
  const close = useCloseSupportTicket(ticketId);
  const { openNewTicket } = useHelpActions();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [rating, setRating] = useState(false);
  const scroller = useRef<ScrollView>(null);
  const input = useRef<TextInput>(null);
  const sequence = useRef(0);
  const data = ticket.data;
  const count = (data?.messages.length ?? 0) + pending.length;

  useEffect(() => {
    if (data) markTicketSeen(data);
  }, [data]);

  useEffect(() => {
    const timer = setTimeout(() => scroller.current?.scrollToEnd({ animated: false }), 50);
    return () => clearTimeout(timer);
  }, [count, ticketId]);

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace(paths.tickets as never);
  }

  if (ticket.isLoading || !data)
    return (
      <MobileHelpScreen title={t("tickets.title")} onBack={back}>
        {ticket.isLoading ? <RowsSkeleton rows={3} /> : <EmptyBlock plain icon="forum" title={ticket.isError ? t("tickets.loadError") : t("tickets.notFound")} />}
      </MobileHelpScreen>
    );

  const topic = ticketTopic(data.category);
  const closed = data.status === "closed";
  const askSolved = data.status === "answered" && data.messages.at(-1)?.fromStaff;
  const firstStaff = data.messages.findIndex((message) => message.fromStaff);
  const label = ticketLabel(data);
  const attachEnabled = Boolean(config.data?.attachmentsMaxMb);

  function send(body: string, retryId?: string) {
    if (!body.trim() && !files.length) return;
    sequence.current += 1;
    const id = retryId ?? `local-${sequence.current}`;
    setPending((current) => [...current.filter((item) => item.id !== id), { id, body, failed: false }]);
    const sending = files;
    setText("");
    setFiles([]);
    reply.mutate(
      { message: body, files: sending },
      {
        onSuccess: () => setPending((current) => current.filter((item) => item.id !== id)),
        onError: () => setPending((current) => current.map((item) => (item.id === id ? { ...item, failed: true } : item))),
      }
    );
  }

  function closeTicket() {
    close.mutate(undefined, {
      onSuccess: (next) => {
        setConfirm(false);
        if (next.rateable) setRating(true);
        else toast.success(t("tickets.closedToast"));
      },
      onError: (error) => toast.error(error.message),
    });
  }

  async function attach() {
    const picked = await pickDocuments(TICKET_FILE_TYPES);
    if (picked.length) setFiles((current) => [...current, ...picked.map(toUploadFile)]);
  }

  const pill = (icon: "check-circle" | "lock" | "verified", value: string, surface = true) => (
    <View style={[styles.event, surface && { backgroundColor: ds.c.surface }]}>
      <Icon name={icon} size={14} color={ds.c["ink-secondary"]} />
      <DsText v="caption" c="ink-secondary">
        {value}
      </DsText>
    </View>
  );

  const composer = closed ? (
    // `flex-col gap-3 border-t border-line px-5 py-4`
    <View style={[styles.closedBar, { borderTopColor: ds.c.line }]}>
      <DsText v="body-sm" c="ink-secondary" style={styles.center}>
        {t("tickets.closedNote")}
      </DsText>
      <Pressable
        accessibilityRole="button"
        onPress={() => openNewTicket(data.category ? { category: data.category } : undefined)}
        style={({ pressed }) => [styles.outline, { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : "transparent" }]}
      >
        <Icon name="add" size={18} color={ds.c.ink} />
        <DsText v="body-sm" w="600">
          {t("tickets.new")}
        </DsText>
      </Pressable>
    </View>
  ) : (
    // `flex-col gap-2 border-t border-line px-4 py-3`
    <View style={[styles.composer, { borderTopColor: ds.c.line }]}>
      {!online ? (
        <View style={styles.inline}>
          <Icon name="wifi" size={14} color={ds.c["warning-text"]} />
          <DsText v="caption" c="warning-text">
            {t("tickets.offlineNote")}
          </DsText>
        </View>
      ) : null}
      {files.length ? (
        <View style={[styles.inline, styles.wrap]}>
          {files.map((file, index) => (
            <View key={`${file.name}-${index}`} style={[styles.fileChip, { backgroundColor: ds.c.subtle }]}>
              <DsText v="caption" numberOfLines={1} style={styles.shrink}>
                {file.name}
              </DsText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("ticket.removeFile")}
                hitSlop={8}
                onPress={() => setFiles((current) => current.filter((_, i) => i !== index))}
              >
                <Icon name="close" size={14} color={ds.c.ink} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.inline}>
        {attachEnabled ? <MobileRoundButton icon="add" label={t("tickets.attach")} onPress={() => void attach()} /> : null}
        <TextInput
          ref={input}
          value={text}
          maxLength={4000}
          onChangeText={setText}
          placeholder={t("tickets.composer")}
          placeholderTextColor={ds.c["ink-tertiary"]}
          selectionColor={ds.c.brand}
          returnKeyType="send"
          onSubmitEditing={() => online && send(text.trim())}
          style={[styles.input, { backgroundColor: ds.c.subtle, color: ds.c.ink }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("tickets.send")}
          disabled={!online || (!text.trim() && !files.length)}
          onPress={() => send(text.trim())}
          style={({ pressed }) => [
            styles.send,
            { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
            (!online || (!text.trim() && !files.length)) && styles.disabled,
          ]}
        >
          <Icon name="send" size={20} color={ds.c["on-action"]} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <MobileHelpScreen
      ref={scroller}
      title={label ? t("tickets.threadTitle", { number: label }) : t("tickets.title")}
      onBack={back}
      action={closed ? undefined : <MobileRoundButton icon="more" iconSize={20} label={t("tickets.menu")} onPress={() => setMenu(true)} />}
      footer={composer}
      footerSurface
    >
      {/* `rounded-xl bg-surface px-4 py-3 gap-3` */}
      <View style={[styles.header, { backgroundColor: ds.c.surface }]}>
        <ToneTile icon={topic?.icon ?? "forum"} tone={topic?.tone ?? "bg-brand-subtle text-brand"} />
        <View style={styles.grow}>
          <DsText v="title" w="600" numberOfLines={1}>
            {data.subject}
          </DsText>
          <DsText v="caption" c="ink-secondary" numberOfLines={1}>
            {[topic ? t(`topics.${topic.id}.title`) : "", t("tickets.openedAt", { time: dates.short(data.createdAt) })].filter(Boolean).join(" · ")}
          </DsText>
        </View>
        <StatusChip status={data.status} />
      </View>

      <View style={styles.bubbles}>
        <View style={[styles.day, { backgroundColor: ds.c.surface }]}>
          <DsText v="caption-strong" c="ink-secondary">
            {dates.day(data.createdAt)}
          </DsText>
        </View>
        {pill("check-circle", label ? t("tickets.created", { number: label }) : t("tickets.createdNoNumber"), false)}
        {data.messages.map((message, index) => {
          const mine = !message.fromStaff;
          return (
            <View key={message.id} style={styles.messageWrap}>
              {index === firstStaff && message.author ? pill("verified", t("tickets.joined", { name: message.author.split(" ")[0] }), false) : null}
              {/* `max-w-[78%] rounded-2xl px-4 py-3 gap-1` */}
              <View style={[styles.bubble, mine ? [styles.mine, { backgroundColor: ds.c.brand }] : [styles.theirs, { backgroundColor: ds.c.surface }]]}>
                {message.fromStaff ? (
                  <DsText v="caption-strong" c="accent-violet-fg">
                    {[message.author.split(" ")[0], t("tickets.staff")].filter(Boolean).join(" · ")}
                  </DsText>
                ) : null}
                {message.body ? (
                  <DsText v="body" c={mine ? "on-action" : "ink"}>
                    {message.body}
                  </DsText>
                ) : null}
                {message.attachments.map((file) => (
                  <Pressable
                    key={file.id}
                    accessibilityRole="button"
                    onPress={() => void openAttachment(file).catch(() => toast.error(t("tickets.loadError")))}
                    style={[styles.attachment, { backgroundColor: mine ? dsAlpha("#ffffff", 0.15) : ds.c.subtle }]}
                  >
                    <Icon name={file.mime.startsWith("image/") ? "image" : "description"} size={18} color={mine ? ds.c["on-action"] : ds.c.ink} />
                    <DsText v="body-sm" c={mine ? "on-action" : "ink"} numberOfLines={1} style={styles.shrink}>
                      {file.name}
                    </DsText>
                  </Pressable>
                ))}
                <View style={styles.time}>
                  <DsText v="caption" style={{ color: mine ? dsAlpha("#ffffff", 0.8) : ds.c["ink-tertiary"] }}>
                    {clock(message.createdAt)}
                  </DsText>
                  {mine ? <Icon name="done-all" size={14} color={dsAlpha("#ffffff", 0.8)} /> : null}
                </View>
              </View>
            </View>
          );
        })}
        {pending.map((message) => (
          <View key={message.id} style={[styles.messageWrap, styles.pendingWrap]}>
            <View style={[styles.bubble, styles.mine, { backgroundColor: ds.c.brand, opacity: message.failed ? 1 : 0.7 }]}>
              <DsText v="body" c="on-action">
                {message.body}
              </DsText>
              <View style={styles.time}>
                <Icon name={message.failed ? "warning" : "schedule"} size={14} color={message.failed ? ds.c["danger-bg"] : dsAlpha("#ffffff", 0.8)} />
              </View>
            </View>
            {message.failed ? (
              <Pressable accessibilityRole="button" onPress={() => send(message.body, message.id)} style={[styles.event, styles.selfCenter, { backgroundColor: ds.c.surface }]}>
                <Icon name="warning" size={14} color={ds.c["ink-secondary"]} />
                <DsText v="caption" c="ink-secondary">
                  {t("tickets.sendFailed")}
                </DsText>
              </Pressable>
            ) : null}
          </View>
        ))}
        {data.status === "open" && data.queuePosition ? (
          <View style={[styles.queue, { backgroundColor: ds.c["accent-teal-bg"] }]}>
            <Icon name="schedule" size={14} color={ds.c["accent-teal-fg"]} />
            <DsText v="caption" c="accent-teal-fg">
              {t("tickets.queue", { position: data.queuePosition, minutes: data.queueMinutes ?? 10 })}
            </DsText>
          </View>
        ) : null}
        {closed ? pill("lock", data.rating ? t("tickets.closedRated", { stars: data.rating.stars }) : t("tickets.closedEvent")) : null}
      </View>

      {askSolved ? (
        <View style={[styles.solved, { backgroundColor: ds.c.surface }]}>
          <DsText v="title-sm" w="600">
            {t("tickets.solved")}
          </DsText>
          <View style={styles.solvedActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => input.current?.focus()}
              style={({ pressed }) => [styles.solvedButton, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : "transparent" }]}
            >
              <DsText v="body-sm" w="600" numberOfLines={1}>
                {t("tickets.solvedNo")}
              </DsText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirm(true)}
              style={({ pressed }) => [styles.solvedButton, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
            >
              <DsText v="body-sm" w="600" c="on-action" numberOfLines={1}>
                {t("tickets.solvedYes")}
              </DsText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Veb `DropdownMenu` (bitta band) — mobilda kichik pastki oyna. */}
      <Sheet variant="app" compact open={menu} onClose={() => setMenu(false)} title={t("tickets.menu")}>
        <HelpRows>
          <HelpRow
            icon="lock"
            tone="bg-brand-subtle text-brand"
            title={t("tickets.close")}
            chevron={false}
            onPress={() => {
              setMenu(false);
              setConfirm(true);
            }}
          />
        </HelpRows>
      </Sheet>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        tone="brand"
        icon="check-circle"
        title={t("tickets.confirmTitle")}
        description={t("tickets.confirmText")}
        confirmLabel={t("tickets.confirmYes")}
        cancelLabel={t("tickets.confirmNo")}
        pending={close.isPending}
        onConfirm={closeTicket}
      />
      <RatingSheet ticket={data} open={rating} onClose={() => setRating(false)} />
    </MobileHelpScreen>
  );
}

export function HelpTicketsPage() {
  const { t } = useTranslation("help");
  const router = useRouter();
  const paths = useHelpPaths();
  const tickets = useSupportTickets();
  const { openNewTicket } = useHelpActions();
  const [filter, setFilter] = useState<TicketFilter>("all");
  const items = filterTickets(tickets.data ?? [], filter);
  const firstQueued = (tickets.data ?? []).find((ticket) => ticket.status === "open" && ticket.queuePosition);
  const ds = useDs();

  return (
    <MobileHelpScreen
      title={t("tickets.title")}
      onBack={() => (router.canGoBack() ? router.back() : router.replace(paths.home as never))}
      footer={<MobileButton label={t("tickets.new")} icon="add" onPress={() => openNewTicket()} />}
    >
      <FilterTabs value={filter} onChange={setFilter} />
      {tickets.isLoading ? (
        <RowsSkeleton rows={4} />
      ) : items.length ? (
        <>
          <TicketRows tickets={items} onOpen={(id) => router.push(paths.ticket(id) as never)} />
          {filter === "open" && firstQueued?.queuePosition ? (
            <View style={[styles.inline, styles.note]}>
              <Icon name="schedule" size={14} color={ds.c["ink-secondary"]} />
              <DsText v="caption" c="ink-secondary" style={styles.grow}>
                {t("tickets.queueShort", { position: firstQueued.queuePosition, minutes: firstQueued.queueMinutes ?? 10 })}
              </DsText>
            </View>
          ) : null}
          {filter === "closed" ? (
            <DsText v="caption" c="ink-tertiary" style={styles.note}>
              {t("tickets.archiveNote")}
            </DsText>
          ) : null}
        </>
      ) : (
        <ListEmpty filter={filter} />
      )}
    </MobileHelpScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  center: { textAlign: "center" },
  disabled: { opacity: 0.4 },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  wrap: { flexWrap: "wrap" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  note: { paddingHorizontal: 4 },
  groups: { gap: 16 },
  group: { gap: 8 },
  groupLabel: { paddingHorizontal: 4, textTransform: "uppercase", letterSpacing: 0.4 },
  groupCard: { overflow: "hidden", borderRadius: dsRadius.xl },
  ticketRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  ticketText: { flex: 1, minWidth: 0, gap: 4 },
  filters: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 24 },
  filter: { flex: 1, minWidth: 0, height: 40, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, borderRadius: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
  bubbles: { gap: 12 },
  day: { alignSelf: "center", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  event: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  selfCenter: { alignSelf: "center" },
  messageWrap: { gap: 12 },
  pendingWrap: { alignItems: "flex-end", gap: 8 },
  bubble: { maxWidth: "78%", gap: 4, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  mine: { alignSelf: "flex-end" },
  theirs: { alignSelf: "flex-start" },
  attachment: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: dsRadius.lg },
  time: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 4 },
  queue: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  solved: { gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
  solvedActions: { flexDirection: "row", gap: 8 },
  solvedButton: { flex: 1, minWidth: 0, height: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderRadius: 22 },
  composer: { flex: 1, gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  closedBar: { flex: 1, gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, alignItems: "stretch" },
  outline: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 20, borderWidth: 1, borderRadius: 22 },
  fileChip: { maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14 },
  input: { flex: 1, minWidth: 0, height: 44, paddingHorizontal: 16, borderRadius: 22, fontFamily: bodyFont("400"), fontSize: dsType.body.fontSize },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  rating: { alignItems: "center", gap: 16, paddingBottom: 4 },
  stars: { flexDirection: "row", gap: 12 },
  tags: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  tag: { height: 44, justifyContent: "center", paddingHorizontal: 16, borderWidth: 1, borderRadius: 22 },
  field: { alignSelf: "stretch", gap: 8 },
});
