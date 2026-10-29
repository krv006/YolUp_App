import { Fragment, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import {
  QuestionAnswerInput,
  QuestionPrompt,
  createDraft,
  draftToFormValues,
  draftToStudentQuestion,
  questionToDraft,
  quizDisplayTitle,
  usePublishQuiz,
  useQuiz,
  useQuizAttempts,
  useRemoveGroupAudio,
  useUpdateQuiz,
  useUploadGroupAudio,
  type GroupDraft,
  type QuestionDraft,
} from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { pickDocument, toUploadFile } from "@/shared/lib";
import type { QuizAnswerValue, QuizGroup, QuizQuestionType } from "@/shared/types";
import {
  DsGradient,
  DsText,
  dsRadius,
  dsShadowHidden,
  Icon,
  MobileActionBar,
  MobileButton,
  MobileRoundButton,
  MobileWarningNote,
  Switch,
  toast,
  useDs,
} from "@/shared/ui";
import { QuestionCard } from "./question-card";
import { QuestionTypeDialog } from "./question-type-dialog";
import { UnsavedChangesDialog } from "./unsaved-changes-dialog";

let counter = 0;
const newKey = () => `k${(counter += 1)}`;

const CHOICE_TYPES = new Set(["single", "multiple", "true_false"]);
const AUDIO_MIME = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/wav", "audio/x-wav"];
const AUDIO_TYPES = [".mp3", ".m4a", ".aac", ".ogg", ".wav"];
const MAX_AUDIO_MB = 60;

type Tab = "edit" | "preview";

/**
 * Test muharriri — veb `test-editor-page.tsx` + `mobile-test-editor.tsx`
 * (tor ekran). `?step=2` — yangi test ustasining 2-qadami (orqaga, savol
 * qo'shish tugmasi va jarayon chizig'i); aks holda "Tahrirlash / Ko'rish"
 * tablari va aylantirilganda sarlavhada "N / jami". Savollar kartalarda,
 * guruh (o'qish/tinglash matni) birinchi savoli ustida. Urinish bo'lsa
 * savollar qulflangan. Saqlanmagan o'zgarish bilan chiqilsa so'raladi.
 */
export function TestEditorPage() {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ quizId: string; step?: string }>();
  const quizId = params.quizId ?? null;
  const wizard = params.step === "2";
  const quiz = useQuiz(quizId);
  const attempts = useQuizAttempts(quizId, Boolean(quizId));
  const update = useUpdateQuiz();
  const publish = usePublishQuiz();
  const uploadAudio = useUploadGroupAudio(quizId ?? "");
  const removeAudio = useRemoveGroupAudio(quizId ?? "");

  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [groups, setGroups] = useState<GroupDraft[]>([]);
  const [dirty, setDirty] = useState(0);
  const [typeOpen, setTypeOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("edit");
  const [visible, setVisible] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({});
  const cards = useRef(new Map<number, { y: number; height: number }>());

  const detail = quiz.data ?? null;
  if (detail && loadedId !== detail.id) {
    setLoadedId(detail.id);
    setDrafts(detail.questions.map((question) => questionToDraft(question, newKey)));
    setGroups(detail.groups.map((group) => ({ key: group.id, id: group.id, title: group.title, passage: group.passage })));
    setDirty(0);
  }

  const locked = (attempts.data ?? []).length > 0;
  const saving = update.isPending || publish.isPending;
  const title = detail ? quizDisplayTitle(detail) : "";

  function patch(key: string, apply: (draft: QuestionDraft) => QuestionDraft) {
    setDrafts((current) => current.map((draft) => (draft.key === key ? apply(draft) : draft)));
    setDirty((value) => value + 1);
  }

  function addQuestion(type: QuizQuestionType) {
    setDrafts((current) => [...current, createDraft(type, newKey)]);
    setDirty((value) => value + 1);
    setTypeOpen(false);
  }

  function toTests() {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.teacher.tests as never);
  }

  function save(asDraft: boolean, then?: () => void) {
    if (!quizId) return;
    update.mutate(
      {
        id: quizId,
        values: {
          title: detail?.title ?? "",
          topic: detail?.topic ?? "",
          dueAt: detail?.dueAt ?? null,
          opensAt: detail?.opensAt ?? null,
          ...(locked
            ? {}
            : {
                groups: groups.map((group) => ({ ...(group.id ? { id: group.id } : {}), title: group.title.trim(), passage: group.passage.trim() })),
                questions: drafts.map((draft) => {
                  const groupIndex = groups.findIndex((group) => group.key === draft.groupKey);
                  return draftToFormValues(draft, groupIndex >= 0 ? groupIndex : null);
                }),
              }),
          ...(asDraft ? { status: "draft" as const } : {}),
        },
      },
      {
        onSuccess: () => {
          setDirty(0);
          then?.();
        },
      }
    );
  }

  function publishTest() {
    if (!quizId) return;
    save(false, () => publish.mutate(quizId, { onSuccess: toTests }));
  }

  function leave() {
    if (dirty > 0) {
      setLeaveOpen(true);
      return;
    }
    toTests();
  }

  // Android "orqaga" ham saqlanmagan o'zgarishni so'raydi.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (dirty === 0) return false;
        setLeaveOpen(true);
        return true;
      });
      return () => subscription.remove();
    }, [dirty])
  );

  /* Vebdagi `trackScroll`: sarlavhada hozir ko'rinayotgan savol raqami. */
  function trackScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (wizard || tab !== "edit") return;
    const top = event.nativeEvent.contentOffset.y;
    let next: number | null = null;
    if (top >= 56) {
      const sorted = [...cards.current.entries()].sort((a, b) => a[0] - b[0]);
      next = sorted.find(([, box]) => box.y + box.height > top + 8)?.[0] ?? null;
    }
    if (next !== visible) setVisible(next);
  }

  const heading = wizard
    ? t("editor.mobile.wizardTitle")
    : visible === null || tab === "preview"
      ? title
      : t("editor.mobile.counter", { current: visible + 1, total: drafts.length });

  const previewDraft = drafts[Math.min(previewIndex, drafts.length - 1)] ?? null;
  const previewPosition = previewDraft ? drafts.indexOf(previewDraft) : 0;

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <DsGradient name="auth" />
      <View style={[styles.header, { marginTop: insets.top + (wizard ? 22 : 20) }]}>
        <MobileRoundButton icon={wizard ? "chevron-left" : "close"} label={t("editor.back")} onPress={leave} />
        <DsText v="title-lg" w="600" numberOfLines={1} style={styles.heading}>
          {heading}
        </DsText>
        {wizard ? <MobileRoundButton icon="quiz" label={t("editor.addQuestion")} disabled={locked} onPress={() => setTypeOpen(true)} /> : <View style={styles.spacer} />}
      </View>

      {/* Fokusdagi maydon klaviatura va pastki panel ustida qoladi (`bottomOffset` — panel balandligi). */}
      <KeyboardAwareScrollView
        style={styles.fill}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        bottomOffset={120}
        onScroll={trackScroll}
        scrollEventThrottle={64}
      >
        {wizard ? (
          <View style={[styles.progress, { backgroundColor: ds.c.subtle }]}>
            <View style={[styles.progressFill, { backgroundColor: ds.c.brand }]} />
          </View>
        ) : (
          <View accessibilityRole="tablist" style={[styles.tabs, { backgroundColor: ds.c.subtle }]}>
            {(["edit", "preview"] as const).map((item) => (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === item }}
                onPress={() => setTab(item)}
                style={[styles.tab, { backgroundColor: tab === item ? ds.c.surface : "transparent", boxShadow: tab === item ? ds.shadow.sm : dsShadowHidden(ds.shadow.sm) }]}
              >
                <DsText v="body-sm" w="500" c={tab === item ? "ink" : "ink-secondary"}>
                  {t(`editor.mobile.tabs.${item}`)}
                </DsText>
              </Pressable>
            ))}
          </View>
        )}

        {tab === "edit" ? (
          <View style={[styles.list, { gap: wizard ? 16 : 12 }]}>
            {locked ? <MobileWarningNote>{t("editor.lockedNotice")}</MobileWarningNote> : null}

            {drafts.map((draft, index) => {
              const group = draft.groupKey && drafts[index - 1]?.groupKey !== draft.groupKey ? groups.find((item) => item.key === draft.groupKey) : null;
              return (
                <Fragment key={draft.key}>
                  {group ? (
                    <GroupCard
                      group={group}
                      saved={detail?.groups.find((item) => item.id === group.id) ?? null}
                      locked={locked}
                      uploading={uploadAudio.isPending}
                      onRemove={() => {
                        setGroups((current) => current.filter((item) => item.key !== group.key));
                        setDrafts((current) => current.map((item) => (item.groupKey === group.key ? { ...item, groupKey: null } : item)));
                        setDirty((value) => value + 1);
                      }}
                      onUpload={(file) => group.id && uploadAudio.mutate({ groupId: group.id, file })}
                      onRemoveAudio={() => group.id && removeAudio.mutate(group.id)}
                    />
                  ) : null}
                  <View
                    onLayout={(event) => {
                      const { y, height } = event.nativeEvent.layout;
                      cards.current.set(index, { y, height });
                    }}
                  >
                    <QuestionCard
                      draft={draft}
                      index={index}
                      locked={locked}
                      newKey={newKey}
                      onChange={(apply) => patch(draft.key, apply)}
                      onRemove={() => {
                        setDrafts((current) => current.filter((item) => item.key !== draft.key));
                        setDirty((value) => value + 1);
                      }}
                    />
                  </View>
                </Fragment>
              );
            })}

            {!locked ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setTypeOpen(true)}
                style={({ pressed }) => [styles.add, { borderColor: ds.c.brand, backgroundColor: pressed ? ds.c["brand-subtle"] : "transparent" }]}
              >
                <Icon name="add" size={20} color={ds.c.brand} />
                <DsText v="title" c="brand">
                  {t("editor.addQuestion")}
                </DsText>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={[styles.preview, { borderColor: ds.c.brand, backgroundColor: ds.c.surface }]}>
            <DsText v="caption-strong" c="ink-secondary" style={styles.upper}>
              {t("editor.previewTitle")}
            </DsText>
            <DsText v="body-sm" c="ink-secondary" style={styles.mt8}>
              {t("editor.mobile.previewHint")}
            </DsText>
            {previewDraft ? (
              <>
                <View style={styles.previewNav}>
                  <DsText v="body-sm" w="500">
                    {t("editor.previewCounter", { current: previewPosition + 1, total: drafts.length })}
                  </DsText>
                  <View style={[styles.previewTrack, { backgroundColor: ds.c.subtle }]}>
                    <View style={[styles.previewFill, { width: `${((previewPosition + 1) / Math.max(drafts.length, 1)) * 100}%`, backgroundColor: ds.c.brand }]} />
                  </View>
                  <View style={styles.previewArrows}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("editor.mobile.previous")}
                      disabled={previewPosition === 0}
                      onPress={() => setPreviewIndex(previewPosition - 1)}
                      style={styles.arrow}
                    >
                      <Icon name="chevron-left" size={18} color={previewPosition === 0 ? ds.c["ink-tertiary"] : ds.c.brand} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("editor.mobile.next")}
                      disabled={previewPosition >= drafts.length - 1}
                      onPress={() => setPreviewIndex(previewPosition + 1)}
                      style={styles.arrow}
                    >
                      <Icon name="chevron-right" size={18} color={previewPosition >= drafts.length - 1 ? ds.c["ink-tertiary"] : ds.c.brand} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.previewBody}>
                  {CHOICE_TYPES.has(previewDraft.type) ? (
                    <PreviewChoices key={previewDraft.key} draft={previewDraft} />
                  ) : (
                    <View style={styles.previewAnswer}>
                      <QuestionPrompt question={draftToStudentQuestion(previewDraft, previewPosition)} />
                      <QuestionAnswerInput
                        question={draftToStudentQuestion(previewDraft, previewPosition)}
                        number={previewPosition + 1}
                        value={answers[previewDraft.key]}
                        onChange={(value) => setAnswers((current) => ({ ...current, [previewDraft.key]: value }))}
                      />
                    </View>
                  )}
                </View>
              </>
            ) : (
              <DsText v="body-sm" c="ink-tertiary" style={styles.mt12}>
                {t("editor.previewEmpty")}
              </DsText>
            )}
          </View>
        )}
      </KeyboardAwareScrollView>

      <MobileActionBar>
        <MobileButton variant="secondary" label={t("editor.saveDraft")} disabled={saving} style={wizard ? styles.draftButton : undefined} onPress={() => save(true, toTests)} />
        <MobileButton icon="send" label={t("editor.publish")} disabled={saving} onPress={publishTest} />
      </MobileActionBar>

      <QuestionTypeDialog open={typeOpen} onOpenChange={setTypeOpen} onPick={addQuestion} />
      <UnsavedChangesDialog open={leaveOpen} count={dirty} onOpenChange={setLeaveOpen} onLeave={toTests} />
    </View>
  );
}

