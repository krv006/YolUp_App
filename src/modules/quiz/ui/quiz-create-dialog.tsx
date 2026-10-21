import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookOpen, Download, FileUp, Link2, Plus, X } from "lucide-react-native";
import { pickDocument, toUploadFile } from "@/shared/lib";
import type { QuizDetail, QuizEditValues, QuizFormValues, QuizImportWarning } from "@/shared/types";
import {
  DateTimeField,
  Input,
  radius,
  Segmented,
  SelectField,
  Sheet,
  SheetButton,
  SheetFooter,
  Text,
  useTheme,
} from "@/shared/ui";
import type { ImportedQuiz } from "../api/quiz.api";
import { detectGoogleSource } from "../lib/google-import";
import {
  createDraft,
  draftToFormValues,
  questionToDraft,
  validateDraft,
  type GroupDraft,
  type QuestionDraft,
} from "../lib/question-draft";
import { useDownloadQuizTemplate, useImportGoogleLink, useImportQuizDocx } from "../model/quiz.queries";
import { QuestionEditor } from "./question-editor";
import { QuestionGroupEditor } from "./question-group-editor";
import { QuizPreview } from "./quiz-preview";

const TEMPLATE_QUESTION_COUNT = 10;

/** `.docx/.xlsx/.json` — Android tanlagichi MIME ni tushunadi. */
const IMPORT_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/json",
];

function warningKey(reason: string): "answerNotDetected" | "notEnoughOptions" | "unsupportedType" {
  if (reason === "answer_not_detected") return "answerNotDetected";
  if (reason === "unsupported_type") return "unsupportedType";
  return "notEnoughOptions";
}

/*
 * Qoralama kalitlari — modul darajasidagi hisoblagich. Vebda `useRef`;
 * bu yerda `useState` boshlagichi render paytida ishlaydi va ref'ga
 * tegib bo'lmaydi (React qoidasi), shuning uchun oddiy hisoblagich.
 */
let keySequence = 0;
function newKey(): string {
  keySequence += 1;
  return `k${keySequence}`;
}

export interface AddQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: QuizFormValues) => void;
  courses: Array<{ id: string; title: string }>;
  subjects?: ReadonlyArray<{ value: string; label: string }>;
  showSchedule?: boolean;
  editQuiz?: QuizDetail | null;
  initialWarnings?: QuizImportWarning[];
  startOnQuestions?: boolean;
  questionsLocked?: boolean;
  saving?: boolean;
  publishing?: boolean;
  publishError?: string | null;
  uploadingAudio?: boolean;
  onUploadAudio?: (groupId: string, file: File) => void;
  onRemoveAudio?: (groupId: string) => void;
  onUpdate?: (values: QuizEditValues) => void;
  onPublish?: () => void;
  onImported?: (result: ImportedQuiz) => void;
}

/**
 * Test yaratish va tahrirlash — veb `modules/quiz/ui/quiz-create-dialog.tsx`
 * porti. Ikki bosqich, vebdagidek:
 *
 *   details    pastdan chiquvchi oyna: fan, mavzu, nom (tahrirda —
 *              muddatlar), import va shablonlar; "Davom etish"
 *   questions  to'liq ekran: sarlavha, "Tahrirlash / O'quvchi ko'radi",
 *              ogohlantirishlar, savollar guruhi, savollar va pastda
 *              saqlash / e'lon qilish tugmalari
 *
 * Vebdan farqlari:
 *   · nom maydonidagi "mavjud testlardan nusxa olish" taklifi yo'q —
 *     Testlar sahifasi uni vebda ham bermaydi (`existingQuizzes` bo'sh);
 *   · telefondagi "Qoralama saqlash" vebda qoralama sifatida emas, oddiy
 *     saqlash sifatida yuboriladi (tugmada belgi qo'yilmagan). Bu yerda
 *     yorliqqa mos ravishda QORALAMA sifatida saqlanadi.
 */
