import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { BookOpen, CircleAlert, FileText, FileUp, GraduationCap, Library, Minus, Plus, Sparkles, Users, X } from "lucide-react-native";
import { pickDocument, pickDocuments, toUploadFile, type PickedFile } from "@/shared/lib";
import { Input, radius, SelectField, Text, useTheme } from "@/shared/ui";
import type { AiQuizJob, AiQuizStandard } from "../api/quiz.dto";
import { useAiQuizJobs, useStartAiQuiz } from "../model/quiz.queries";
import { useQuizColors } from "./quiz-colors";

/** Vebdagi `accept=".pdf,.docx,.pptx,.xlsx,.xlsm,.csv,.txt,.md"` ning MIME ko'rinishi. */
const MATERIAL_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
  "text/csv",
  "text/plain",
  "text/markdown",
];
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 60;
const MAX_FILE_MB = 20;
const MAX_FILES = 5;
const MAX_TOTAL_MB = 40;
const MAX_MATERIAL_TEXT = 120000;
const MAX_RULES_MB = 5;
const MAX_RULES_TEXT = 30000;
const ACTIVE = ["queued", "processing", "generating"];
const EXAM_OPTIONS = [
  "IELTS Academic Reading",
  "IELTS General Training Reading",
  "IELTS Listening",
  "IELTS Writing",
  "SAT Reading and Writing",
  "SAT Math",
  "TOEFL iBT Reading",
  "Cambridge B2 First (FCE) Reading",
  "CEFR B1",
  "Milliy sertifikat (matematika)",
  "DTM test",
];
const EXAM_SIMPLE = "simple";
const EXAM_OTHER = "other";
const NO_GROUP = "none";
const NO_BANK = "none";

export interface AiQuizCreatorProps {
  subjects: ReadonlyArray<{ value: string; label: string }>;
  courses?: ReadonlyArray<{ id: string; title: string }>;
  /** `?exam=IELTS Listening` kabi havoladan kelgan imtihon (mock yaratish oynasidan). */
  initialExam?: string | null;
  onOpenQuiz: (quizId: string) => void;
}

/**
 * AI bilan test yaratish — veb `modules/quiz/ui/ai-quiz-creator.tsx` porti.
 * Mantiq (cheklovlar, tekshiruvlar, so'rov) vebdagi bilan bir xil; fayllar
 * `expo-document-picker` bilan tanlanadi. Uslublar `.ai-quiz*` (legacy.css
 * va form-skin.css) dan.
 */
