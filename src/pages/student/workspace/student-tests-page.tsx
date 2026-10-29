import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { quizDisplayTitle } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import type { QuizSummary, StudentAttemptSummary } from "@/shared/types";
import { DsGradient, DsText, dsRadius, Icon, MobileEmptyCard, MobilePageHeader, MobileRoundButton, MobileSegment, PullRefresh, Sheet, useDs } from "@/shared/ui";
import { shortDateTime } from "../lib/format";
import { useStudentWorkspace } from "./use-student-workspace";

type Filter = "all" | "new" | "solved" | "overdue";

const FILTERS: Filter[] = ["all", "new", "solved", "overdue"];

/**
 * O'quvchining testlari — veb `student-tests-page.tsx` (tor ekran): filtr
 * chiplari (soni bilan), fan bo'yicha bo'limlar, test kartalari ("Yechish"
 * yoki "Natija" / "Qayta yechish") va urinishlar oynasi.
 */
export function StudentTestsPage() {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const data = useStudentWorkspace();
  const [filter, setFilter] = useState<Filter>("all");
  const [attemptsOpen, setAttemptsOpen] = useState(false);

  const stateOf = (quiz: QuizSummary): Exclude<Filter, "all"> =>
    data.attemptByQuiz.has(quiz.id) ? "solved" : quiz.dueAt && new Date(quiz.dueAt).getTime() < data.now.getTime() ? "overdue" : "new";
  const counts = FILTERS.reduce<Record<Filter, number>>(
    (acc, item) => ({ ...acc, [item]: item === "all" ? data.quizzes.length : data.quizzes.filter((quiz) => stateOf(quiz) === item).length }),
    { all: 0, new: 0, solved: 0, overdue: 0 }
  );
  const chips = FILTERS.map((item) => ({ id: item, label: `${t(`workspace.tests.filters.${item}`)} · ${counts[item]}` }));
  const visible = data.quizzes.filter((quiz) => filter === "all" || stateOf(quiz) === filter);
  const sections = [...new Set(visible.map((quiz) => quiz.subjectLabel || t("workspace.tests.otherSubject")))].map(
    (label) => [label, visible.filter((quiz) => (quiz.subjectLabel || t("workspace.tests.otherSubject")) === label)] as const
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.student.workspace as never));

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        refreshControl={<PullRefresh onRefresh={() => queryClient.refetchQueries({ type: "active" })} />}
      >
        <DsGradient name="auth" />
        <MobilePageHeader
          title={t("workspace.tests.title")}
          backLabel={t("workspace.back")}
          onBack={goBack}
          action={<MobileRoundButton icon="history" iconSize={22} label={t("workspace.tests.attempts")} onPress={() => setAttemptsOpen(true)} />}
        />
        <MobileSegment scroll="auto" items={chips} value={filter} onChange={setFilter} />

        {data.quizzesLoading ? (
          <View style={styles.list}>
            {Array.from({ length: 4 }, (_, index) => (
              <View key={index} style={[styles.skeleton, { backgroundColor: ds.c.surface }]}>
                <View style={styles.skeletonHead}>
                  <View style={[styles.skeletonIcon, { backgroundColor: ds.c.skeleton }]} />
                  <View style={styles.skeletonLines}>
                    <View style={[styles.skeletonLine, { width: 176, backgroundColor: ds.c.skeleton }]} />
                    <View style={[styles.skeletonLine, styles.skeletonShort, { backgroundColor: ds.c.skeleton }]} />
                  </View>
                </View>
                <View style={[styles.skeletonButton, { backgroundColor: ds.c.skeleton }]} />
              </View>
            ))}
          </View>
        ) : null}

        {sections.map(([label, rows]) => (
          <View key={label} style={styles.section}>
            <DsText v="overline" c="ink-secondary" style={styles.upper}>
              {label}
            </DsText>
            <View style={styles.list}>
              {rows.map((quiz) => (
                <TestCard
                  key={quiz.id}
                  quiz={quiz}
                  attempt={data.attemptByQuiz.get(quiz.id) ?? null}
                  overdue={stateOf(quiz) === "overdue"}
                  onSolve={() => router.push(ROUTES.student.test(quiz.id) as never)}
                  onResult={() => router.push(ROUTES.student.testResults(quiz.id) as never)}
                />
              ))}
            </View>
          </View>
        ))}

        {!data.quizzesLoading && !visible.length ? (
          <MobileEmptyCard icon="quiz" title={t("workspace.tests.emptyTitle")} description={t("workspace.tests.emptyHint")} />
        ) : null}
      </ScrollView>

      <AttemptsSheet
        open={attemptsOpen}
        onClose={() => setAttemptsOpen(false)}
        attempts={data.attempts}
        months={months}
        onOpen={(attempt) => {
          setAttemptsOpen(false);
          router.push(ROUTES.student.testResults(attempt.quizId) as never);
        }}
      />
    </View>
  );
}