export function AddQuizDialog({
  open,
  onOpenChange,
  onCreate,
  courses,
  subjects,
  showSchedule = false,
  editQuiz = null,
  initialWarnings = [],
  startOnQuestions = false,
  questionsLocked = false,
  saving = false,
  publishing = false,
  publishError = null,
  uploadingAudio = false,
  onUploadAudio,
  onRemoveAudio,
  onUpdate,
  onPublish,
  onImported,
}: AddQuizDialogProps) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<"details" | "questions">(startOnQuestions ? "questions" : "details");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const subjectMode = Boolean(subjects);
  const courseId = subjectMode ? "" : selectedCourseId || courses[0]?.id || "";
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState(editQuiz?.title ?? "");
  const [topic, setTopic] = useState(editQuiz?.topic ?? "");
  const [dueAt, setDueAt] = useState(editQuiz?.dueAt ?? "");
  const [opensAt, setOpensAt] = useState(editQuiz?.opensAt ?? "");
  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    editQuiz ? editQuiz.questions.map((question) => questionToDraft(question, newKey)) : []
  );
  const [groups, setGroups] = useState<GroupDraft[]>(() =>
    (editQuiz?.groups ?? []).map((group) => ({
      key: group.id,
      id: group.id,
      title: group.title,
      passage: group.passage,
    }))
  );
  const [error, setError] = useState<string | null>(null);
  const [dirtyCount, setDirtyCount] = useState(0);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [answerWarningOpen, setAnswerWarningOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [fieldErrors, setFieldErrors] = useState<{ target?: string; topic?: string }>({});
  const [importWarnings, setImportWarnings] = useState<QuizImportWarning[]>(initialWarnings);
  const importFile = useImportQuizDocx();
  const importGoogle = useImportGoogleLink();
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleUrl, setGoogleUrl] = useState("");
  const downloadTemplate = useDownloadQuizTemplate();
  const listRef = useRef<FlatList<QuestionDraft>>(null);

  const missingAnswerWarnings = importWarnings.filter((warning) => warning.reason === "answer_not_detected");
  const allAnswersMissing = questions.length > 0 && missingAnswerWarnings.length >= questions.length;
  const listedWarnings = allAnswersMissing
    ? importWarnings.filter((warning) => warning.reason !== "answer_not_detected")
    : importWarnings;

  const editing = Boolean(editQuiz);
  const isDraft = editQuiz?.status === "draft";

  function importRequest() {
    return {
      topic: topic.trim(),
      courseId: subjectMode ? null : courseId,
      subject: subjectMode ? subject : undefined,
      title: title.trim(),
    };
  }

  function applyImported(result: ImportedQuiz) {
    setGoogleOpen(false);
    setGoogleUrl("");
    setError(null);
    onImported?.(result);
    reset();
    onOpenChange(false);
  }

  async function handleImportFile() {
    const missingTarget = targetError();
    if (missingTarget) {
      setError(missingTarget);
      return;
    }
    const picked = await pickDocument(IMPORT_MIME_TYPES);
    if (!picked) return;
    importFile.mutate({ file: toUploadFile(picked), request: importRequest() }, { onSuccess: applyImported });
  }

  function handleImportGoogle() {
    const missingTarget = targetError();
    if (missingTarget) {
      setError(missingTarget);
      return;
    }
    const source = detectGoogleSource(googleUrl);
    if (!source) {
      setError(t("createDialog.googleLinkInvalid"));
      return;
    }
    importGoogle.mutate({ source, url: googleUrl.trim(), request: importRequest() }, { onSuccess: applyImported });
  }

  function newQuestion(type: QuestionDraft["type"] = "single") {
    return createDraft(type, newKey);
  }

  function reset() {
    setStep("details");
    setSelectedCourseId("");
    setSubject("");
    setTitle("");
    setTopic("");
    setDueAt("");
    setOpensAt("");
    setQuestions([]);
    setImportWarnings([]);
    setGoogleOpen(false);
    setGoogleUrl("");
    setError(null);
  }

  function targetError(): string | null {
    if (!editing && subjectMode && !subject) return t("createDialog.validation.chooseSubject");
    if (!editing && !subjectMode && !courseId) return t("createDialog.validation.chooseCourse");
    return topic.trim() ? null : t("createDialog.validation.enterTopic");
  }

  function goToQuestions() {
    const next: { target?: string; topic?: string } = {};
    if (!editing && subjectMode && !subject) next.target = t("createDialog.validation.chooseSubject");
    if (!editing && !subjectMode && !courseId) next.target = t("createDialog.validation.chooseCourse");
    if (!topic.trim()) next.topic = t("createDialog.validation.enterTopicOrImport");
    setFieldErrors(next);
    if (next.target || next.topic) return;
    setError(null);
    if (!questions.length) setQuestions([newQuestion()]);
    setStep("questions");
  }

  function markDirty() {
    setDirtyCount((count) => count + 1);
  }

  function addQuestion() {
    markDirty();
    setQuestions((current) => [...current, newQuestion(current[current.length - 1]?.type)]);
  }

  function removeQuestion(questionKey: string) {
    markDirty();
    setQuestions((current) => current.filter((question) => question.key !== questionKey));
  }

  function updateQuestion(questionKey: string, update: (draft: QuestionDraft) => QuestionDraft) {
    markDirty();
    setQuestions((current) => current.map((question) => (question.key === questionKey ? update(question) : question)));
  }

  const missingAnswerNumbers = questions
    .map((question, index) => (validateDraft(question) ? index + 1 : 0))
    .filter((number, index) => number > 0 && Boolean(validateDraft(questions[index])));

  function validate(asDraft: boolean): string | null {
    const missingTarget = targetError();
    if (missingTarget) return missingTarget;
    if (questionsLocked) return null;
    if (!questions.length) return t("createDialog.validation.addQuestion");
    for (const [index, question] of questions.entries()) {
      const draftError = validateDraft(question, { allowMissingAnswer: asDraft });
      if (draftError) {
        return t("createDialog.validation.questionPrefix", {
          number: index + 1,
          message: t(`createDialog.validation.${draftError}`, {
            syntax: `{{${t("editor.blankWord")}}}`,
            interpolation: { escapeValue: false },
          }),
          interpolation: { escapeValue: false },
        });
      }
    }
    return null;
  }

  function groupsPayload() {
    return groups.map((group) => ({
      ...(group.id ? { id: group.id } : {}),
      title: group.title.trim(),
      passage: group.passage.trim(),
    }));
  }

  function questionsPayload() {
    return questions.map((question) => {
      const index = groups.findIndex((group) => group.key === question.groupKey);
      return draftToFormValues(question, index >= 0 ? index : null);
    });
  }

  function submit(asDraft = false) {
    setDirtyCount(0);
    const validationError = validate(asDraft || isDraft);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (editing) {
      onUpdate?.({
        topic: topic.trim(),
        title: title.trim(),
        dueAt: dueAt || null,
        opensAt: opensAt || null,
        groups: groupsPayload(),
        ...(questionsLocked ? {} : { questions: questionsPayload() }),
      });
      return;
    }
    onCreate({
      courseId,
      subject: subjectMode ? subject : undefined,
      status: asDraft ? "draft" : undefined,
      lessonId: null,
      title: title.trim(),
      topic: topic.trim(),
      description: "",
      dueAt: dueAt || null,
      opensAt: opensAt || null,
      groups: groupsPayload(),
      questions: questionsPayload(),
    });
    reset();
    onOpenChange(false);
  }

  function publish() {
    if (missingAnswerNumbers.length) {
      setAnswerWarningOpen(true);
      return;
    }
    onPublish?.();
  }

  function requestClose() {
    if (dirtyCount > 0) {
      setCloseConfirmOpen(true);
      return;
    }
    reset();
    onOpenChange(false);
  }

  if (!open) return null;

  if (step === "questions") {
    // Ogohlantirishlar foni — vebdagi `bg-saffron-subtle`.
    const notice = palette["saffron-soft"];
    const noticeMark = palette["saffron-strong"];

    const header = (
      <View style={styles.listHeader}>
        {error ? <ErrorBox text={error} /> : null}
        {publishError ? <ErrorBox text={publishError} /> : null}
        {isDraft ? (
          <View style={[styles.notice, styles.noticeRow, { backgroundColor: notice }]}>
            <Text variant="label" style={[styles.bodySm, { color: noticeMark }]}>
              i
            </Text>
            <Text variant="label" style={[styles.bodySm, styles.grow]}>
              {t("editDialog.draftNotice")}
            </Text>
          </View>
        ) : null}
        {importWarnings.length ? (
          <View style={[styles.notice, styles.noticeColumn, { backgroundColor: notice }]}>
            {allAnswersMissing ? (
              <Text variant="label" style={styles.bodySm}>
                {t("createDialog.importWarningAllAnswersMissing")}
              </Text>
            ) : null}
            {listedWarnings.map((warning) => (
              <Text key={`${warning.questionNumber}-${warning.reason}`} variant="label" style={styles.bodySm}>
                {t(`createDialog.importWarning.${warningKey(warning.reason)}`, { number: warning.questionNumber })}
              </Text>
            ))}
          </View>
        ) : null}
        {questionsLocked ? (
          <View style={[styles.notice, { backgroundColor: notice }]}>
            <Text variant="label" style={styles.bodySm}>
              {t("editDialog.lockedNotice")}
            </Text>
          </View>
        ) : null}

        <QuestionGroupEditor
          groups={groups}
          savedGroups={editQuiz?.groups ?? []}
          uploading={Boolean(uploadingAudio)}
          onChange={(next) => {
            markDirty();
            setGroups(next);
          }}
          onUploadAudio={onUploadAudio}
          onRemoveAudio={onRemoveAudio}
        />
      </View>
    );

    const footer = questionsLocked ? null : (
      <Pressable
        accessibilityRole="button"
        onPress={addQuestion}
        style={({ pressed }) => [
          styles.addQuestion,
          { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : "transparent" },
        ]}
      >
        <Plus size={16} color={palette["muted-foreground"]} />
        <Text variant="label" style={{ color: palette["muted-foreground"] }}>
          {t("createDialog.addQuestion")}
        </Text>
      </Pressable>
    );

    return (
      <Modal visible animationType="slide" onRequestClose={requestClose}>
        <KeyboardAvoidingView
          behavior="padding"
          style={[styles.page, { backgroundColor: palette.background, paddingTop: insets.top }]}
        >
          {/* `h-16 border-b bg-surface px-4 gap-3` */}
          <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
            <View style={styles.grow}>
              <Text variant="subheading" numberOfLines={1}>
                {questionsLocked
                  ? t("editDialog.lockedPageTitle")
                  : editing
                    ? t("editDialog.questionsPageTitle")
                    : t("createDialog.questionsPageTitle")}
              </Text>
              <Text variant="caption" numberOfLines={1} style={{ color: palette["subtle-foreground"] }}>
                {[
                  title.trim() || topic.trim(),
                  isDraft ? t("teacherPage.draftBadge") : "",
                  t("teacherPage.questionCount", { count: questions.length }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("createDialog.cancel")}
              onPress={requestClose}
              style={({ pressed }) => [styles.close, pressed && { backgroundColor: palette["surface-subtle"] }]}
            >
              <X size={19} color={palette["muted-foreground"]} />
            </Pressable>
          </View>

          <View style={styles.tabs}>
            <Segmented
              label={t("createDialog.questionsPageTitle")}
              value={mobileTab}
              onChange={setMobileTab}
              options={(["edit", "preview"] as const).map((item) => ({
                value: item,
                label: t(`createDialog.tab.${item}`),
              }))}
            />
          </View>

          {mobileTab === "edit" ? (
            <FlatList
              ref={listRef}
              data={questionsLocked ? [] : questions}
              keyExtractor={(item) => item.key}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.body}
              ListHeaderComponent={header}
              ListFooterComponent={footer}
              ItemSeparatorComponent={Separator}
              onScrollToIndexFailed={(info) =>
                listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true })
              }
              renderItem={({ item, index }) => (
                <QuestionEditor
                  draft={item}
                  groups={groups}
                  index={index}
                  canRemove={questions.length > 1}
                  newKey={newKey}
                  onChange={(update) => updateQuestion(item.key, update)}
                  onRemove={() => removeQuestion(item.key)}
                />
              )}
            />
          ) : (
            <ScrollView contentContainerStyle={styles.body}>
              <QuizPreview title={title} questions={questions} />
            </ScrollView>
          )}

          {/* `border-t bg-surface px-4 py-3 gap-3` */}
          <View
            style={[
              styles.footer,
              {
                backgroundColor: palette.surface,
                borderTopColor: palette.border,
                paddingBottom: 12 + insets.bottom,
              },
            ]}
          >
            <SheetButton
              title={editing ? t("editDialog.save") : t("createDialog.saveDraft")}
              disabled={saving}
              onPress={() => submit(!editing)}
            />
            {isDraft ? (
              <SheetButton
                variant="primary"
                title={t("editDialog.publish")}
                disabled={publishing}
                loading={publishing}
                onPress={publish}
              />
            ) : (
              <SheetButton
                variant="primary"
                title={editing ? t("editDialog.save") : t("createDialog.create")}
                disabled={saving}
                loading={saving}
                onPress={() => submit(false)}
              />
            )}
          </View>

          <Sheet
            open={closeConfirmOpen}
            onClose={() => setCloseConfirmOpen(false)}
            title={t("createDialog.unsavedTitle")}
            description={t("createDialog.unsavedDescription", { count: dirtyCount })}
          >
            <SheetFooter>
              <SheetButton title={t("createDialog.unsavedStay")} onPress={() => setCloseConfirmOpen(false)} />
              <SheetButton
                variant="danger"
                title={t("createDialog.unsavedLeave")}
                onPress={() => {
                  setCloseConfirmOpen(false);
                  reset();
                  onOpenChange(false);
                }}
              />
            </SheetFooter>
          </Sheet>

          <Sheet
            open={answerWarningOpen}
            onClose={() => setAnswerWarningOpen(false)}
            title={t("createDialog.missingAnswersTitle", { count: missingAnswerNumbers.length })}
            description={t("createDialog.missingAnswersDescription", {
              count: missingAnswerNumbers.length,
              list: missingAnswerNumbers.join(", "),
            })}
          >
            <SheetFooter>
              <SheetButton title={t("createDialog.missingAnswersLater")} onPress={() => setAnswerWarningOpen(false)} />
              <SheetButton
                variant="primary"
                title={t("createDialog.missingAnswersGo")}
                onPress={() => {
                  setAnswerWarningOpen(false);
                  const first = missingAnswerNumbers[0];
                  if (!first) return;
                  setMobileTab("edit");
                  listRef.current?.scrollToIndex({ index: first - 1, viewPosition: 0.5 });
                }}
              />
            </SheetFooter>
          </Sheet>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  const importing = importFile.isPending;

  return (
    <Sheet
      open={open}
      onClose={() => onOpenChange(false)}
      title={editing ? t("editDialog.title") : t("createDialog.title")}
      description={editing ? t("editDialog.description") : t("createDialog.description")}
    >
      <View style={styles.details}>
        {editing ? null : subjects ? (
          <View style={styles.fieldWithError}>
            <SelectField
              label={t("createDialog.subjectLabel")}
              icon={<BookOpen size={17} color={palette["subtle-foreground"]} />}
              searchable
              value={subject}
              onChange={(value) => {
                setSubject(value);
                setError(null);
                setFieldErrors((current) => ({ ...current, target: undefined }));
              }}
              options={subjects.map((item) => ({ value: item.value, label: item.label }))}
            />
            {fieldErrors.target ? <FieldError text={fieldErrors.target} /> : null}
          </View>
        ) : courses.length > 1 ? (
          <SelectField
            label={t("createDialog.courseLabel")}
            icon={<BookOpen size={17} color={palette["subtle-foreground"]} />}
            value={courseId}
            onChange={(value) => setSelectedCourseId(value)}
            options={courses.map((course) => ({ value: course.id, label: course.title }))}
          />
        ) : null}

        <View style={styles.fieldWithError}>
          <Input
            label={t("createDialog.topicLabel")}
            value={topic}
            onChangeText={(value) => {
              setTopic(value);
              setError(null);
              setFieldErrors((current) => ({ ...current, topic: undefined }));
            }}
            placeholder={t("createDialog.topicPlaceholder")}
            autoCapitalize="sentences"
          />
          {fieldErrors.topic ? <FieldError text={fieldErrors.topic} /> : null}
        </View>

        <Input
          label={t("createDialog.titleLabel")}
          value={title}
          onChangeText={setTitle}
          placeholder={t("createDialog.titlePlaceholder")}
          autoCapitalize="sentences"
        />

        {showSchedule ? (
          <>
            <DateTimeField label={t("createDialog.dueLabel")} value={dueAt} onChange={setDueAt} optional />
            <DateTimeField label={t("createDialog.opensLabel")} value={opensAt} onChange={setOpensAt} optional />
          </>
        ) : null}

        {editing ? null : (
          <>
            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: palette.border }]} />
              <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                {t("createDialog.importOr")}
              </Text>
              <View style={[styles.line, { backgroundColor: palette.border }]} />
            </View>

            <ImportButton
              icon={<FileUp size={17} color={palette.foreground} />}
              label={importing ? t("createDialog.importButtonLoading") : t("createDialog.importButton")}
              disabled={importing}
              onPress={() => void handleImportFile()}
            />
            <ImportButton
              icon={<Link2 size={17} color={googleOpen ? palette.primary : palette.foreground} />}
              label={t("createDialog.googleImportButton")}
              active={googleOpen}
              onPress={() => {
                setGoogleOpen((current) => !current);
                setError(null);
              }}
            />

            {googleOpen ? (
              <View style={[styles.google, { borderColor: palette.border, backgroundColor: palette.background }]}>
                <TextInput
                  autoFocus
                  value={googleUrl}
                  onChangeText={(value) => {
                    setGoogleUrl(value);
                    setError(null);
                  }}
                  onSubmitEditing={handleImportGoogle}
                  placeholder={t("createDialog.googleLinkPlaceholder")}
                  placeholderTextColor={palette["subtle-foreground"]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={[
                    styles.googleInput,
                    { borderColor: palette.border, backgroundColor: palette.surface, color: palette.foreground },
                  ]}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={importGoogle.isPending || !googleUrl.trim()}
                  onPress={handleImportGoogle}
                  style={({ pressed }) => [
                    styles.googleSubmit,
                    {
                      backgroundColor: pressed ? palette["primary-hover"] : palette.primary,
                      opacity: importGoogle.isPending || !googleUrl.trim() ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text variant="label" style={{ color: palette["primary-foreground"] }}>
                    {importGoogle.isPending
                      ? t("createDialog.importButtonLoading")
                      : t("createDialog.googleImportSubmit")}
                  </Text>
                </Pressable>
                <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                  {t("createDialog.googleShareHint")}
                </Text>
              </View>
            ) : null}

            <View style={[styles.templates, { backgroundColor: palette["surface-subtle"] }]}>
              <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
                {t("createDialog.downloadTemplateLabel")}
              </Text>
              <View style={styles.templateRow}>
                <ImportButton
                  icon={<Download size={16} color={palette.foreground} />}
                  label={t("createDialog.downloadTemplateWord")}
                  disabled={downloadTemplate.isPending}
                  onPress={() => downloadTemplate.mutate({ type: "docx", count: TEMPLATE_QUESTION_COUNT })}
                  grow
                />
                <ImportButton
                  icon={<Download size={16} color={palette.foreground} />}
                  label={t("createDialog.downloadTemplateExcel")}
                  disabled={downloadTemplate.isPending}
                  onPress={() => downloadTemplate.mutate({ type: "xlsx", count: TEMPLATE_QUESTION_COUNT })}
                  grow
                />
              </View>
            </View>
          </>
        )}

        {error ? <ErrorBox text={error} /> : null}
      </View>

      <SheetFooter>
        <SheetButton title={t("createDialog.cancel")} onPress={() => onOpenChange(false)} />
        <SheetButton
          variant="primary"
          title={editing ? t("editDialog.continueButton") : t("createDialog.continueButton")}
          onPress={goToQuestions}
        />
      </SheetFooter>
    </Sheet>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

/** `rounded-xl bg-error-bg px-4 py-3 text-body-sm text-error-text` */
function ErrorBox({ text }: { text: string }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.notice, { backgroundColor: palette["destructive-soft"] }]}>
      <Text variant="label" style={[styles.bodySm, { color: palette["destructive-strong"] }]}>
        {text}
      </Text>
    </View>
  );
}