/** Ko'rish rejimida variantli savol — `h-13 rounded-lg`, harf doirasi. */
function PreviewChoices({ draft }: { draft: QuestionDraft }) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const [picked, setPicked] = useState<string[]>([]);
  const options =
    draft.type === "true_false"
      ? [
          { key: "true", text: t("editor.mobile.yes") },
          { key: "false", text: t("editor.mobile.no") },
        ]
      : draft.options;

  return (
    <>
      <DsText v="title">{draft.text || t("editor.noText")}</DsText>
      <View style={styles.choices}>
        {options.map((option, index) => {
          const selected = picked.includes(option.key);
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() =>
                setPicked((current) =>
                  draft.type === "multiple" ? (current.includes(option.key) ? current.filter((item) => item !== option.key) : [...current, option.key]) : [option.key]
                )
              }
              style={[styles.choice, selected ? { borderWidth: 1.5, borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] } : { borderWidth: 1, borderColor: ds.c.line, backgroundColor: ds.c.surface }]}
            >
              <View style={[styles.choiceLetter, { backgroundColor: selected ? ds.c.brand : ds.c.subtle }]}>
                <DsText v="caption-strong" c={selected ? "on-action" : "ink-secondary"}>
                  {String.fromCharCode(65 + index)}
                </DsText>
              </View>
              <DsText numberOfLines={1} style={styles.grow}>
                {option.text}
              </DsText>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function formatDuration(seconds: number): string {
  return Number.isFinite(seconds) && seconds > 0 ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}` : "—";
}

/** Guruh kartasi — `rounded-xl border-[1.5px] border-brand`: nom, audio (yuklash yoki pleer), skript va izoh. */
function GroupCard({
  group,
  saved,
  locked,
  uploading,
  onRemove,
  onUpload,
  onRemoveAudio,
}: {
  group: GroupDraft;
  saved: QuizGroup | null;
  locked: boolean;
  uploading: boolean;
  onRemove: () => void;
  onUpload: (file: File) => void;
  onRemoveAudio: () => void;
}) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const [showScript, setShowScript] = useState(false);
  const audioUrl = saved?.audioUrl ?? null;

  async function pickAudio() {
    const picked = await pickDocument(AUDIO_MIME);
    if (!picked) return;
    const extension = `.${picked.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!AUDIO_TYPES.includes(extension)) {
      toast.error(t("groups.audioFormat", { list: AUDIO_TYPES.join(", ") }));
      return;
    }
    const file = toUploadFile(picked);
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      toast.error(t("groups.audioTooBig", { size: MAX_AUDIO_MB }));
      return;
    }
    onUpload(file);
  }

  return (
    <View style={[styles.group, { borderColor: ds.c.brand, backgroundColor: ds.c.surface }]}>
      <View style={styles.groupHead}>
        <Icon name="folder" size={20} color={ds.c.brand} />
        <DsText v="title-sm" numberOfLines={1} style={styles.grow}>
          {t("editor.mobile.group", { title: group.title || t("groups.title") })}
        </DsText>
        <Pressable accessibilityRole="button" accessibilityLabel={t("groups.removeAria")} disabled={locked} onPress={onRemove} style={[styles.groupIcon, locked && styles.faded]}>
          <Icon name="trash" size={20} color={ds.c["icon-secondary"]} />
        </Pressable>
      </View>

      {audioUrl ? (
        <GroupAudio src={audioUrl} locked={locked} onRemove={onRemoveAudio} />
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={locked || uploading || !group.id}
          onPress={() => void pickAudio()}
          style={[styles.upload, { borderColor: ds.c.brand }, (locked || uploading || !group.id) && styles.half]}
        >
          <Icon name="upload" size={20} color={ds.c.brand} />
          <DsText v="title-sm" c="brand">
            {group.id ? t("groups.uploadAudio") : t("groups.audioAfterSave")}
          </DsText>
        </Pressable>
      )}

      <View style={styles.scriptToggle}>
        <DsText v="body-sm" style={styles.grow}>
          {t("groups.transcriptToggle")}
        </DsText>
        <Switch size="lg" checked={showScript} onCheckedChange={setShowScript} accessibilityLabel={t("groups.transcriptToggle")} />
      </View>
      {showScript ? (
        <View style={[styles.script, { backgroundColor: ds.c.subtle }]}>
          <DsText v="body-sm" c="ink-secondary">
            {saved?.transcript || t("editor.mobile.noTranscript")}
          </DsText>
        </View>
      ) : null}
      <DsText v="caption" w="400" c="ink-secondary" style={styles.audioHint}>
        {t("editor.mobile.audioHint")}
      </DsText>
    </View>
  );
}