function TestCard({ quiz, attempt, overdue, onSolve, onResult }: { quiz: QuizSummary; attempt: StudentAttemptSummary | null; overdue: boolean; onSolve: () => void; onResult: () => void }) {
  const { t } = useTranslation("student");
  const ds = useDs();
  const percent = attempt ? Math.round(attempt.percentage ?? 0) : null;
  return (
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, { backgroundColor: ds.c["accent-violet-bg"] }]}>
          <Icon name="quiz" size={20} color={ds.c["accent-violet-fg"]} />
        </View>
        <View style={styles.grow}>
          <DsText v="title" numberOfLines={1}>
            {quizDisplayTitle(quiz)}
          </DsText>
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
            {t("workspace.tests.meta", { subject: quiz.subjectLabel || t("workspace.tests.otherSubject"), count: quiz.questionCount })}
          </DsText>
        </View>
        {percent !== null ? (
          <View style={[styles.chip, { backgroundColor: ds.c["success-bg"] }]}>
            <Icon name="check-circle" size={14} color={ds.c["success-fg"]} />
            <DsText v="caption-strong" c="success-fg">
              {t("workspace.tests.solvedChip", { value: percent })}
            </DsText>
          </View>
        ) : overdue ? (
          <View style={[styles.chip, { backgroundColor: ds.c["danger-bg"] }]}>
            <Icon name="clock" size={14} color={ds.c["error-text"]} />
            <DsText v="caption-strong" c="error-text">
              {t("workspace.tests.overdueChip")}
            </DsText>
          </View>
        ) : null}
      </View>
      {attempt ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={onResult}
            style={({ pressed }) => [styles.action, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
          >
            <Icon name="bar-chart" size={18} color={ds.c.ink} />
            <DsText v="button">{t("workspace.tests.result")}</DsText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onSolve} style={({ pressed }) => [styles.action, { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }]}>
            <Icon name="refresh" size={18} color={ds.c.brand} />
            <DsText v="button" c="brand">
              {t("workspace.tests.retry")}
            </DsText>
          </Pressable>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={onSolve} style={({ pressed }) => [styles.solve, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}>
          <Icon name="send" size={18} color={ds.c["ink-inverse"]} />
          <DsText v="button" c="ink-inverse">
            {t("workspace.tests.solve")}
          </DsText>
        </Pressable>
      )}
    </View>
  );
}

function AttemptsSheet({
  open,
  onClose,
  attempts,
  months,
  onOpen,
}: {
  open: boolean;
  onClose: () => void;
  attempts: StudentAttemptSummary[];
  months: string[];
  onOpen: (attempt: StudentAttemptSummary) => void;
}) {
  const { t } = useTranslation("student");
  const ds = useDs();
  const rows = [...attempts].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  return (
    <Sheet variant="app" open={open} onClose={onClose} title={t("workspace.tests.attemptsTitle")} description={t("workspace.tests.attemptsSubtitle")}>
      {rows.length ? (
        <View style={styles.attempts}>
          {rows.map((attempt) => (
            <Pressable
              key={`${attempt.quizId}-${attempt.takenAt}`}
              accessibilityRole="button"
              onPress={() => onOpen(attempt)}
              style={({ pressed }) => [styles.attempt, pressed && { backgroundColor: ds.c.subtle }]}
            >
              <View style={[styles.cardIcon, { backgroundColor: ds.c["accent-violet-bg"] }]}>
                <Icon name="quiz" size={20} color={ds.c["accent-violet-fg"]} />
              </View>
              <View style={styles.grow}>
                <DsText v="title" numberOfLines={1}>
                  {attempt.quizTitle}
                </DsText>
                <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                  {[attempt.courseTitle, shortDateTime(attempt.takenAt, months)].filter(Boolean).join(" · ")}
                </DsText>
              </View>
              <DsText v="title">{Math.round(attempt.percentage ?? 0)}%</DsText>
              <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
            </Pressable>
          ))}
        </View>
      ) : (
        <DsText v="body-sm" c="ink-secondary" style={styles.attemptsEmpty}>
          {t("workspace.tests.attemptsEmpty")}
        </DsText>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  upper: { textTransform: "uppercase" },
  /* `gap-5 px-4 pt-5 pb-32` */
  page: { gap: 20, paddingHorizontal: 16 },
  section: { gap: 12 },
  list: { gap: 16 },
  /* `gap-3.5 rounded-2xl p-4` */
  card: { gap: 14, padding: 16, borderRadius: dsRadius["2xl"] },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  chip: { height: 24, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, borderRadius: 12 },
  actions: { flexDirection: "row", gap: 8 },
  action: { flex: 1, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 22 },
  solve: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 22 },
  skeleton: { height: 132, gap: 16, padding: 16, borderRadius: dsRadius["2xl"] },
  skeletonHead: { flexDirection: "row", gap: 12 },
  skeletonIcon: { width: 40, height: 40, borderRadius: dsRadius.xl },
  skeletonLines: { flex: 1, gap: 8, paddingTop: 4 },
  skeletonLine: { height: 14, maxWidth: "100%", borderRadius: 7 },
  skeletonShort: { width: 112, height: 12 },
  skeletonButton: { height: 44, borderRadius: 22 },
  attempts: { marginHorizontal: -4 },
  attempt: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4, paddingVertical: 12, borderRadius: dsRadius.xl },
  attemptsEmpty: { paddingVertical: 32, textAlign: "center" },
});
