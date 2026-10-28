import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubjects } from "@/modules/course";
import { useAiQuizJobs, useStartAiQuiz, type AiQuizJob, type AiQuizStandard } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { pickDocuments, toUploadFile, type PickedFile } from "@/shared/lib";
import {
  DsGradient,
  DsText,
  dsRadius,
  Icon,
  MobileActionBar,
  MobileButton,
  MobileEmptyCard,
  MobileFieldLabel,
  MobileInput,
  MobileListSkeleton,
  MobilePageHeader,
  MobileRoundButton,
  MobileSegment,
  MobilePickerField,
  toneColors,
  useDs,
  type IconName,
} from "@/shared/ui";

type Tab = "simple" | "rules" | "bank";

const STANDARDS: AiQuizStandard[] = ["uzbmb", "ielts", "sat"];
const MAX_FILES = 5;
const MAX_TOTAL_MB = 20;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 50;
const FILE_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/*"];

/*
 * Tayyor test hozircha eski testlar sahifasida ochiladi — 5b bosqichida
 * `ROUTES.teacher.test(quizId)` ga ko'chadi.
 */
const openQuizPath = (quizId: string) => `/teacher/quizzes?quiz=${encodeURIComponent(quizId)}`;

/**
 * AI yordamchi — veb `ai-assistant-page.tsx` + `mobile-ai-assistant.tsx`
 * (tor ekran). `?view=jobs` — yaratilgan testlar tarixi (vebda ham shu
 * parametr); mobilda u stekka yangi sahifa bo'lib qo'shiladi, shuning uchun
 * "orqaga" formaga qaytaradi.
 */
export function AiAssistantPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string; started?: string }>();
  const subjects = useSubjects();
  const jobs = useAiQuizJobs();
  const start = useStartAiQuiz();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.teacher.workspace as never);
  }

  if (params.view === "jobs")
    return (
      <AiJobs
        jobs={jobs.data ?? []}
        loading={jobs.isLoading}
        started={params.started === "1"}
        retrying={start.isPending}
        onBack={goBack}
        onOpen={(job) => job.quizId && router.push(openQuizPath(job.quizId) as never)}
        onRetry={(job) =>
          start.mutate({
            files: [],
            request: { topic: job.topic || job.title, questionCount: job.questionCount || 10, ...(job.standard ? { standard: job.standard } : {}) },
          })
        }
      />
    );

  return (
    <AiForm
      subjects={(subjects.data ?? []).map((item) => ({ value: item.value, label: item.label }))}
      pending={start.isPending}
      error={start.isError ? (start.error?.message ?? null) : null}
      onBack={goBack}
      onHistory={() => router.push(`${ROUTES.teacher.workspaceAi}?view=jobs` as never)}
      onSubmit={(value) =>
        start.mutate(
          {
            files: value.files.map(toUploadFile),
            request: {
              topic: value.topic,
              subject: value.subject || undefined,
              questionCount: value.count,
              ...(value.standard ? { standard: value.standard } : {}),
            },
          },
          { onSuccess: () => router.push(`${ROUTES.teacher.workspaceAi}?view=jobs&started=1` as never) }
        )
      }
    />
  );
}

interface AiFormProps {
  subjects: Array<{ value: string; label: string }>;
  pending: boolean;
  error: string | null;
  onBack: () => void;
  onHistory: () => void;
  onSubmit: (value: { files: PickedFile[]; subject: string; topic: string; count: number; standard: AiQuizStandard | null }) => void;
}