function FieldError({ text }: { text: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.fieldError}>
      <X size={13} color={palette["destructive-strong"]} />
      <Text variant="caption" style={{ color: palette["destructive-strong"] }}>
        {text}
      </Text>
    </View>
  );
}

/** `h-12 rounded-xl border bg-surface px-4 gap-2 text-label-strong` */
function ImportButton({
  icon,
  label,
  onPress,
  disabled = false,
  active = false,
  grow = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  grow?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, expanded: active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.importButton,
        grow && styles.grow,
        {
          borderColor: active ? palette.primary : palette.border,
          backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {icon}
      <Text variant="label" style={{ color: active ? palette.primary : palette.foreground }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  bodySm: { fontWeight: "400" },

  page: { flex: 1 },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  close: { width: 44, height: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  /* `mx-4 mt-3` */
  tabs: { marginHorizontal: 16, marginTop: 12 },
  /* `flex-col gap-4 p-4` */
  body: { padding: 16 },
  listHeader: { gap: 16, marginBottom: 16 },
  separator: { height: 16 },
  /* `rounded-xl px-4 py-3 text-body-sm` (qoralama ogohlantirishi radius 20) */
  notice: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.xl },
  noticeRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  noticeColumn: { gap: 4 },
  /* `h-12 rounded-xl border border-dashed` */
  addQuestion: {
    marginTop: 16,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.xl,
  },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },

  /* Birinchi bosqich — `flex-col gap-4` */
  details: { gap: 16 },
  fieldWithError: { gap: 6 },
  fieldError: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  line: { flex: 1, height: 1 },
  importButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  /* `rounded-xl border bg-canvas p-3 gap-2` */
  google: { gap: 8, padding: 12, borderWidth: 1, borderRadius: radius.xl },
  googleInput: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.sm,
    fontSize: 14,
    fontFamily: "Onest-Regular",
  },
  googleSubmit: { height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  /* `rounded-xl bg-subtle p-3 gap-2`, ichida 2 ustun */
  templates: { gap: 8, padding: 12, borderRadius: radius.xl },
  templateRow: { flexDirection: "row", gap: 8 },
});
