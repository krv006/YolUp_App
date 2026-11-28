import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import {
  deviceInfo,
  fileProblem,
  formatSize,
  MIN_DESCRIPTION,
  searchEntries,
  ticketLabel,
  ticketTopic,
  TICKET_FILE_TYPES,
  TICKET_TOPICS,
  useCreateTicketDraft,
  useHelpConfig,
  type SupportTicket,
} from "@/modules/support";
import { pickDocuments, toUploadFile } from "@/shared/lib";
import { CheckboxMark, ConfirmDialog, DsText, dsRadius, Icon, MobileButton, MobileInput, MobileRadio, Sheet, toast, useDs, type IconName } from "@/shared/ui";
import { MobileHelpScreen } from "./help-screen";
import { StatusChip, ToneTile } from "./help-ui";
import { useHelpPaths, useHelpSearchEntries, useReplyMinutes } from "./use-help";

/*
 * Yangi murojaat — veb `pages/help/help-new-ticket.tsx` dagi `NewTicketPage`
 * (mobil): mavzu, sarlavha, tavsif (kamida 20 belgi), fayllar, qurilma
 * ma'lumoti, tavsiya maqola, bekor qilishni tasdiqlash va "qabul qilindi".
 *
 * 🟡 Vebdan farqi:
 * - fayllar `<input type="file">` o'rniga hujjat tanlagichdan (PNG/JPG/PDF);
 * - yuklash foizi yo'q — ilovaning `fetch` i yuborish jarayonini bermaydi
 *   (`request-interceptor` dagi `onUploadProgress` izohi), o'rniga noaniq
 *   chiziq;
 * - orqaga (tizim tugmasi ham) — yozilgan narsa bo'lsa tasdiq so'raladi.
 */

interface PickedFile {
  id: string;
  file: File;
  problem: "size" | "type" | null;
}