/** AI test formasi — oddiy / qoidali (imtihon turi) / bank (tez orada). */
function AiForm({ subjects, pending, error, onBack, onHistory, onSubmit }: AiFormProps) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("simple");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [standard, setStandard] = useState<AiQuizStandard>("ielts");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [count, setCount] = useState(15);
  const [fileError, setFileError] = useState<string | null>(null);

  const subjectLabel = subjects.find((item) => item.value === subject)?.label ?? "";

  async function chooseFiles() {
    const picked = (await pickDocuments(FILE_TYPES)).slice(0, MAX_FILES);
    if (!picked.length) return;
    const total = picked.reduce((sum, file) => sum + file.size, 0);
    if (total > MAX_TOTAL_MB * 1024 * 1024) {
      setFileError(t("ai.mobile.filesTooBig", { size: MAX_TOTAL_MB }));
      return;
    }
    setFileError(null);
    setFiles(picked);
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView style={styles.fill} contentContainerStyle={[styles.page, { paddingTop: insets.top + 22, paddingBottom: 24 }]} keyboardShouldPersistTaps="handled">
        <DsGradient name="auth" />
        <MobilePageHeader
          title={t("ai.title")}
          backLabel={t("ai.mobile.back")}
          onBack={onBack}
          action={<MobileRoundButton icon="schedule" label={t("ai.mobile.history")} onPress={onHistory} />}
        />

        <View style={styles.tabs}>
          <MobileSegment items={(["simple", "rules", "bank"] as const).map((id) => ({ id, label: t(`ai.mobile.tabs.${id}`) }))} value={tab} onChange={setTab} />
        </View>

        {tab === "bank" ? (
          <View style={styles.bank}>
            <MobileEmptyCard icon="quiz" title={t("ai.mobile.bankTitle")} description={t("ai.mobile.bankHint")} />
          </View>
        ) : (
          <>
            {/* `mt-[15px] gap-[15px]`, yorliq va maydon orasi 7px */}
            <View style={styles.fields}>
              <MobileFieldLabel gap={7} label={t("ai.subject")}>
                <MobilePickerField
                  type="select"
                  surface
                  value={subject}
                  display={subjectLabel || t("assignDialog.pick")}
                  placeholder={!subjectLabel}
                  ariaLabel={t("ai.subject")}
                  options={[...(subjectLabel ? [] : [{ value: "", label: t("assignDialog.pick") }]), ...subjects]}
                  onChange={setSubject}
                />
              </MobileFieldLabel>

              {tab === "rules" ? (
                <MobileFieldLabel gap={7} label={t("ai.examType")}>
                  <MobilePickerField
                    type="select"
                    surface
                    value={standard}
                    display={t(`ai.modes.${standard}`)}
                    ariaLabel={t("ai.examType")}
                    options={STANDARDS.map((item) => ({ value: item, label: t(`ai.modes.${item}`) }))}
                    onChange={(value) => setStandard(value as AiQuizStandard)}
                  />
                </MobileFieldLabel>
              ) : null}

              <MobileFieldLabel gap={7} label={t("ai.topic")}>
                <MobileInput surface value={topic} placeholder={t("ai.topicPlaceholder")} onChangeText={setTopic} />
              </MobileFieldLabel>
            </View>

            {/* `h-[117px] rounded-lg border-[1.5px] border-dashed border-brand bg-brand-subtle` */}
            <Pressable
              accessibilityRole="button"
              onPress={() => void chooseFiles()}
              style={({ pressed }) => [styles.drop, { borderColor: ds.c.brand, backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }]}
            >
              <Icon name="add" size={24} color={ds.c.brand} />
              <DsText v="title-sm" style={styles.dropTitle}>
                {files.length ? t("ai.filesPicked", { count: files.length }) : t("ai.mobile.pickFiles")}
              </DsText>
              <DsText v="caption" w="400" c="ink-secondary" style={styles.dropHint}>
                {t("ai.mobile.filesHint")}
              </DsText>
            </Pressable>

            {fileError || error ? (
              <View style={[styles.error, { backgroundColor: ds.c["danger-bg"] }]}>
                <Icon name="warning-fill" size={18} color={ds.c.danger} />
                <DsText v="body-sm" c="error-text" style={styles.grow}>
                  {fileError ?? error}
                </DsText>
              </View>
            ) : null}

            <View style={styles.countRow}>
              <View style={styles.grow}>
                <DsText v="body-sm">{t("ai.questionCount")}</DsText>
                <DsText v="caption" w="400" c="ink-secondary">
                  {t("ai.mobile.countRange", { min: MIN_QUESTIONS, max: MAX_QUESTIONS })}
                </DsText>
              </View>
              {/* `h-13 rounded-full bg-subtle p-1.5 gap-1` */}
              <View style={[styles.stepper, { backgroundColor: ds.c.subtle }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("ai.less")}
                  disabled={count <= MIN_QUESTIONS}
                  onPress={() => setCount((value) => Math.max(MIN_QUESTIONS, value - 5))}
                  style={[styles.step, { backgroundColor: ds.c.surface }, count <= MIN_QUESTIONS && styles.faded]}
                >
                  <Icon name="remove" size={22} color={ds.c.ink} />
                </Pressable>
                <DsText v="title-sm" style={styles.countValue}>
                  {t("ai.mobile.count", { count })}
                </DsText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("ai.more")}
                  disabled={count >= MAX_QUESTIONS}
                  onPress={() => setCount((value) => Math.min(MAX_QUESTIONS, value + 5))}
                  style={[styles.step, { backgroundColor: ds.c.surface }, count >= MAX_QUESTIONS && styles.faded]}
                >
                  <Icon name="add" size={22} color={ds.c.ink} />
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {tab === "bank" ? null : (
        <MobileActionBar>
          <MobileButton
            icon="sparkles-fill"
            label={t("ai.mobile.submit")}
            disabled={pending || !topic.trim()}
            onPress={() => onSubmit({ files, subject, topic: topic.trim(), count, standard: tab === "rules" ? standard : null })}
          />
        </MobileActionBar>
      )}
    </View>
  );
}

const JOB_TONE: Record<string, { icon: IconName; tone: string }> = {
  queued: { icon: "schedule", tone: "bg-accent-blue-bg text-accent-blue-fg" },
  processing: { icon: "sparkles-fill", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
  generating: { icon: "sparkles-fill", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
  done: { icon: "check-circle", tone: "bg-accent-green-bg text-accent-green-fg" },
  failed: { icon: "warning-fill", tone: "bg-accent-red-bg text-accent-red-fg" },
};

interface AiJobsProps {
  jobs: AiQuizJob[];
  loading: boolean;
  started: boolean;
  retrying: boolean;
  onBack: () => void;
  onOpen: (job: AiQuizJob) => void;
  onRetry: (job: AiQuizJob) => void;
}

/** Yaratilgan testlar tarixi — holat belgisi, nom va savollar soni, "Ochish"/"Qayta urinish". */
function AiJobs({ jobs, loading, started, retrying, onBack, onOpen, onRetry }: AiJobsProps) {
  const { t } = useTranslation("quiz");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const months = tl("list.months", { returnObjects: true }) as string[];

  function stamp(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").slice(0, 3).toLowerCase()}, ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView style={styles.fill} contentContainerStyle={[styles.page, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 32 }]}>
        <DsGradient name="auth" />
        <MobilePageHeader title={t("ai.mobile.jobsTitle")} backLabel={t("ai.mobile.back")} onBack={onBack} />

        {started ? (
          <View style={[styles.started, { backgroundColor: ds.c["success-bg"] }]}>
            <Icon name="check-circle" size={22} color={ds.c.success} />
            <DsText v="body-sm" w="600" c="success-fg" style={styles.grow}>
              {t("ai.mobile.started")}
            </DsText>
          </View>
        ) : null}

        {loading ? <MobileListSkeleton card rows={4} style={styles.jobsTop} /> : null}

        <View style={[styles.jobs, { marginTop: started ? 20 : 18 }]}>
          {jobs.map((job) => {
            const look = JOB_TONE[job.status] ?? JOB_TONE.queued;
            const colors = toneColors(look.tone, ds);
            const running = job.status === "processing" || job.status === "generating";
            return (
              <View key={job.id} style={[styles.job, { backgroundColor: ds.c.surface }]}>
                <View style={styles.jobHead}>
                  <View style={[styles.jobIcon, { backgroundColor: colors.bg }]}>
                    <Icon name={look.icon} size={20} color={colors.fg ?? ds.c.ink} />
                  </View>
                  <View style={styles.grow}>
                    <DsText v="title">{t("ai.mobile.jobTitle", { title: job.title || job.topic, count: job.questionCount })}</DsText>
                    <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                      {job.status === "done"
                        ? t("ai.mobile.ready", { date: stamp(job.createdAt) })
                        : job.status === "failed"
                          ? job.error || t("ai.status.failed")
                          : running
                            ? t("ai.mobile.running")
                            : t("ai.mobile.queued")}
                    </DsText>
                  </View>
                  {job.status === "done" && job.quizId ? (
                    <Pressable accessibilityRole="button" onPress={() => onOpen(job)} style={({ pressed }) => [styles.jobButton, { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }]}>
                      <DsText v="button-sm" c="brand">
                        {t("ai.mobile.open")}
                      </DsText>
                    </Pressable>
                  ) : null}
                  {job.status === "failed" ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={retrying}
                      onPress={() => onRetry(job)}
                      style={({ pressed }) => [styles.jobButton, styles.retry, { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : "transparent" }, retrying && styles.faded]}
                    >
                      <Icon name="refresh" size={16} color={ds.c.ink} />
                      <DsText v="button-sm">{t("ai.mobile.retry")}</DsText>
                    </Pressable>
                  ) : null}
                </View>
                {running ? (
                  <View style={[styles.progress, { backgroundColor: ds.c.subtle }]}>
                    <View style={[styles.progressFill, { width: job.status === "generating" ? "60%" : "31%", backgroundColor: ds.c.brand }]} />
                  </View>
                ) : null}
              </View>
            );
          })}

          {!loading && !jobs.length ? <MobileEmptyCard icon="sparkles-fill" title={t("ai.jobsEmpty")} description={t("ai.jobsHint")} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.4 },
  page: { paddingHorizontal: 16 },
  tabs: { marginTop: 14 },
  bank: { marginTop: 20 },
  fields: { marginTop: 15, gap: 15 },
  drop: { marginTop: 16, height: 117, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, borderWidth: 1.5, borderStyle: "dashed", borderRadius: dsRadius.lg },
  dropTitle: { marginTop: 8, textAlign: "center" },
  dropHint: { marginTop: 4, textAlign: "center" },
  error: { marginTop: 12, flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.lg },
  countRow: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  stepper: { height: 52, flexDirection: "row", alignItems: "center", gap: 4, padding: 6, borderRadius: 26 },
  step: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  countValue: { width: 52, textAlign: "center" },
  started: { marginTop: 18, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: dsRadius.xl },
  jobsTop: { marginTop: 20 },
  jobs: { gap: 20 },
  job: { padding: 16, borderRadius: dsRadius.xl },
  jobHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  jobIcon: { width: 40, height: 40, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  jobButton: { height: 40, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, borderRadius: 20 },
  retry: { borderWidth: 1 },
  progress: { marginTop: 10, height: 6, overflow: "hidden", borderRadius: 3 },
  progressFill: { height: "100%", borderRadius: 3 },
});
