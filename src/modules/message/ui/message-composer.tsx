import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardState } from "react-native-keyboard-controller";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from "expo-audio";
import { formatFileSize, toUploadFile, type PickedFile } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import type { ChatMessage, SendMessagePayload } from "@/shared/types";
import { Avatar, bodyFont, DsText, dsRadius, dsType, Icon, toast, useDs } from "@/shared/ui";
import { messageApi } from "../api/message.api";
import { messageKeys } from "../model/message.keys";
import { AttachmentSheet } from "./attachment-sheet";
import { ImagePreviewScreen } from "./image-preview-screen";

export interface MessageComposerProps {
  onSend: (payload: SendMessagePayload) => void | Promise<void>;
  sending?: boolean;
  replyTo?: ChatMessage | null;
  editingMessage?: ChatMessage | null;
  onCancelContext: () => void;
  currentUserId?: string | null;
  onTyping?: () => void;
  allowAttachments?: boolean;
  roomId?: string | null;
  /** Biriktirish oynasidagi "Vazifa" (faqat o'qituvchi guruhida). */
  onAssignment?: () => void;
  /** Shaxsiy suhbat `pending`/`blocked` — yozish yopiq, sababi ko'rsatiladi. */
  disabledReason?: string;
}

const EMOJIS = ["🔥", "💎", "🚀", "👑", "⚡", "🎯"];
const MAX_FILE_MB = 20;
/** "Yozmoqda" signali shu oraliqda bir martadan ko'p yuborilmaydi. */
const TYPING_THROTTLE_MS = 2500;

