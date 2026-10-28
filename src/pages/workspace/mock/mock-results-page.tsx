import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ExamScoreDialog,
  examApi,
  examKeys,
  formatClock,
  secondsUntil,
  useExam,
  useExamCurrent,
  useExamResults,
  useExamStudentResult,
  useRequestWritingAi,
  useSaveManualScores,
  useShareExamResults,
} from "@/modules/exam";
import { ROUTES } from "@/shared/config";
import type { ExamStudentResult, ExamStudentResultDetail, ExamWritingAiItem } from "@/shared/types";
import {
  Avatar,
  DsGradient,
  DsText,
  dsRadius,
  Icon,
  MobileActionBar,
  MobileButton,
  MobileListCard,
  MobileListRow,
  MobileListSkeleton,
  MobileRoundButton,
  MobileTitleHeader,
  PullRefresh,
  toast,
  useDs,
  type DsColor,
} from "@/shared/ui";

function band(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

/**
 * Mock natijalari — veb `mock-results-page.tsx` + `mobile-mock-results.tsx`
 * (tor ekran). Imtihon davom etayotgan bo'lsa jonli kuzatish; aks holda
 * natijalar (bo'limlar o'rtachasi, o'quvchilar, baholash oynasi).
 * `?view=writing&section=` — esselar ro'yxati, `&student=` — AI tahlili;
 * mobilda har biri stekka yangi sahifa bo'lib qo'shiladi.
 */
export function MockResultsPage() {
  const { t } = useTranslation("exam");
  const { t: tl } = useTranslation("lesson");
  const router = useRouter();
  const params = useLocalSearchParams<{ examId: string; view?: string; section?: string; student?: string }>();
  const examId = params.examId ?? null;
  const months = tl("list.months", { returnObjects: true }) as string[];
  const exam = useExam(examId);
  const results = useExamResults(examId, Boolean(examId));
  const running = exam.data?.state === "running";
  const current = useExamCurrent(running ? examId : null, 15_000);
  const share = useShareExamResults();
  const saveScores = useSaveManualScores(examId ?? "");
  const requestAi = useRequestWritingAi(examId ?? "");
  const [scoring, setScoring] = useState<{ studentId: string; prefill?: Record<string, number> } | null>(null);

  const rows = useMemo(() => results.data?.results ?? [], [results.data]);
  const participated = rows.filter((row) => row.participated);
  const view = params.view;
  const writingKey = params.section ?? "writing";
  const essayStudent = params.student ?? null;
  const participantIds = view === "writing" && !essayStudent ? participated.map((row) => row.studentId) : [];
  const essays = useQueries({
    queries: participantIds.map((studentId) => ({
      queryKey: examKeys.studentResult(examId ?? "", studentId),
      queryFn: ({ signal }: { signal: AbortSignal }) => examApi.getStudentResult(examId as string, studentId, { signal }),
    })),
  });
  const essayDetail = useExamStudentResult(examId, essayStudent);
  const scoringResult = useExamStudentResult(examId, scoring?.studentId ?? null);
  const scoringRow = rows.find((row) => row.studentId === scoring?.studentId) ?? null;

  const sections = useMemo(() => {
    const keys = new Map<string, string>();
    for (const row of rows) for (const section of row.sections) keys.set(section.key, section.title);
    return [...keys.entries()].map(([key, title]) => {
      const values = participated.map((row) => row.sections.find((section) => section.key === key)?.score ?? null).filter((value): value is number => value !== null);
      return {
        key,
        title,
        value: values.length ? values.reduce((sum, item) => sum + item, 0) / values.length : null,
        manual: rows.some((row) => row.sections.some((item) => item.key === key && item.manual)),
      };
    });
  }, [rows, participated]);

  const finishedDate = exam.data?.endsAt ? new Date(exam.data.endsAt) : null;
  const dateLabel = finishedDate && !Number.isNaN(finishedDate.getTime()) ? `${finishedDate.getDate()}-${(months[finishedDate.getMonth()] ?? "").toLowerCase()}` : "";
  const resultsPath = examId ? ROUTES.teacher.mockResults(examId) : ROUTES.teacher.mockExams;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.teacher.mockExams as never);
  }

  function shareResults() {
    if (!examId) return;
    share.mutate(examId, { onSuccess: (data) => toast.success(t("mock.mobile.shared", { count: data.students || participated.length })) });
  }

  const scoreSheet = (
    <ExamScoreDialog
      open={Boolean(scoringRow)}
      onOpenChange={(open) => !open && setScoring(null)}
      result={scoringRow}
      prefill={scoring?.prefill}
      suggested={scoringResult.data?.writingAi?.suggestedBand != null ? { [writingKey]: scoringResult.data.writingAi.suggestedBand } : {}}
      pending={saveScores.isPending}
      onSave={(scores) => scoringRow && saveScores.mutate({ studentId: scoringRow.studentId, scores }, { onSuccess: () => setScoring(null) })}
    />
  );

  if (view === "writing" && essayStudent) {
    const row = rows.find((item) => item.studentId === essayStudent);
    return (
      <>
        <WritingAi
          title={t("mock.mobile.aiTitle", { name: row?.studentName ?? "", section: row?.sections.find((section) => section.key === writingKey)?.title ?? "Writing" })}
          detail={essayDetail.data}
          requesting={requestAi.isPending}
          onBack={goBack}
          onRequest={() => requestAi.mutate(essayStudent)}
          onApply={(value) => setScoring({ studentId: essayStudent, prefill: { [writingKey]: value } })}
        />
        {scoreSheet}
      </>
    );
  }

  if (view === "writing") {
    const entries: WritingEntry[] = participated.map((row) => ({
      row,
      detail: essays.find((query) => query.data?.studentId === row.studentId)?.data,
      sectionKey: writingKey,
    }));
    return (
      <WritingList
        eyebrow={[exam.data?.title, dateLabel, t("mock.mobile.submissions", { count: entries.length })].filter(Boolean).join(" · ")}
        entries={entries}
        loading={essays.some((query) => query.isLoading)}
        onBack={goBack}
        onOpen={(entry) => router.push(`${resultsPath}?view=writing&section=${encodeURIComponent(writingKey)}&student=${encodeURIComponent(entry.row.studentId)}` as never)}
      />
    );
  }

  if (running) {
    const sectionList = (exam.data?.sections ?? []).filter((section) => section.kind === "section");
    const currentKey = current.data?.item?.key ?? null;
    return (
      <MockLive
        title={exam.data?.title ?? ""}
        sectionTitle={current.data?.item?.title ?? null}
        sectionIndex={sectionList.findIndex((section) => section.key === currentKey) + 1}
        sectionCount={sectionList.length}
        endsAt={current.data?.endsAt ?? exam.data?.endsAt ?? null}
        rows={rows}
        onBack={goBack}
        onRefresh={() => Promise.all([exam.refetch(), results.refetch(), current.refetch()])}
      />
    );
  }

  return (
    <>
      <MockResults
        eyebrow={exam.data?.courseTitle ?? ""}
        title={exam.data?.title ?? ""}
        rows={rows}
        sections={sections}
        loading={results.isLoading}
        sharing={share.isPending}
        onBack={goBack}
        onShare={shareResults}
        onSection={(key) => router.push(`${resultsPath}?view=writing&section=${encodeURIComponent(key)}` as never)}
        onStudent={(row) => setScoring({ studentId: row.studentId })}
        onRefresh={() => Promise.all([exam.refetch(), results.refetch()])}
      />
      {scoreSheet}
    </>
  );
}