/** Guruh audiosi — `h-16 rounded-lg bg-subtle`: ijro tugmasi, fayl nomi va davomiylik. */
function GroupAudio({ src, locked, onRemove }: { src: string; locked: boolean; onRemove: () => void }) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const player = useAudioPlayer({ uri: src });
  const status = useAudioPlayerStatus(player);
  const fileName = decodeURIComponent(src.split("/").pop()?.split("?")[0] ?? "");

  return (
    <View style={[styles.audio, { backgroundColor: ds.c.subtle }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? t("groups.audioPause") : t("groups.audioPlay")}
        onPress={() => (status.playing ? player.pause() : player.play())}
        style={[styles.play, { backgroundColor: ds.c.brand }]}
      >
        <Icon name={status.playing ? "pause" : "play-fill"} size={20} color={ds.c["on-action"]} />
      </Pressable>
      <View style={styles.grow}>
        <DsText v="title-sm" numberOfLines={1}>
          {fileName}
        </DsText>
        <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1}>
          {formatDuration(status.duration)}
        </DsText>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t("groups.removeAudio")} disabled={locked} onPress={onRemove} style={[styles.groupIcon, locked && styles.faded]}>
        <Icon name="close" size={20} color={ds.c["icon-secondary"]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.4 },
  half: { opacity: 0.5 },
  upper: { textTransform: "uppercase" },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  heading: { flex: 1, minWidth: 0, textAlign: "center" },
  spacer: { width: 44, height: 44 },
  /* `px-4 pb-6` */
  body: { paddingHorizontal: 16, paddingBottom: 24 },
  progress: { marginTop: 14, height: 6, overflow: "hidden", borderRadius: 3 },
  progressFill: { width: "56%", height: "100%", borderRadius: 3 },
  tabs: { marginTop: 16, height: 44, flexDirection: "row", padding: 4, borderRadius: 22 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  list: { marginTop: 16 },
  add: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderStyle: "dashed", borderRadius: dsRadius.xl },
  preview: { marginTop: 14, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, borderWidth: 1.5, borderStyle: "dashed", borderRadius: dsRadius.xl },
  previewNav: { marginTop: 12, height: 20, flexDirection: "row", alignItems: "center", gap: 12 },
  previewTrack: { flex: 1, minWidth: 0, height: 6, overflow: "hidden", borderRadius: 3 },
  previewFill: { height: "100%", borderRadius: 3 },
  previewArrows: { marginVertical: -8, flexDirection: "row" },
  arrow: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  previewBody: { marginTop: 14 },
  previewAnswer: { gap: 12 },
  choices: { marginTop: 15, gap: 12 },
  choice: { height: 52, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, borderRadius: dsRadius.lg },
  choiceLetter: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  draftButton: { flex: 0, paddingHorizontal: 24 },
  group: { padding: 16, borderWidth: 1.5, borderRadius: dsRadius.xl },
  groupHead: { height: 44, flexDirection: "row", alignItems: "center", gap: 10 },
  groupIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  audio: { marginTop: 12, height: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, borderRadius: dsRadius.lg },
  play: { width: 36, height: 36, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  upload: { marginTop: 12, height: 64, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderStyle: "dashed", borderRadius: dsRadius.lg },
  scriptToggle: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  script: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: dsRadius.lg },
  audioHint: { marginTop: 18 },
});