function formatDuration(total: number): string {
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Xabar yozish paneli — veb `message-composer.tsx` ning tor ekran varianti:
 * `bg-surface px-4 pt-2.5`, chapda "+" (biriktirish), o'rtada `rounded-[22px]
 * bg-subtle` maydon va emoji tugmasi, o'ngda yuborish yoki mikrofon.
 * Ustida: offline ogohlantirishi, javob/tahrir konteksti, biriktirilgan
 * hujjatlar va "@" yozilganda guruh a'zolari ro'yxati. Ovoz yozishda maydon
 * o'rnini qizil panel egallaydi; rasm tanlansa rasm yuborish ekrani ochiladi.
 */
export function MessageComposer({
  onSend,
  sending = false,
  replyTo,
  editingMessage,
  onCancelContext,
  currentUserId = null,
  onTyping,
  allowAttachments = true,
  roomId = null,
  onAssignment,
  disabledReason,
}: MessageComposerProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardState((state) => state.isVisible);
  const online = useOnlineStatus();
  const inputRef = useRef<TextInput>(null);
  const emojiRef = useRef<View>(null);
  const [draft, setDraft] = useState(() => editingMessage?.text ?? "");
  const draftRef = useRef(draft);
  const caretRef = useRef(draft.length);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState<{ top: number; right: number } | null>(null);
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [mentioned, setMentioned] = useState<Record<string, string>>({});

  const members = useQuery({
    queryKey: messageKeys.members(roomId ?? "", mention?.query ?? ""),
    queryFn: ({ signal }) => messageApi.getMembers(roomId as string, mention?.query ?? "", { signal }),
    enabled: Boolean(roomId) && Boolean(mention),
  });
  const suggestions = (members.data ?? []).slice(0, 6);

  /* Ovozli xabar: mikrofon -> yozish paneli (`RecordingPanel`) -> yuborish yoki bekor qilish. */
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (editingMessage || replyTo) inputRef.current?.focus();
  }, [editingMessage, replyTo]);

  useEffect(
    () => () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    },
    []
  );

  function updateDraft(value: string) {
    draftRef.current = value;
    setDraft(value);
  }

  function detectMention(value: string, caret: number) {
    const before = value.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at === -1) {
      setMention(null);
      return;
    }
    const previous = at === 0 ? " " : before[at - 1];
    const query = before.slice(at + 1);
    if (!/\s/.test(previous ?? "") || /\s/.test(query)) {
      setMention(null);
      return;
    }
    setMention({ query, start: at });
  }

  function applyMention(username: string, userId: string) {
    if (!mention) return;
    setMentioned((current) => ({ ...current, [username]: userId }));
    const caret = caretRef.current;
    const next = `${draft.slice(0, mention.start)}@${username} ${draft.slice(caret)}`;
    const position = mention.start + username.length + 2;
    updateDraft(next);
    caretRef.current = position;
    setMention(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelection?.(position, position);
    });
  }

  function handleChange(value: string) {
    const caret = Math.max(0, caretRef.current + (value.length - draftRef.current.length));
    caretRef.current = caret;
    updateDraft(value);
    detectMention(value, caret);
    if (onTyping && !typingTimerRef.current) {
      onTyping();
      typingTimerRef.current = setTimeout(() => {
        typingTimerRef.current = null;
      }, TYPING_THROTTLE_MS);
    }
  }

  async function submit() {
    const text = draft.trim();
    if ((!text && !files.length) || sending) return;
    const mentions = Object.entries(mentioned)
      .filter(([username]) => text.includes(`@${username}`))
      .map(([, id]) => id);
    const queued = files;
    updateDraft("");
    setFiles([]);
    setMention(null);
    if (!queued.length) {
      await onSend({ text, mentions, clientMessageId: crypto.randomUUID() });
      return;
    }
    for (const [index, file] of queued.entries()) {
      await onSend({
        text: index === 0 ? text : "",
        file: toUploadFile(file),
        mentions: index === 0 ? mentions : [],
        clientMessageId: crypto.randomUUID(),
      });
    }
  }

  function addFiles(picked: PickedFile[], images: boolean) {
    const accepted = picked.filter((file) => {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(t("composer.fileTooLarge"));
        return false;
      }
      return true;
    });
    if (!accepted.length) return;
    setFiles((current) => [...current, ...accepted]);
    if (images) {
      setPreviewOpen(true);
      return;
    }
    toast.success(t("composer.fileAttached"));
  }

  async function startRecording() {
    if (recording) return;
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      toast.error(t("composer.micDenied"));
      return;
    }
    setRecording(true);
  }

  function finishRecording(result: { uri: string; seconds: number } | null) {
    setRecording(false);
    if (!result) return;
    void onSend({
      text: "",
      clientMessageId: crypto.randomUUID(),
      voice: {
        file: toUploadFile({ uri: result.uri, name: `voice-${Date.now()}.m4a`, mimeType: "audio/mp4", size: 0 }),
        durationMs: Math.max(1000, result.seconds * 1000),
      },
    });
  }

  function openEmoji() {
    emojiRef.current?.measureInWindow((x, y, width) => setEmojiAnchor({ top: y, right: x + width }));
  }

  const context = editingMessage || replyTo;
  const hasContent = Boolean(draft.trim() || files.length);
  const base = context ? 14 : 24;
  const paddingBottom = keyboardVisible ? base : Math.max(base, insets.bottom + 8);

  if (disabledReason) {
    return (
      <View style={[styles.box, { backgroundColor: ds.c.surface, paddingBottom }]}>
        <DsText v="body-sm" c="ink-secondary" style={styles.center}>
          {disabledReason}
        </DsText>
      </View>
    );
  }

  return (
    <View>
      {mention ? (
        <View style={[styles.mentions, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.xl }]}>
          <DsText v="caption" c="ink-secondary" style={styles.mentionTitle}>
            {t("mention.title")}
          </DsText>
          {suggestions.length ? (
            suggestions.map((member, index) => (
              <Pressable
                key={member.id}
                accessibilityRole="button"
                onPress={() => applyMention(member.username, member.id)}
                style={({ pressed }) => [styles.mention, (index === 0 || pressed) && { backgroundColor: ds.c["brand-subtle"] }]}
              >
                <Avatar variant="legacy" name={member.name} src={member.avatarUrl} size="md" box={40} />
                <View style={styles.grow}>
                  <DsText v="title" numberOfLines={1} style={styles.mentionName}>
                    {member.name}
                  </DsText>
                  <DsText v="body-sm" c={member.role === "teacher" ? "brand" : "ink-secondary"} numberOfLines={1}>
                    {member.role === "teacher"
                      ? t("mention.teacher")
                      : `@${member.username}${member.isOnline ? ` · ${t("mention.online")}` : ""}`}
                  </DsText>
                </View>
              </Pressable>
            ))
          ) : (
            <DsText v="caption" c="ink-tertiary" style={styles.mentionEmpty}>
              {members.isLoading ? "..." : t("mention.empty")}
            </DsText>
          )}
        </View>
      ) : null}

      <View style={[styles.box, { backgroundColor: ds.c.surface, paddingBottom }]}>
        {online ? null : (
          <View style={styles.offline}>
            <Icon name="wifi" size={16} color={ds.c["saffron-strong"]} />
            <DsText v="caption" c="saffron-strong" numberOfLines={1}>
              {t("offline.composerShort")}
            </DsText>
          </View>
        )}

        {context ? (
          <View style={styles.context}>
            <View style={[styles.contextBar, { backgroundColor: ds.c.brand }]} />
            <View style={styles.grow}>
              <DsText v="caption-strong" c="brand" numberOfLines={1}>
                {editingMessage
                  ? t("composer.editingLabel")
                  : replyTo?.senderName || (replyTo?.senderId === currentUserId ? t("composer.youLabel") : t("composer.replyFallback"))}
              </DsText>
              <DsText v="body-sm" c="ink-secondary" numberOfLines={1} style={styles.contextText}>
                {context.text}
              </DsText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={editingMessage ? t("composer.cancelEditAria") : t("composer.cancelReplyAria")}
              onPress={() => {
                onCancelContext();
                if (editingMessage) updateDraft("");
              }}
              style={({ pressed }) => [styles.contextClose, pressed && { backgroundColor: ds.c.subtle }]}
            >
              <Icon name="close" size={18} color={ds.c["ink-secondary"]} />
            </Pressable>
          </View>
        ) : null}

        {files.length && !previewOpen ? (
          <View style={styles.files}>
            {files.map((file, index) => {
              const image = file.mimeType.startsWith("image/");
              return (
                <View
                  key={`${file.uri}-${index}`}
                  style={[styles.fileTile, image ? styles.fileImage : styles.fileDoc, { borderColor: ds.c.line, backgroundColor: ds.c.canvas }]}
                >
                  {image ? (
                    <Image source={{ uri: file.uri }} style={styles.fill} resizeMode="cover" />
                  ) : (
                    <>
                      <View style={[styles.fileExt, { backgroundColor: ds.c["error-bg"] }]}>
                        <DsText v="caption-strong" c="error-text">
                          {file.name.split(".").pop()?.slice(0, 4).toUpperCase() ?? "FILE"}
                        </DsText>
                      </View>
                      <View style={styles.fileText}>
                        <DsText v="caption-strong" numberOfLines={1}>
                          {file.name}
                        </DsText>
                        <DsText v="caption" c="ink-tertiary">
                          {formatFileSize(file.size)}
                        </DsText>
                      </View>
                    </>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("composer.removeAttachmentAria")}
                    onPress={() => setFiles((current) => current.filter((_, position) => position !== index))}
                    hitSlop={6}
                    style={[styles.fileRemove, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.xs }]}
                  >
                    <Icon name="close" size={14} color={ds.c["ink-tertiary"]} />
                  </Pressable>
                </View>
              );
            })}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("composer.attachAria")}
              onPress={() => setAttachOpen(true)}
              style={[styles.fileTile, styles.fileImage, styles.fileAdd, { borderColor: ds.c.line }]}
            >
              <Icon name="add" size={20} color={ds.c["ink-tertiary"]} />
            </Pressable>
          </View>
        ) : null}

        {recording ? (
          <RecordingPanel onDone={finishRecording} />
        ) : (
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("composer.attachAria")}
              disabled={!allowAttachments || Boolean(editingMessage)}
              onPress={() => setAttachOpen(true)}
              style={({ pressed }) => [
                styles.round,
                { backgroundColor: pressed ? ds.c.muted : ds.c.subtle },
                (!allowAttachments || editingMessage) && styles.disabled,
              ]}
            >
              <Icon name="add" size={22} color={ds.c.ink} />
            </Pressable>

            {/* `min-h-11 rounded-[22px] bg-subtle py-2.5 pr-3 pl-4.5 gap-2` */}
            <View style={[styles.field, { backgroundColor: ds.c.subtle }]}>
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={handleChange}
                onSelectionChange={(event) => {
                  caretRef.current = event.nativeEvent.selection.end;
                  detectMention(draftRef.current, event.nativeEvent.selection.end);
                }}
                multiline
                submitBehavior="newline"
                maxLength={4000}
                placeholder={editingMessage ? t("composer.editPlaceholder") : t("composer.sendPlaceholder")}
                placeholderTextColor={ds.c["ink-secondary"]}
                accessibilityLabel={t("composer.textAria")}
                selectionColor={ds.c.brand}
                style={[styles.input, { color: ds.c.ink }]}
              />
              <View ref={emojiRef} collapsable={false}>
                <Pressable accessibilityRole="button" accessibilityLabel={t("composer.emojiAria")} onPress={openEmoji} hitSlop={8} style={styles.emojiButton}>
                  <Icon name="emoji" size={20} color={ds.c["ink-secondary"]} />
                </Pressable>
              </View>
            </View>

            {hasContent || editingMessage ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={editingMessage ? t("composer.saveEditAria") : t("composer.sendAria")}
                disabled={(!draft.trim() && !files.length) || sending}
                onPress={() => void submit()}
                style={({ pressed }) => [
                  styles.round,
                  { backgroundColor: pressed ? ds.c["action-hover"] : ds.c.action },
                  (!draft.trim() && !files.length) || sending ? styles.disabled : null,
                ]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={ds.c["on-action"]} />
                ) : (
                  <Icon name={editingMessage ? "check" : "send"} size={editingMessage ? 22 : 20} color={ds.c["on-action"]} />
                )}
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("actionsMenu.voiceAria")}
                onPress={() => void startRecording()}
                style={({ pressed }) => [styles.round, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }]}
              >
                <Icon name="mic" size={22} color={ds.c.ink} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      <Modal visible={Boolean(emojiAnchor)} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setEmojiAnchor(null)}>
        <Pressable accessibilityRole="button" style={styles.fill} onPress={() => setEmojiAnchor(null)}>
          {emojiAnchor ? (
            <View
              style={[
                styles.emojiPill,
                { top: emojiAnchor.top - 46 - 50, left: emojiAnchor.right + 11 - 266, backgroundColor: ds.c.surface, boxShadow: ds.shadow.xl },
              ]}
            >
              {EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  accessibilityRole="button"
                  onPress={() => {
                    updateDraft(draftRef.current + emoji);
                    setEmojiAnchor(null);
                  }}
                  style={({ pressed }) => [styles.emoji, pressed && { backgroundColor: ds.c.subtle }]}
                >
                  <DsText style={styles.emojiText}>{emoji}</DsText>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Pressable>
      </Modal>

      <AttachmentSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        roomId={roomId ?? undefined}
        onPick={addFiles}
        onAssignment={onAssignment}
        maxSizeMb={MAX_FILE_MB}
      />

      {previewOpen && files.length ? (
        <ImagePreviewScreen
          files={files}
          caption={draft}
          onCaptionChange={updateDraft}
          onRemove={(index) =>
            setFiles((current) => {
              const next = current.filter((_, position) => position !== index);
              if (!next.length) setPreviewOpen(false);
              return next;
            })
          }
          onAddMore={() => {
            setPreviewOpen(false);
            setAttachOpen(true);
          }}
          onCancel={() => {
            setFiles([]);
            setPreviewOpen(false);
          }}
          onSend={() => {
            setPreviewOpen(false);
            void submit();
          }}
        />
      ) : null}
    </View>
  );
}

/**
 * Ovoz yozish paneli — veb tor ekran varianti: `h-11 rounded-full
 * bg-danger-bg` ichida qizil nuqta, vaqt va "‹ Bekor qilish uchun suring",
 * o'ngda `size-13 bg-danger` yuborish tugmasi.
 *
 * Yozgich (`useAudioRecorder`) shu panel bilan birga yaratiladi: kompozer
 * ochilishi bilan yaratilsa, Android faoliyati almashgan paytda (masalan
 * rasm tanlagichdan qaytganda) nativ konstruktor rad etilib ekran yiqilardi.
 */
function RecordingPanel({ onDone }: { onDone: (result: { uri: string; seconds: number } | null) => void }) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [seconds, setSeconds] = useState(0);
  const secondsRef = useRef(0);
  const stoppedRef = useRef(false);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // iOS'da yozish uchun audio sessiya rejimi yoqilishi shart.
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (cancelled) return;
        recorder.record();
      } catch {
        toast.error(t("composer.micDenied"));
        doneRef.current(null);
      }
    })();
    const timer = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      if (!stoppedRef.current) void recorder.stop().catch(() => undefined);
      void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    };
  }, [recorder, t]);

  async function stop(cancel: boolean) {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    try {
      await recorder.stop();
    } catch {
      // Yozuv boshlanmagan bo'lsa ham panel yopiladi.
    }
    const uri = recorder.uri;
    onDone(cancel || !uri ? null : { uri, seconds: secondsRef.current });
  }

  return (
    <View style={styles.row}>
      <View style={[styles.recordPill, { backgroundColor: ds.c["danger-bg"] }]}>
        <PulseDot color={ds.c.danger} />
        <DsText v="title-sm" c="error-text" numeric>
          {formatDuration(seconds)}
        </DsText>
        <Pressable accessibilityRole="button" onPress={() => void stop(true)} style={styles.grow}>
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
            ‹ {t("composer.recordSwipeCancel")}
          </DsText>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("composer.recordSend")}
        onPress={() => void stop(false)}
        style={({ pressed }) => [styles.recordSend, { backgroundColor: ds.c.danger, opacity: pressed ? 0.85 : 1 }]}
      >
        <Icon name="mic" size={24} color={ds.c["on-action"]} />
      </Pressable>
    </View>
  );
}

/** Yozish paytidagi qizil nuqta — `animate-pulse`. */
function PulseDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.set(withRepeat(withTiming(0.4, { duration: 800 }), -1, true));
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return <Animated.View style={[styles.pulse, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  disabled: { opacity: 0.4 },
  /* `bg-surface px-4 pt-2.5` */
  box: { paddingHorizontal: 16, paddingTop: 10 },
  offline: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  /* `right-4 left-4 rounded-xl bg-surface px-2 pt-6.5 pb-2 shadow-xl` */
  mentions: { marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 8, paddingTop: 26, paddingBottom: 8, borderRadius: dsRadius.xl },
  mentionTitle: { paddingHorizontal: 10, paddingBottom: 3, textTransform: "uppercase" },
  mention: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: dsRadius.lg },
  mentionName: { lineHeight: 20 },
  mentionEmpty: { paddingHorizontal: 16, paddingBottom: 12 },
  /* `mt-2.5 mb-4 gap-2.5 pl-1` */
  context: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, marginBottom: 16, paddingLeft: 4 },
  contextBar: { width: 3, alignSelf: "stretch", borderRadius: 2 },
  contextText: { lineHeight: 16 },
  contextClose: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  files: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 },
  fileTile: { overflow: "hidden", borderWidth: 1, borderRadius: dsRadius.xl },
  fileImage: { width: 64, height: 64 },
  fileDoc: { height: 64, flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 12, paddingRight: 36 },
  fileAdd: { borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  fileExt: { width: 40, height: 40, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  fileText: { maxWidth: 150, minWidth: 0 },
  fileRemove: { position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  /* `items-end gap-2.25` */
  row: { flexDirection: "row", alignItems: "flex-end", gap: 9 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  field: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: "row", alignItems: "flex-end", gap: 8, paddingVertical: 10, paddingLeft: 18, paddingRight: 12, borderRadius: 22 },
  input: { flex: 1, minWidth: 0, maxHeight: 120, padding: 0, fontSize: dsType.body.fontSize, lineHeight: 24, fontFamily: bodyFont("400"), marginVertical: -2 },
  emojiButton: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  emojiPill: { position: "absolute", width: 266, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, borderRadius: 25 },
  emoji: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  emojiText: { fontSize: 22, lineHeight: 28 },
  recordPill: { flex: 1, minWidth: 0, height: 44, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderRadius: 22 },
  pulse: { width: 10, height: 10, borderRadius: 5 },
  recordSend: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
});