/** Uchta katakli statistika — `h-[63px] rounded-lg bg-surface px-3`. */
function Tile({ value, label, tone = "ink" }: { value: ReactNode; label: ReactNode; tone?: DsColor }) {
  const ds = useDs();
  return (
    <View style={styles.tileCell}>
      <View style={[styles.tile, { backgroundColor: ds.c.surface }]}>
        <DsText w="600" c={tone} numberOfLines={1} style={styles.tileValue}>
          {value}
        </DsText>
        <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
          {label}
        </DsText>
      </View>
    </View>
  );
}

/** `h-11 gap-3`: yopish/orqaga, markazda sarlavha, o'ngda amal yoki bo'sh joy. */
function Header({ title, icon, label, onBack, action }: { title?: ReactNode; icon: "close" | "chevron-left"; label: string; onBack: () => void; action?: ReactNode }) {
  return (
    <View style={styles.header}>
      <MobileRoundButton icon={icon} label={label} onPress={onBack} />
      <DsText v="title-lg" w="600" numberOfLines={1} style={styles.headerTitle}>
        {title}
      </DsText>
      {action ?? <View style={styles.spacer} />}
    </View>
  );
}

function Page({ children, onRefresh, footer }: { children: ReactNode; onRefresh?: () => Promise<unknown>; footer?: ReactNode }) {
  const ds = useDs();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: footer ? 24 : insets.bottom + 32 }]}
        refreshControl={onRefresh ? <PullRefresh onRefresh={onRefresh} /> : undefined}
      >
        <DsGradient name="auth" />
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