export function AiQuizCreator({ subjects, courses = [], initialExam = null, onOpenQuiz }: AiQuizCreatorProps) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const colors = useQuizColors();
  const [subject, setSubject] = useState("");
  const [courseId, setCourseId] = useState(NO_GROUP);
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [materialText, setMaterialText] = useState("");
  const [examChoice, setExamChoice] = useState(() =>
    initialExam && EXAM_OPTIONS.includes(initialExam) ? initialExam : EXAM_SIMPLE
  );
  const [customExam, setCustomExam] = useState("");
  const [level, setLevel] = useState("");
  const [rulesFile, setRulesFile] = useState<PickedFile | null>(null);
  const [rulesText, setRulesText] = useState("");
  const [count, setCount] = useState(20);
  const [bank, setBank] = useState(NO_BANK);
  const [error, setError] = useState<string | null>(null);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const start = useStartAiQuiz();
  const useBank = bank !== NO_BANK;
  const isSimple = examChoice === EXAM_SIMPLE;
  const examName = isSimple ? "" : examChoice === EXAM_OTHER ? customExam.trim() : examChoice;
  const isIelts = /ielts/i.test(examName);
  const jobs = useAiQuizJobs();
  const iconColor = palette["subtle-foreground"];

  async function pickMaterial() {
    const picked = await pickDocuments(MATERIAL_MIME);
    if (!picked.length) return;
    const big = picked.find((item) => item.size > MAX_FILE_MB * 1024 * 1024);
    if (big) {
      return setError(t("aiPage.fileTooLarge", { size: (big.size / 1024 / 1024).toFixed(1), max: MAX_FILE_MB }));
    }
    const known = new Set(files.map((item) => `${item.name}:${item.size}`));
    const merged = [...files, ...picked.filter((item) => !known.has(`${item.name}:${item.size}`))];
    if (merged.length > MAX_FILES) return setError(t("aiPage.tooManyFiles", { max: MAX_FILES }));
    if (merged.reduce((sum, item) => sum + item.size, 0) > MAX_TOTAL_MB * 1024 * 1024) {
      return setError(t("aiPage.totalTooLarge", { max: MAX_TOTAL_MB }));
    }
    setError(null);
    setFiles(merged);
  }

  async function pickRules() {
    const picked = await pickDocument(MATERIAL_MIME);
    if (!picked) return;
    if (picked.size > MAX_RULES_MB * 1024 * 1024) {
      setError(t("aiPage.rulesTooLarge", { size: (picked.size / 1024 / 1024).toFixed(1), max: MAX_RULES_MB }));
      return;
    }
    setError(null);
    setRulesFile(picked);
  }

  function submit() {
    if (courseId === NO_GROUP && !subject) return setError(t("aiPage.chooseSubject"));
    if (!topic.trim()) return setError(t("aiPage.enterTopic"));
    if (useBank && files.length !== 1) return setError(t("aiPage.bankNeedsOneFile"));
    if (!useBank && examChoice === EXAM_OTHER && !examName) return setError(t("aiPage.enterExam"));
    if ((isSimple || useBank) && !(count >= MIN_QUESTIONS && count <= MAX_QUESTIONS)) {
      return setError(t("aiPage.countRange", { min: MIN_QUESTIONS, max: MAX_QUESTIONS }));
    }
    setError(null);
    start.mutate(
      {
        files: files.map(toUploadFile),
        request: {
          topic: isIelts && level ? `${topic.trim()} · ${t("aiPage.levelTopic", { band: level })}` : topic.trim(),
          courseId: courseId === NO_GROUP ? null : courseId,
          subject: courseId === NO_GROUP ? subject : undefined,
          title: title.trim(),
          standard: useBank ? (bank as AiQuizStandard) : undefined,
          questionCount: isSimple || useBank ? count : 0,
          rulesFile: useBank || !rulesFile ? null : toUploadFile(rulesFile),
          rulesText: useBank ? "" : rulesText.trim(),
          materialText: useBank ? "" : materialText.trim(),
          examName: useBank ? "" : examName,
        },
      },
      {
        onSuccess: () => {
          setTopic("");
          setTitle("");
          setFiles([]);
          setMaterialText("");
          setCustomExam("");
          setLevel("");
          setRulesFile(null);
          setRulesText("");
        },
      }
    );
  }

  const textArea = (value: string, onChange: (value: string) => void, placeholder: string, maxLength: number) => (
    <Input value={value} onChangeText={onChange} placeholder={placeholder} multiline numberOfLines={4} maxLength={maxLength} />
  );

  return (
    <View style={styles.root}>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: palette.surface }]}>
        <View style={styles.head}>
          <View style={[styles.headIcon, { backgroundColor: palette["primary-soft"] }]}>
            <Sparkles size={19} color={palette["primary-text"]} />
          </View>
          <View style={styles.grow}>
            <Text variant="body" style={[styles.h2, { color: colors.foreground }]}>
              {t("aiPage.title")}
            </Text>
            <Text variant="caption" style={[styles.headText, { color: colors.muted }]}>
              {t("aiPage.description")}
            </Text>
          </View>
        </View>

        {courses.length ? (
          <SelectField
            label={t("aiPage.groupLabel")}
            icon={<Users size={17} color={iconColor} />}
            searchable
            value={courseId}
            onChange={(value) => {
              setCourseId(value);
              setError(null);
            }}
            options={[{ value: NO_GROUP, label: t("aiPage.noGroup") }, ...courses.map((item) => ({ value: item.id, label: item.title }))]}
          />
        ) : null}

        {courseId === NO_GROUP ? (
          <SelectField
            label={t("aiPage.subjectLabel")}
            icon={<BookOpen size={17} color={iconColor} />}
            searchable
            value={subject}
            onChange={(value) => {
              setSubject(value);
              setError(null);
            }}
            options={subjects.map((item) => ({ value: item.value, label: item.label }))}
          />
        ) : (
          <Hint>{t("aiPage.groupHint")}</Hint>
        )}

        <View style={styles.field}>
          <Text variant="caption" style={[styles.topicLabel, { color: colors.foreground }]}>
            {t("aiPage.topicLabel")}
          </Text>
          <Input
            value={topic}
            onChangeText={(value) => {
              setTopic(value);
              setError(null);
            }}
            placeholder={t("aiPage.topicPlaceholder")}
            autoCapitalize="sentences"
          />
        </View>

        <SelectField
          label={t("aiPage.examLabel")}
          icon={<GraduationCap size={17} color={iconColor} />}
          searchable
          value={examChoice}
          onChange={(value) => {
            setExamChoice(value);
            setError(null);
          }}
          options={[
            { value: EXAM_SIMPLE, label: t("aiPage.examSimple") },
            ...EXAM_OPTIONS.map((name) => ({ value: name, label: name })),
            { value: EXAM_OTHER, label: t("aiPage.examOther") },
          ]}
        />
        {examChoice === EXAM_OTHER ? (
          <Input value={customExam} maxLength={120} onChangeText={setCustomExam} placeholder={t("aiPage.examPlaceholder")} />
        ) : null}
        <Hint>{isSimple ? t("aiPage.examSimpleHint") : t("aiPage.examHint")}</Hint>
        {isIelts ? (
          <SelectField
            label={t("aiPage.levelLabel")}
            icon={<GraduationCap size={17} color={iconColor} />}
            value={level}
            onChange={setLevel}
            options={[
              { value: "", label: t("aiPage.levelAny") },
              { value: "5.5", label: "Band 5.0 – 5.5" },
              { value: "6.5", label: "Band 6.0 – 6.5" },
              { value: "7.5", label: "Band 7.0 – 7.5" },
              { value: "8.5", label: "Band 8.0+" },
            ]}
          />
        ) : null}

        {/* Material — `.ai-quiz-dropzone` */}
        <View style={styles.field}>
          <Text variant="caption" style={[styles.fieldLabel, { color: colors.foreground }]}>
            {t("aiPage.materialLabel")}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void pickMaterial()}
            style={({ pressed }) => [styles.dropzone, { backgroundColor: pressed ? palette.muted : palette["surface-subtle"] }]}
          >
            <View style={[styles.dropIcon, { backgroundColor: palette.primary }]}>
              <FileUp size={18} color={palette["primary-foreground"]} />
            </View>
            <Text variant="caption" style={[styles.dropTitle, { color: palette.primary }]}>
              {files.length === 0 ? t("aiPage.chooseFiles") : t("aiPage.addMoreFiles")}
            </Text>
            <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
              {t("aiPage.fileHintShort")}
            </Text>
          </Pressable>
          {files.map((item, index) => (
            <View
              key={`${item.name}-${item.size}`}
              style={[styles.file, { borderColor: palette["border-accent"], backgroundColor: palette["primary-tint"] }]}
            >
              <FileText size={13} color={colors.foreground} />
              <Text variant="caption" numberOfLines={1} style={[styles.fileName, { color: colors.foreground }]}>
                {item.name}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("aiPage.removeFile", { name: item.name })}
                onPress={() => {
                  setFiles((current) => current.filter((_, position) => position !== index));
                  setError(null);
                }}
                hitSlop={8}
              >
                <X size={13} color={colors.muted} />
              </Pressable>
            </View>
          ))}
          {files.length ? (
            <Text variant="caption" style={[styles.right, { color: palette["subtle-foreground"] }]}>
              {t("aiPage.fileCount", { count: files.length, max: MAX_FILES })}
            </Text>
          ) : null}
        </View>

        {isSimple || useBank ? (
          <View style={styles.field}>
            <Text variant="caption" style={[styles.fieldLabel, { color: colors.foreground }]}>
              {t("aiPage.countLabel")}
            </Text>
            {/* `.ai-quiz-stepper` — kulrang yo'lak, 36x36 tugmalar */}
            <View style={[styles.stepper, { backgroundColor: palette["surface-subtle"] }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("aiPage.countDecrease")}
                disabled={count <= MIN_QUESTIONS}
                onPress={() => setCount(Math.max(MIN_QUESTIONS, count - 1))}
                style={[styles.stepButton, count <= MIN_QUESTIONS && styles.disabled]}
              >
                <Minus size={17} color={palette["muted-foreground"]} />
              </Pressable>
              <TextInput
                value={String(count)}
                keyboardType="number-pad"
                accessibilityLabel={t("aiPage.countLabel")}
                onChangeText={(value) => setCount(Number(value))}
                style={[styles.stepInput, { color: colors.foreground }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("aiPage.countIncrease")}
                disabled={count >= MAX_QUESTIONS}
                onPress={() => setCount(Math.min(MAX_QUESTIONS, count + 1))}
                style={[styles.stepButton, count >= MAX_QUESTIONS && styles.disabled]}
              >
                <Plus size={17} color={palette["muted-foreground"]} />
              </Pressable>
            </View>
            <Text variant="caption" style={{ color: colors.muted }}>
              {t("aiPage.countHint")}
            </Text>
          </View>
        ) : null}

        <Details label={t("aiPage.materialTextToggle")} open={materialOpen || Boolean(materialText.trim())} onToggle={() => setMaterialOpen((v) => !v)}>
          <View style={styles.field}>
            <Text variant="caption" style={[styles.fieldLabel, { color: colors.foreground }]}>
              {t("aiPage.materialTextLabel")}
            </Text>
            {textArea(materialText, setMaterialText, t("aiPage.materialTextPlaceholder"), MAX_MATERIAL_TEXT)}
            <Text variant="caption" style={{ color: colors.muted }}>
              {t("aiPage.materialOptionalHint")}
            </Text>
          </View>
        </Details>

        <Details
          label={t("aiPage.extraToggle")}
          open={extraOpen || Boolean(title.trim() || rulesFile || rulesText.trim() || useBank)}
          onToggle={() => setExtraOpen((v) => !v)}
        >
          <View style={styles.extra}>
            <SelectField
              label={t("aiPage.bankLabel")}
              icon={<Library size={17} color={iconColor} />}
              value={bank}
              onChange={(value) => {
                setBank(value);
                setError(null);
              }}
              options={[
                { value: NO_BANK, label: t("aiPage.bankNone") },
                { value: "uzbmb", label: "UZBMB" },
                { value: "ielts", label: "IELTS Academic" },
                { value: "sat", label: "Digital SAT" },
              ]}
            />
            {useBank ? <Hint>{t("aiPage.bankHint")}</Hint> : null}
            <View style={styles.field}>
              <Text variant="caption" style={[styles.topicLabel, { color: colors.foreground }]}>
                {t("aiPage.titleLabel")}
              </Text>
              <Input value={title} onChangeText={setTitle} placeholder={t("aiPage.titlePlaceholder")} />
            </View>
            <View style={styles.field}>
              <Text variant="caption" style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t("aiPage.rulesLabel")}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void pickRules()}
                style={[
                  styles.ghost,
                  rulesFile
                    ? { borderColor: palette.primary, backgroundColor: palette["primary-tint"] }
                    : { borderColor: colors.borderStrong, backgroundColor: palette.surface },
                ]}
              >
                <FileText size={14} color={palette["primary-text"]} />
                <Text variant="caption" numberOfLines={1} style={[styles.ghostText, { color: palette["primary-text"] }]}>
                  {rulesFile ? rulesFile.name : t("aiPage.rulesChoose")}
                </Text>
              </Pressable>
            </View>
            <View style={styles.field}>
              <Text variant="caption" style={[styles.fieldLabel, { color: colors.foreground }]}>
                {t("aiPage.rulesTextLabel")}
              </Text>
              {textArea(rulesText, setRulesText, t("aiPage.rulesPlaceholder"), MAX_RULES_TEXT)}
            </View>
            <Hint>{t("aiPage.rulesHint")}</Hint>
          </View>
        </Details>

        <Hint>{t("aiPage.hint")}</Hint>
        {error ? (
          <View style={styles.alert}>
            <Text variant="body" style={styles.alertText}>
              {error}
            </Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={start.isPending}
          onPress={submit}
          style={({ pressed }) => [styles.submit, { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }]}
        >
          {start.isPending ? (
            <ActivityIndicator size="small" color={palette["primary-foreground"]} />
          ) : (
            <Sparkles size={15} color={palette["primary-foreground"]} />
          )}
          <Text variant="label" style={{ color: palette["primary-foreground"] }}>
            {t("aiPage.submit")}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.card, { borderColor: colors.border, backgroundColor: palette.surface }]}>
        <Text variant="body" style={[styles.h2, { color: colors.foreground }]}>
          {t("aiPage.jobsTitle")}
        </Text>
        {jobs.isLoading ? <ActivityIndicator color={colors.muted} /> : null}
        {jobs.isError && !jobs.data ? <Hint>{t("aiPage.jobsError")}</Hint> : null}
        {jobs.data && !jobs.data.length ? <Hint>{t("aiPage.jobsEmpty")}</Hint> : null}
        {(jobs.data ?? []).map((job) => (
          <JobRow key={job.id} job={job} onOpenQuiz={onOpenQuiz} />
        ))}
      </View>
    </View>
  );
}