function TopicSheet({ open, value, onClose, onPick }: { open: boolean; value: string; onClose: () => void; onPick: (value: string) => void }) {
  const { t } = useTranslation("help");
  const [current, setCurrent] = useState(value || TICKET_TOPICS[0].id);
  return (
    <Sheet
      variant="app"
      open={open}
      onClose={onClose}
      title={t("ticket.topicSheetTitle")}
      description={t("ticket.topicSheetHint")}
      footer={
        <MobileButton
          label={t("ticket.choose")}
          onPress={() => {
            onPick(current);
            onClose();
          }}
        />
      }
    >
      <View accessibilityRole="radiogroup">
        {TICKET_TOPICS.map((topic) => (
          <Pressable
            key={topic.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: current === topic.id }}
            onPress={() => setCurrent(topic.id)}
            style={styles.topic}
          >
            <ToneTile icon={topic.icon} tone={topic.tone} />
            <View style={styles.grow}>
              <DsText v="title-sm" w="600">
                {t(`topics.${topic.id}.title`)}
              </DsText>
              <DsText v="caption" c="ink-secondary">
                {t(`topics.${topic.id}.hint`)}
              </DsText>
            </View>
            <MobileRadio checked={current === topic.id} />
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

/** Noaniq yuklash chizig'i — `h-1 w-37.5 rounded-full bg-line`. */
function UploadBar() {
  const ds = useDs();
  const x = useSharedValue(-60);
  useEffect(() => {
    x.value = withRepeat(withTiming(150, { duration: 1100 }), -1, false);
  }, [x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={[styles.bar, { backgroundColor: ds.c.line }]}>
      <Animated.View style={[styles.barFill, { backgroundColor: ds.c.brand }, style]} />
    </View>
  );
}

function FileChip({ item, uploading, onRemove, maxMb }: { item: PickedFile; uploading: boolean; onRemove: () => void; maxMb: number }) {
  const { t } = useTranslation("help");
  const ds = useDs();
  const image = item.file.type.startsWith("image/");
  const meta = item.problem
    ? item.problem === "size"
      ? t("ticket.tooBig", { size: formatSize(item.file.size), mb: maxMb })
      : t("ticket.badType")
    : formatSize(item.file.size);
  const icon: IconName = image ? "image" : "description";
  return (
    // `rounded-lg px-4 py-3 gap-3`, muammoli fayl `border-danger bg-danger-bg`
    <View
      style={[
        styles.file,
        item.problem ? { borderWidth: 1, borderColor: ds.c.danger, backgroundColor: ds.c["danger-bg"] } : { backgroundColor: ds.c.subtle },
      ]}
    >
      <View style={[styles.fileIcon, !item.problem && { backgroundColor: ds.c["brand-subtle"] }]}>
        <Icon name={icon} size={18} color={item.problem ? ds.c["error-text"] : ds.c.brand} />
      </View>
      <View style={styles.grow}>
        <DsText v="body-sm" w="600" numberOfLines={1}>
          {item.file.name}
        </DsText>
        <DsText v="caption" c={item.problem ? "error-text" : "ink-secondary"}>
          {meta}
        </DsText>
        {uploading && !item.problem ? <UploadBar /> : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t("ticket.removeFile")} onPress={onRemove} hitSlop={8} style={styles.fileRemove} disabled={uploading}>
        <Icon name="close" size={18} color={ds.c["ink-secondary"]} />
      </Pressable>
    </View>
  );
}

function CreatedBody({ ticket }: { ticket: SupportTicket }) {
  const { t } = useTranslation("help");
  const ds = useDs();
  const minutes = useReplyMinutes();
  const topic = ticketTopic(ticket.category);
  const rows = [
    ticketLabel(ticket) ? { icon: "description", tone: "bg-brand-subtle text-brand", label: t("ticket.number"), value: <DsText v="body-sm" c="ink-secondary">{ticketLabel(ticket)}</DsText> } : null,
    topic ? { icon: topic.icon, tone: topic.tone, label: t("ticket.topic"), value: <DsText v="body-sm" c="ink-secondary">{t(`topics.${topic.id}.title`)}</DsText> } : null,
    { icon: "schedule", tone: "bg-brand-subtle text-brand", label: t("ticket.status"), value: <StatusChip status={ticket.status} /> },
  ].filter((row): row is NonNullable<typeof row> => row !== null);
  return (
    <View style={styles.created}>
      <View style={[styles.createdIcon, { backgroundColor: ds.c["success-bg"] }]}>
        <Icon name="check-circle" size={40} color={ds.c["success-fg"]} />
      </View>
      <DsText v="h2" heading style={styles.center}>
        {t("ticket.createdTitle")}
      </DsText>
      <DsText v="body" c="ink-secondary" style={styles.center}>
        {t("ticket.createdText", { minutes })}
      </DsText>
      {/* `rounded-xl bg-subtle`, qatorlar orasida chiziq */}
      <View style={[styles.summary, { backgroundColor: ds.c.subtle }]}>
        {rows.map((row, index) => (
          <View key={row.label} style={[styles.summaryRow, index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
            <ToneTile icon={row.icon} tone={row.tone} size={36} iconSize={18} />
            <DsText v="title-sm" w="600" style={styles.grow}>
              {row.label}
            </DsText>
            {row.value}
          </View>
        ))}
      </View>
    </View>
  );
}

export function NewTicketPage() {
  const { t } = useTranslation("help");
  const ds = useDs();
  const router = useRouter();
  const navigation = useNavigation();
  const paths = useHelpPaths();
  const minutes = useReplyMinutes();
  const config = useHelpConfig();
  const params = useLocalSearchParams<{ category?: string }>();
  const maxMb = config.data?.attachmentsMaxMb ?? 0;
  const maxFiles = config.data?.attachmentsMaxFiles ?? 5;
  const initialTopic = TICKET_TOPICS.some((topic) => topic.id === params.category) ? (params.category as string) : "";
  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [withDevice, setWithDevice] = useState(true);
  const [tried, setTried] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [created, setCreated] = useState<SupportTicket | null>(null);
  const [discard, setDiscard] = useState(false);
  const create = useCreateTicketDraft();
  /** "Ha, bekor qilish" bosilgan — `beforeRemove` endi to'xtatmaydi. */
  const leaving = useRef(false);
  const entries = useHelpSearchEntries();
  const suggestion = useMemo(() => {
    const query = subject.trim().split(" ").filter((word) => word.length > 3).slice(0, 2).join(" ");
    if (query.length < 4) return null;
    return searchEntries(entries.filter((entry) => entry.kind === "article"), query)[0] ?? null;
  }, [entries, subject]);

  const short = message.trim().length < MIN_DESCRIPTION;
  const badFiles = files.some((item) => item.problem);
  const ready = Boolean(topic && subject.trim() && !create.isPending);
  const dirty = Boolean(subject.trim() || message.trim() || files.length);
  const showShort = tried && short;
  const pickedTopic = ticketTopic(topic);

  // Tizim "orqaga" tugmasi va surish ham — yozilgan murojaat yo'qolmasin.
  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (leaving.current || !dirty || created || create.isPending) return;
        event.preventDefault();
        setDiscard(true);
      }),
    [navigation, dirty, created, create.isPending]
  );

  function leave() {
    leaving.current = true;
    router.dismissTo(paths.home as never);
  }

  async function addFiles() {
    const picked = await pickDocuments(TICKET_FILE_TYPES);
    if (!picked.length) return;
    const next = picked.slice(0, Math.max(0, maxFiles - files.length)).map((item) => {
      const file = toUploadFile(item);
      return { id: `${item.name}-${item.size}-${Math.random().toString(36).slice(2, 7)}`, file, problem: fileProblem(file, maxMb) };
    });
    setFiles((current) => [...current, ...next]);
  }

  function submit() {
    setTried(true);
    if (!ready || short || badFiles) return;
    create.mutate(
      {
        category: topic,
        subject: subject.trim(),
        message: message.trim(),
        deviceInfo: withDevice ? deviceInfo() : null,
        files: files.map((item) => item.file),
      },
      {
        onSuccess: setCreated,
        onError: (error) => toast.error(error instanceof Error && error.message ? error.message : t("ticket.failed")),
      }
    );
  }

  if (created)
    return (
      <MobileHelpScreen
        title={t("ticket.createdPage")}
        onBack={leave}
        footer={
          <View style={styles.createdActions}>
            <MobileButton label={t("ticket.view")} style={styles.block} onPress={() => router.replace(paths.ticket(created.id) as never)} />
            <Pressable accessibilityRole="button" onPress={leave} style={styles.linkButton}>
              <DsText v="title-sm" w="600" c="brand">
                {t("ticket.backToHelp")}
              </DsText>
            </Pressable>
          </View>
        }
      >
        <View style={styles.createdWrap}>
          <CreatedBody ticket={created} />
        </View>
      </MobileHelpScreen>
    );

  return (
    <MobileHelpScreen
      title={t("ticket.newTitle")}
      onBack={() => (router.canGoBack() ? router.back() : leave())}
      footer={<MobileButton label={create.isPending ? t("ticket.sending") : t("ticket.send")} disabled={!ready} onPress={submit} />}
    >
      {/* `rounded-xl bg-brand-subtle px-4 py-3 gap-2 text-body-sm text-brand` */}
      <View style={[styles.notice, { backgroundColor: ds.c["brand-subtle"] }]}>
        <Icon name="schedule" size={18} color={ds.c.brand} />
        <DsText v="body-sm" c="brand" style={styles.grow}>
          {t("ticket.newSubtitle", { minutes })}
        </DsText>
      </View>

      <View style={[styles.form, { backgroundColor: ds.c.surface }]}>
        {suggestion ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(paths.article(suggestion.id) as never)}
            style={({ pressed }) => [styles.suggestion, { backgroundColor: ds.c["brand-subtle"], opacity: pressed ? 0.9 : 1 }]}
          >
            <Icon name="menu-book" size={20} color={ds.c.brand} />
            <View style={styles.grow}>
              <DsText v="caption" c="ink-secondary">
                {t("ticket.suggest")}
              </DsText>
              <DsText v="body-sm" w="600" numberOfLines={1}>
                {suggestion.title}
              </DsText>
            </View>
            <Icon name="chevron-right" size={18} color={ds.c["icon-secondary"]} />
          </Pressable>
        ) : null}

        <View style={styles.field}>
          <DsText v="body-sm" w="500">
            {t("ticket.topic")}
          </DsText>
          <Pressable accessibilityRole="button" onPress={() => setSheet(true)} style={[styles.select, { backgroundColor: ds.c.subtle }]}>
            <DsText v="body" c={pickedTopic ? "ink" : "ink-tertiary"} style={styles.grow} numberOfLines={1}>
              {pickedTopic ? t(`topics.${pickedTopic.id}.title`) : t("ticket.topicPlaceholder")}
            </DsText>
            <Icon name="expand-more" size={20} color={ds.c["icon-secondary"]} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <DsText v="body-sm" w="500">
            {t("ticket.subject")}
          </DsText>
          <MobileInput value={subject} maxLength={200} onChangeText={setSubject} placeholder={t("ticket.subjectPlaceholder")} />
        </View>

        <View style={styles.field}>
          <DsText v="body-sm" w="500">
            {t("ticket.description")}
          </DsText>
          <MobileInput
            multiline
            invalid={showShort}
            value={message}
            maxLength={4000}
            onChangeText={setMessage}
            placeholder={t("ticket.descriptionPlaceholder")}
          />
          <DsText v="caption" c={showShort ? "error-text" : "ink-tertiary"}>
            {showShort
              ? t("ticket.descriptionShort", { min: MIN_DESCRIPTION, count: message.trim().length })
              : t("ticket.descriptionHint", { min: MIN_DESCRIPTION })}
          </DsText>
        </View>

        {maxMb ? (
          <View style={styles.field}>
            <DsText v="body-sm" w="500">
              {t("ticket.files")}
            </DsText>
            {files.length ? (
              <>
                <View style={styles.files}>
                  {files.map((item) => (
                    <FileChip
                      key={item.id}
                      item={item}
                      maxMb={maxMb}
                      uploading={create.isPending}
                      onRemove={() => setFiles((current) => current.filter((entry) => entry.id !== item.id))}
                    />
                  ))}
                </View>
                {files.length < maxFiles && !create.isPending ? (
                  <Pressable accessibilityRole="button" onPress={() => void addFiles()} style={styles.addFile} hitSlop={8}>
                    <Icon name="add" size={16} color={ds.c.brand} />
                    <DsText v="body-xs" c="brand">
                      {t("ticket.addFile")}
                    </DsText>
                  </Pressable>
                ) : null}
              </>
            ) : (
              // `rounded-lg border-[1.5px] border-dashed border-line-strong py-6 flex-col gap-2`
              <Pressable
                accessibilityRole="button"
                onPress={() => void addFiles()}
                style={({ pressed }) => [styles.attach, { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : "transparent" }]}
              >
                <Icon name="upload" size={20} color={ds.c.brand} />
                <DsText v="body-sm" w="600" c="brand">
                  {t("ticket.attach")}
                </DsText>
                <DsText v="caption" c="ink-tertiary">
                  {t("ticket.filesHint", { mb: maxMb })}
                </DsText>
              </Pressable>
            )}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: withDevice }}
          onPress={() => setWithDevice((value) => !value)}
          style={styles.check}
        >
          <CheckboxMark checked={withDevice} />
          <DsText v="body-sm" c="ink-secondary" style={styles.grow}>
            {t("ticket.deviceInfoMobile")}
          </DsText>
        </Pressable>
      </View>

      <TopicSheet key={String(sheet)} open={sheet} value={topic} onClose={() => setSheet(false)} onPick={setTopic} />
      <ConfirmDialog
        open={discard}
        onOpenChange={setDiscard}
        icon="trash"
        title={t("ticket.discardTitle")}
        description={t("ticket.discardText")}
        confirmLabel={t("ticket.discardConfirm")}
        cancelLabel={t("ticket.discardKeep")}
        onConfirm={() => {
          setDiscard(false);
          leave();
        }}
      />
    </MobileHelpScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  notice: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
  form: { gap: 16, paddingHorizontal: 16, paddingVertical: 16, borderRadius: dsRadius.xl },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.lg },
  field: { gap: 8 },
  select: { height: 52, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, borderRadius: dsRadius.lg },
  files: { gap: 12 },
  file: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.lg },
  fileIcon: { width: 32, height: 32, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  fileRemove: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  bar: { marginTop: 6, width: 150, maxWidth: "100%", height: 4, overflow: "hidden", borderRadius: 2 },
  barFill: { width: 60, height: "100%", borderRadius: 2 },
  addFile: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  attach: { alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 24, borderWidth: 1.5, borderStyle: "dashed", borderRadius: dsRadius.lg },
  check: { flexDirection: "row", alignItems: "center", gap: 12 },
  topic: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  createdWrap: { paddingTop: 24 },
  created: { alignItems: "center", gap: 16 },
  createdIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  summary: { width: "100%", overflow: "hidden", borderRadius: dsRadius.xl },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  createdActions: { flex: 1, gap: 8 },
  block: { flex: 0, alignSelf: "stretch" },
  linkButton: { height: 48, alignItems: "center", justifyContent: "center" },
});