function MockLive({
  title,
  sectionTitle,
  sectionIndex,
  sectionCount,
  endsAt,
  rows,
  onBack,
  onRefresh,
}: {
  title: string;
  sectionTitle: string | null;
  sectionIndex: number;
  sectionCount: number;
  endsAt: string | null;
  rows: ExamStudentResult[];
  onBack: () => void;
  onRefresh: () => Promise<unknown>;
}) {
  const { t } = useTranslation("exam");
  const ds = useDs();
  const [left, setLeft] = useState(() => secondsUntil(endsAt));

  useEffect(() => {
    const timer = setInterval(() => setLeft(secondsUntil(endsAt)), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  const joined = rows.filter((row) => row.participated).length;
  const finished = rows.filter((row) => row.finishedAt).length;
  const warnings = rows.reduce((sum, row) => sum + (row.integrity?.away ?? 0) + (row.integrity?.paste ?? 0), 0);
  const end = endsAt ? new Date(endsAt) : null;
  const endLabel = end && !Number.isNaN(end.getTime()) ? `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}` : "—";

  return (
    <Page onRefresh={onRefresh}>
      <Header title={title} icon="close" label={t("mock.mobile.back")} onBack={onBack} />

      {/* `mt-4 rounded-xl bg-brand px-4 pt-4 pb-[15px]` */}
      <View style={[styles.live, { backgroundColor: ds.c.brand }]}>
        <View style={styles.liveHead}>
          <View style={[styles.liveBadge, { backgroundColor: ds.c.surface }]}>
            <View style={[styles.liveDot, { backgroundColor: ds.c.danger }]} />
            <DsText v="caption-strong" c="error-text">
              {t("mock.liveBadge")}
            </DsText>
          </View>
          <DsText v="body-sm" w="600" c="on-action" numberOfLines={1} style={styles.grow}>
            {sectionTitle ? t("mock.mobile.liveSection", { title: sectionTitle, current: sectionIndex, total: sectionCount }) : null}
          </DsText>
        </View>
        <DsText heading w="600" c="on-action" numeric style={styles.liveClock}>
          {formatClock(left)}
        </DsText>
        <DsText v="body-sm" c="on-action" style={styles.mt10}>
          {t("mock.mobile.liveEnds", { time: endLabel })}
        </DsText>
      </View>

      <View style={[styles.tiles, styles.mt12]}>
        <Tile value={`${joined}/${rows.length}`} label={t("mock.mobile.joined")} />
        <Tile value={finished} label={t("mock.mobile.submitted")} tone="success" />
        <Tile value={warnings} label={t("mock.mobile.warnings")} tone="error-text" />
      </View>

      <DsText v="caption-strong" c="ink-secondary" style={[styles.upper, styles.studentsHead]}>
        {t("mock.mobile.students")}
      </DsText>

      <View style={[styles.liveList, { backgroundColor: ds.c.surface }]}>
        {rows.map((row) => {
          const done = Boolean(row.finishedAt);
          const away = row.integrity?.away ?? 0;
          const percent = done ? 100 : row.participated && row.answered != null && row.questionsTotal ? Math.round((row.answered / row.questionsTotal) * 100) : 0;
          return (
            <View key={row.studentId} style={styles.liveRow}>
              <Avatar variant="legacy" name={row.studentName} size="sm" box={36} />
              <View style={styles.grow}>
                <View style={styles.liveName}>
                  <DsText v="title-sm" numberOfLines={1} style={styles.shrink}>
                    {row.studentName}
                  </DsText>
                  {away ? (
                    <View style={[styles.awayChip, { backgroundColor: ds.c["danger-bg"] }]}>
                      <Icon name="warning-fill" size={12} color={ds.c["accent-saffron-fg"]} />
                      <DsText v="caption-strong" c="error-text">
                        {t("mock.awayCount", { count: away })}
                      </DsText>
                    </View>
                  ) : null}
                </View>
                <DsText v="caption" w="400" c={row.participated ? "ink-secondary" : "error-text"} numberOfLines={1} style={styles.mt3}>
                  {done
                    ? t("mock.finished")
                    : row.participated
                      ? [sectionTitle, row.answered != null && row.questionsTotal ? t("mock.answeredCount", { answered: row.answered, total: row.questionsTotal }) : t("mock.inProgress")]
                          .filter(Boolean)
                          .join(" · ")
                      : t("mock.mobile.notJoined")}
                </DsText>
                <View style={[styles.progress, { backgroundColor: ds.c.subtle }]}>
                  <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: done ? ds.c.success : ds.c.brand }]} />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <DsText v="caption" w="400" c="ink-secondary" style={styles.mt12}>
        {t("mock.mobile.integrityNote")}
      </DsText>
    </Page>
  );
}

function MockResults(props: {
  eyebrow: string;
  title: string;
  rows: ExamStudentResult[];
  sections: Array<{ key: string; title: string; value: number | null; manual: boolean }>;
  loading: boolean;
  sharing: boolean;
  onBack: () => void;
  onShare: () => void;
  onSection: (key: string) => void;
  onStudent: (row: ExamStudentResult) => void;
  onRefresh: () => Promise<unknown>;
}) {
  const { t } = useTranslation("exam");
  const ds = useDs();
  const participated = props.rows.filter((row) => row.participated);
  const totals = participated.map((row) => row.total?.score ?? null).filter((value): value is number => value !== null);
  const average = totals.length ? totals.reduce((sum, value) => sum + value, 0) / totals.length : null;
  const best = totals.length ? Math.max(...totals) : null;

  return (
    <Page onRefresh={props.onRefresh}>
      <View style={styles.headerSplit}>
        <MobileRoundButton icon="chevron-left" label={t("mock.mobile.back")} onPress={props.onBack} />
        <MobileRoundButton icon="send" label={t("results.share")} disabled={props.sharing} onPress={props.onShare} />
      </View>

      <View style={styles.mt16}>
        <MobileTitleHeader eyebrow={props.eyebrow} title={props.title} />
      </View>

      <View style={[styles.tiles, styles.mt22]}>
        <Tile value={`${participated.length}/${props.rows.length}`} label={t("results.submitted")} />
        <Tile value={band(average)} label={t("mock.mobile.averageLabel")} tone="brand-strong" />
        <Tile value={band(best)} label={t("results.best")} tone="success" />
      </View>

      {props.loading ? (
        <MobileListSkeleton card rows={3} style={styles.mt20} />
      ) : (
        <>
          {props.sections.length ? (
            <View style={[styles.sectionCard, { backgroundColor: ds.c.surface }]}>
              <DsText v="title">{t("mock.mobile.bySection")}</DsText>
              <View style={styles.sectionList}>
                {props.sections.map((section) => {
                  const body = (
                    <>
                      <View style={styles.sectionHead}>
                        <DsText v="body-sm" style={styles.shrink}>
                          {section.title}
                        </DsText>
                        <DsText v="body-sm" w="600" c="brand-strong">
                          {band(section.value)}
                        </DsText>
                      </View>
                      <View style={[styles.bar, { backgroundColor: ds.c.subtle }]}>
                        <View style={[styles.barFill, { width: `${Math.min(100, ((section.value ?? 0) / 9) * 100)}%`, backgroundColor: ds.c.brand }]} />
                      </View>
                    </>
                  );
                  return section.manual ? (
                    <Pressable key={section.key} accessibilityRole="button" onPress={() => props.onSection(section.key)} style={styles.sectionItem}>
                      {body}
                    </Pressable>
                  ) : (
                    <View key={section.key} style={styles.sectionItem}>
                      {body}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <MobileListCard style={styles.mt20}>
            {props.rows.map((row, index) => {
              const score = row.total?.score ?? null;
              const high = score !== null && score >= 7;
              return (
                <MobileListRow
                  key={row.studentId}
                  chevron={false}
                  last={index === props.rows.length - 1}
                  leading={<Avatar variant="legacy" name={row.studentName} size="sm" box={44} />}
                  title={row.studentName}
                  subtitle={row.participated ? undefined : t("results.notJoined")}
                  trailing={
                    row.participated ? (
                      <View style={[styles.scoreChip, { backgroundColor: high ? ds.c["success-bg"] : ds.c["brand-subtle"] }]}>
                        <DsText v="caption-strong" c={high ? "success-fg" : "ink"}>
                          {band(score)}
                        </DsText>
                      </View>
                    ) : undefined
                  }
                  onPress={row.participated ? () => props.onStudent(row) : undefined}
                />
              );
            })}
          </MobileListCard>
        </>
      )}
    </Page>
  );
}

interface WritingEntry {
  row: ExamStudentResult;
  detail: ExamStudentResultDetail | undefined;
  sectionKey: string;
}

type WritingFilter = "all" | "ungraded" | "ai";

function writingState(entry: WritingEntry) {
  const teacher = entry.row.sections.find((section) => section.key === entry.sectionKey)?.score ?? null;
  const ai = entry.detail?.writingAi ?? null;
  const item: ExamWritingAiItem | null = ai?.status === "done" ? (ai.items[ai.items.length - 1] ?? null) : null;
  const text =
    entry.detail?.manualAnswers
      .filter((answer) => answer.section === entry.sectionKey)
      .map((answer) => answer.answer)
      .join("\n\n") ?? "";
  const words = item?.wordCount ?? (text.trim() ? text.trim().split(/\s+/).length : 0);
  return { teacher, ai: ai?.status === "done" ? ai.suggestedBand : null, tooShort: Boolean(item?.tooShort), minWords: item?.minWords ?? null, words, text, task: item?.task ?? null };
}

function excerpt(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  const stop = clean.search(/[.,!?;]/);
  const cut = stop > 20 && stop <= 90 ? stop : Math.min(clean.length, 90);
  return cut < clean.length ? `${clean.slice(0, cut).trimEnd()}...` : clean;
}

function WritingList({ eyebrow, entries, loading, onBack, onOpen }: { eyebrow: string; entries: WritingEntry[]; loading: boolean; onBack: () => void; onOpen: (entry: WritingEntry) => void }) {
  const { t } = useTranslation("exam");
  const ds = useDs();
  const [filter, setFilter] = useState<WritingFilter>("all");
  const states = entries.map((entry) => ({ entry, state: writingState(entry) }));
  const counts = { all: states.length, ungraded: states.filter(({ state }) => state.teacher === null).length, ai: states.filter(({ state }) => state.ai !== null).length };
  const visible = states.filter(({ state }) => (filter === "ungraded" ? state.teacher === null : filter === "ai" ? state.ai !== null : true));

  return (
    <Page>
      <Header title={t("mock.mobile.essaysTitle")} icon="close" label={t("mock.mobile.back")} onBack={onBack} />
      <DsText v="body-sm" c="ink-secondary" style={styles.mt16}>
        {eyebrow}
      </DsText>
      <View style={styles.filters}>
        {(["all", "ungraded", "ai"] as const).map((id) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === id }}
            onPress={() => setFilter(id)}
            style={[styles.filter, { backgroundColor: filter === id ? ds.c.brand : ds.c.surface }]}
          >
            <DsText v="caption-strong" c={filter === id ? "on-action" : "ink"}>
              {t(`mock.mobile.essayFilters.${id}`, { count: counts[id] })}
            </DsText>
          </Pressable>
        ))}
      </View>

      {loading ? <MobileListSkeleton card rows={3} style={styles.mt12} /> : null}

      <View style={styles.essays}>
        {visible.map(({ entry, state }) => {
          const statusColor: DsColor = state.teacher !== null ? "success-fg" : state.tooShort ? "error-text" : state.ai !== null ? "success-fg" : "brand";
          return (
            <Pressable key={entry.row.studentId} accessibilityRole="button" onPress={() => onOpen(entry)} style={[styles.essay, { backgroundColor: ds.c.surface }]}>
              <View style={styles.essayHead}>
                <DsText v="title-sm" numberOfLines={1} style={styles.grow}>
                  {entry.row.studentName}
                </DsText>
                {state.teacher !== null || state.ai !== null ? (
                  <View style={[styles.essayBand, { backgroundColor: ds.c["brand-subtle"] }]}>
                    <DsText v="caption-strong" c="brand-strong">
                      {band(state.teacher ?? state.ai)}
                    </DsText>
                  </View>
                ) : null}
              </View>
              <DsText v="body-sm" c="ink-secondary" numberOfLines={2} style={styles.essayText}>
                {state.text ? `${state.task ? `Task ${state.task}: ` : ""}“${excerpt(state.text)}”` : t("mock.mobile.noEssay")}
              </DsText>
              <View style={styles.essayFoot}>
                <DsText v="caption" w={state.tooShort ? undefined : "400"} c={state.tooShort ? "error-text" : "ink-secondary"}>
                  {state.tooShort && state.minWords ? t("mock.mobile.wordsShort", { count: state.words, min: state.minWords }) : t("results.wordCount", { count: state.words })}
                </DsText>
                <DsText v="caption" c={statusColor}>
                  {state.teacher !== null
                    ? t("mock.mobile.byTeacher", { value: band(state.teacher) })
                    : state.tooShort
                      ? t("mock.mobile.tooShort")
                      : state.ai !== null
                        ? t("mock.mobile.byAi", { value: band(state.ai) })
                        : t("mock.mobile.ungraded")}
                </DsText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Page>
  );
}

function WritingAi({
  title,
  detail,
  requesting,
  onBack,
  onRequest,
  onApply,
}: {
  title: string;
  detail: ExamStudentResultDetail | undefined;
  requesting: boolean;
  onBack: () => void;
  onRequest: () => void;
  onApply: (band: number) => void;
}) {
  const { t } = useTranslation("exam");
  const ds = useDs();
  const ai = detail?.writingAi ?? null;
  const items = ai?.status === "done" ? ai.items : [];

  return (
    <Page
      footer={
        <MobileActionBar>
          <MobileButton variant="secondary" label={t("mock.mobile.askAgain")} disabled={requesting || ai?.status === "queued"} style={styles.askAgain} onPress={onRequest} />
          <MobileButton label={t("writingAi.apply")} disabled={ai?.suggestedBand == null} style={styles.apply} onPress={() => ai?.suggestedBand != null && onApply(ai.suggestedBand)} />
        </MobileActionBar>
      }
    >
      <Header title={title} icon="close" label={t("mock.mobile.back")} onBack={onBack} />

      {!ai || ai.status !== "done" ? (
        <View style={[styles.aiEmpty, { backgroundColor: ds.c.surface }]}>
          <DsText v="body-sm" c="ink-secondary" style={styles.center}>
            {!ai ? t("writingAi.ask") : ai.status === "queued" ? t("writingAi.queued") : t("writingAi.failed", { error: ai.error })}
          </DsText>
        </View>
      ) : null}

      {items.map((item, index) => (
        <View key={`${item.task}-${index}`} style={styles.aiItem}>
          <View style={[styles.aiCard, { backgroundColor: ds.c.surface }]}>
            <View style={styles.aiHead}>
              <View style={[styles.bandBox, { backgroundColor: ds.c.brand }]}>
                <DsText heading w="600" c="on-action" style={styles.bandValue}>
                  {band(item.overallBand)}
                </DsText>
                <DsText v="caption" w="400" c="on-action">
                  {t("mock.mobile.band")}
                </DsText>
              </View>
              <View style={styles.grow}>
                <View style={styles.aiTitle}>
                  <Icon name="sparkles-fill" size={16} color={ds.c.brand} />
                  <DsText v="body-sm" w="600" c="brand">
                    {t("mock.mobile.aiCriteria")}
                  </DsText>
                </View>
                <DsText v="caption" w="400" c="ink-secondary">
                  {t("mock.mobile.wordsTask", { count: item.wordCount, task: item.task })}
                </DsText>
                <DsText v="caption" w="400" c="ink-secondary">
                  {t("writingAi.teacherConfirms")}
                </DsText>
              </View>
            </View>
            <View style={styles.criteria}>
              {item.criteria.map((criterion) => (
                <View key={criterion.key} style={styles.criterion}>
                  <View style={styles.sectionHead}>
                    <DsText v="body-sm" style={styles.shrink}>
                      {criterion.title}
                    </DsText>
                    <DsText v="body-sm" w="600">
                      {band(criterion.band)}
                    </DsText>
                  </View>
                  <View style={[styles.thinBar, { backgroundColor: ds.c.subtle }]}>
                    <View style={[styles.barFill, { width: `${Math.min(100, (criterion.band / 9) * 100)}%`, backgroundColor: ds.c.brand }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {item.errors.length ? (
            <AiSection icon="warning-fill" color={ds.c.danger} title={t("writingAi.errors")}>
              {item.errors.map((error, errorIndex) => (
                <DsText key={errorIndex} v="body-sm">
                  • “{error.quote}”{error.correction ? ` → “${error.correction}”` : ""}
                  {error.issue ? ` (${error.issue})` : ""}
                </DsText>
              ))}
            </AiSection>
          ) : null}

          {item.strengths.length ? (
            <AiSection icon="check-circle" color={ds.c.success} title={t("writingAi.strengths")}>
              {item.strengths.map((text) => (
                <DsText key={text} v="body-sm">
                  • {text}
                </DsText>
              ))}
            </AiSection>
          ) : null}

          {item.upgradedParagraph ? (
            <AiSection icon="sparkles-fill" color={ds.c.brand} title={t("mock.mobile.upgraded")}>
              <DsText v="body-sm">• “{item.upgradedParagraph}”</DsText>
            </AiSection>
          ) : null}
        </View>
      ))}
    </Page>
  );
}

function AiSection({ icon, color, title, children }: { icon: "warning-fill" | "check-circle" | "sparkles-fill"; color: string; title: string; children: ReactNode }) {
  const ds = useDs();
  return (
    <View style={[styles.aiSection, { backgroundColor: ds.c.surface }]}>
      <View style={styles.aiTitle}>
        <Icon name={icon} size={18} color={color} />
        <DsText v="body-sm" w="600">
          {title}
        </DsText>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  center: { textAlign: "center" },
  upper: { textTransform: "uppercase" },
  mt3: { marginTop: 3 },
  mt10: { marginTop: 10 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  mt22: { marginTop: 22 },
  /* `px-4 pt-5 pb-8` */
  page: { paddingHorizontal: 16 },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { flex: 1, minWidth: 0, textAlign: "center" },
  headerSplit: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  spacer: { width: 44, height: 44 },
  tiles: { flexDirection: "row", gap: 8 },
  tileCell: { flex: 1, flexBasis: 0 },
  tile: { height: 63, justifyContent: "center", paddingHorizontal: 12, borderRadius: dsRadius.lg },
  tileValue: { fontSize: 20, lineHeight: 24 },
  live: { marginTop: 16, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 15, borderRadius: dsRadius.xl },
  liveHead: { height: 24, flexDirection: "row", alignItems: "center", gap: 8 },
  liveBadge: { height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, borderRadius: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveClock: { marginTop: 10, fontSize: 40, lineHeight: 48 },
  studentsHead: { marginTop: 17 },
  liveList: { marginTop: 12, gap: 31, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 16, borderRadius: dsRadius.xl },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  liveName: { flexDirection: "row", alignItems: "center", gap: 8 },
  awayChip: { height: 24, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, borderRadius: 12 },
  progress: { marginTop: 4, height: 4, overflow: "hidden", borderRadius: 2 },
  progressFill: { height: "100%", borderRadius: 2 },
  sectionCard: { marginTop: 20, padding: 16, borderRadius: dsRadius.xl },
  sectionList: { marginTop: 10, gap: 10 },
  sectionItem: { gap: 8 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  bar: { height: 8, overflow: "hidden", borderRadius: 4 },
  thinBar: { height: 6, overflow: "hidden", borderRadius: 3 },
  barFill: { height: "100%", borderRadius: 4 },
  scoreChip: { height: 28, justifyContent: "center", paddingHorizontal: 10, borderRadius: 14 },
  filters: { marginTop: 12, flexDirection: "row", gap: 8 },
  filter: { height: 22, justifyContent: "center", paddingHorizontal: 10, borderRadius: 11 },
  essays: { marginTop: 12, gap: 12 },
  essay: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 14, borderRadius: dsRadius.xl },
  essayHead: { height: 24, flexDirection: "row", alignItems: "center", gap: 12 },
  essayBand: { height: 24, justifyContent: "center", paddingHorizontal: 8, borderRadius: 12 },
  essayText: { marginTop: 7 },
  essayFoot: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  aiEmpty: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 32, borderRadius: dsRadius.xl },
  aiItem: { marginTop: 16, gap: 12 },
  aiCard: { padding: 16, borderRadius: dsRadius.xl },
  aiHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  bandBox: { width: 72, height: 72, alignItems: "center", justifyContent: "center", borderRadius: dsRadius.lg },
  bandValue: { fontSize: 22, lineHeight: 28 },
  aiTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  criteria: { marginTop: 10, gap: 10 },
  criterion: { gap: 4 },
  aiSection: { gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderRadius: dsRadius.xl },
  askAgain: { flex: 0.8, paddingHorizontal: 12 },
  apply: { flex: 1.2, paddingHorizontal: 12 },
});