function Hint({ children }: { children: string }) {
  const colors = useQuizColors();
  return (
    <Text variant="caption" style={{ color: colors.muted }}>
      {children}
    </Text>
  );
}

/** `<details>` — `.ai-quiz-details > summary`: 12/800 action, uchburchak bilan. */
function Details({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={[styles.summary, open && styles.summaryOpen]}>
        <Text variant="caption" style={[styles.summaryText, { color: palette["primary-text"] }]}>
          {open ? "▾" : "▸"} {label}
        </Text>
      </Pressable>
      {open ? children : null}
    </View>
  );
}

function JobRow({ job, onOpenQuiz }: { job: AiQuizJob; onOpenQuiz: (quizId: string) => void }) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const colors = useQuizColors();
  const active = ACTIVE.includes(job.status);
  const kind = job.mode === "rules" ? t("aiPage.modeRules") : job.mode === "simple" ? t("aiPage.modeSimple") : t("aiPage.modeBank");
  return (
    <View style={[styles.job, { borderColor: colors.border, backgroundColor: palette.surface }]}>
      <View style={[styles.headIcon, { backgroundColor: palette["primary-soft"] }]}>
        {active ? (
          <ActivityIndicator size="small" color={palette["primary-text"]} />
        ) : job.status === "failed" ? (
          <CircleAlert size={18} color={palette["primary-text"]} />
        ) : (
          <Sparkles size={18} color={palette["primary-text"]} />
        )}
      </View>
      <View style={styles.jobBody}>
        <Text variant="label" style={{ color: colors.foreground }}>
          {job.title || job.topic}
        </Text>
        <Text variant="caption" style={{ color: colors.muted }}>
          {[kind, job.summary || (job.questionCount ? t("aiPage.questions", { count: job.questionCount }) : ""), t(`aiPage.status.${job.status}`)]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        {job.status === "failed" ? (
          <Text variant="caption" style={{ color: "#cd3a4b" }}>
            {job.error || t("aiPage.failedFallback")}
          </Text>
        ) : null}
        {active ? (
          <Text variant="caption" style={{ color: colors.muted }}>
            {t("aiPage.waitHint")}
          </Text>
        ) : null}
      </View>
      {job.status === "done" && job.quizId ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpenQuiz(job.quizId as string)}
          style={({ pressed }) => [
            styles.open,
            { borderColor: colors.border, backgroundColor: pressed ? palette["primary-soft"] : palette.surface },
          ]}
        >
          <Text variant="body" style={[styles.openText, { color: colors.foreground }]}>
            {t("aiPage.openQuiz")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  right: { textAlign: "right" },
  disabled: { opacity: 0.4 },
  /* `.ai-quiz` — oraliq 16 */
  root: { gap: 16 },
  /* `.portal-card.ai-quiz-form` — bo'shliq 20, oraliq 14 */
  card: {
    gap: 14,
    padding: 20,
    borderWidth: 1,
    borderRadius: 20,
    boxShadow: "0 12px 34px rgba(36, 38, 77, 0.045)",
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  headIcon: { width: 41, height: 41, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  h2: { fontSize: 15, lineHeight: 22, fontWeight: "700" },
  headText: { marginTop: 4, fontSize: 13, lineHeight: 19 },
  field: { gap: 6 },
  topicLabel: { fontSize: 13, fontWeight: "700" },
  fieldLabel: { fontSize: 12, fontWeight: "700" },
  dropzone: { alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 18, borderRadius: 16 },
  dropIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dropTitle: { fontSize: 13, fontWeight: "600" },
  file: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 10 },
  fileName: { flex: 1, minWidth: 0, fontWeight: "600" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4, borderRadius: radius.full },
  stepButton: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  stepInput: { flex: 1, minWidth: 0, textAlign: "center", fontSize: 16, fontFamily: "Onest-SemiBold" },
  summary: { paddingVertical: 4 },
  summaryOpen: { marginBottom: 8 },
  summaryText: { fontSize: 12, fontWeight: "700" },
  extra: { gap: 10, paddingTop: 4 },
  ghost: {
    alignSelf: "flex-start",
    minHeight: 44,
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
  ghostText: { flexShrink: 1, fontWeight: "700" },
  alert: { paddingHorizontal: 13, paddingVertical: 11, borderWidth: 1, borderColor: "#f4dadd", borderRadius: 10, backgroundColor: "#fff0f2" },
  alertText: { fontSize: 15, color: "#b93636" },
  /* telefonda `.dialog-actions > button` to'liq kenglikda */
  submit: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.full },
  job: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 13 },
  jobBody: { flex: 1, minWidth: 0, gap: 2 },
  open: { minHeight: 38, justifyContent: "center", paddingHorizontal: 13, borderWidth: 1, borderRadius: 10 },
  openText: { fontSize: 15, fontWeight: "700" },
});
