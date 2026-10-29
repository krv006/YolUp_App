import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { quizDisplayTitle, useQuiz, useQuizAttempts, useQuizQuestionStats, useStartAiMiniQuiz } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import type { QuizAttemptResult } from "@/shared/types";
import { DsGradient, DsText, dsAlpha, dsRadius, headingFont, Icon, MobileActionBar, MobileButton, MobileEmptyCard, MobilePageHeader, toast, useDs, type DsColor } from "@/shared/ui";
import { shortDateTime } from "../lib/format";
import { takeFreshResult } from "./fresh-results";

function percentOf(attempt: QuizAttemptResult): number {
  return attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
}

/**
 * Test natijasi — veb `student-test-results-page.tsx` (tor ekran): to'rtta
 * ko'rsatkich, urinishlar ro'yxati, xatolar va AI mashqi; pastda
 * "Qayta yechish".
 */
export function StudentTestResultsPage() {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { quizId = "" } = useLocalSearchParams<{ quizId: string }>();
  const quiz = useQuiz(quizId || null);
  const attempts = useQuizAttempts(quizId || null);
  const practice = useStartAiMiniQuiz();
  const questionStats = useQuizQuestionStats(quizId || null);
  const [fresh] = useState(() => takeFreshResult(quizId));
  const wrongRate = new Map((questionStats.data ?? []).map((item) => [item.questionId, item.wrongRate]));

  const rows = [...(attempts.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latest = fresh ?? rows[0] ?? null;
  const answers = latest?.answers.length ? latest.answers : (rows.find((item) => item.answers.length)?.answers ?? []);
  const mistakes = answers.map((answer, index) => ({ answer, number: index + 1 })).filter((item) => !item.answer.isCorrect);
  const correct = latest ? (latest.correctCount ?? (answers.length ? answers.length - mistakes.length : null)) : null;
  const total = latest ? (latest.questionCount ?? (answers.length || quiz.data?.questionCount || null)) : null;
  const title = quiz.data ? quizDisplayTitle(quiz.data) : "";
  const loading = attempts.isLoading || quiz.isLoading;

  const stats: Array<{ id: string; value: string; tone: DsColor }> = [
    { id: "score", value: latest ? `${percentOf(latest)}%` : "—", tone: "ink" },
    { id: "correct", value: correct !== null && total ? `${correct} / ${total}` : "—", tone: "ink" },
    { id: "group", value: "—", tone: "success-fg" },
    { id: "time", value: latest?.durationSeconds ? t("workspace.results.minutes", { count: Math.max(1, Math.round(latest.durationSeconds / 60)) }) : "—", tone: "ink" },
  ];

  function startPractice() {
    practice.mutate({ quizId, wrongQuestionIds: mistakes.map((item) => item.answer.questionId) }, { onSuccess: () => toast.success(t("workspace.results.ai.started")) });
  }

  const retake = () => router.push(ROUTES.student.test(quizId) as never);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.student.tests as never));

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView style={styles.fill} contentContainerStyle={[styles.page, { paddingTop: insets.top + 20 }]}>
        <DsGradient name="auth" />
        <MobilePageHeader title={title} backLabel={t("workspace.back")} onBack={goBack} />

        {loading ? (
          <>
            <View style={styles.statGrid}>
              {Array.from({ length: 4 }, (_, index) => (
                <View key={index} style={[styles.stat, styles.statSkeleton, { backgroundColor: ds.c.surface }]} />
              ))}
            </View>
            <View style={[styles.tableSkeleton, { backgroundColor: ds.c.surface }]} />
          </>
        ) : !latest ? (
          <MobileEmptyCard icon="quiz" title={t("workspace.results.empty")} description={t("workspace.results.emptyHint")} action={{ label: t("workspace.results.solve"), onPress: retake }} />
        ) : (
          <>
            <View style={styles.statGrid}>
              {stats.map((stat) => (
                <View key={stat.id} style={[styles.stat, { backgroundColor: ds.c.surface }]}>
                  <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                    {t(`workspace.results.stats.${stat.id}`)}
                  </DsText>
                  <DsText c={stat.tone} numberOfLines={1} style={styles.statValue}>
                    {stat.value}
                  </DsText>
                </View>
              ))}
            </View>

            <View style={[styles.table, { backgroundColor: ds.c.surface }]}>
              {rows.map((attempt, index) => {
                const percent = percentOf(attempt);
                return (
                  <View key={attempt.id} style={[styles.row, index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
                    <DsText v="body-sm" numberOfLines={1} style={styles.grow}>
                      {shortDateTime(attempt.createdAt, months)}
                      {index === 0 ? ` · ${t("workspace.results.table.last")}` : ""}
                    </DsText>
                    <View style={styles.result}>
                      <View style={[styles.resultTrack, { backgroundColor: ds.c.subtle }]}>
                        <View style={[styles.resultFill, { width: `${percent}%`, backgroundColor: index === 0 ? ds.c.success : ds.c.brand }]} />
                      </View>
                      <DsText v="caption-strong">{percent}%</DsText>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.section}>
              <DsText v="title">{t("workspace.results.mistakes")}</DsText>
              <View style={[styles.mistakes, { backgroundColor: ds.c.surface }]}>
                {!answers.length ? (
                  <DsText v="body-sm" c="ink-secondary">
                    {t("workspace.results.mistakesUnknown")}
                  </DsText>
                ) : mistakes.length ? (
                  mistakes.map(({ answer, number }) => (
                    <View key={answer.questionId} style={styles.mistake}>
                      <View style={styles.mistakeHead}>
                        <DsText v="body-xs" numberOfLines={1} style={styles.grow}>
                          {t("workspace.results.questionLabel", { n: number, text: answer.questionText.replace(/\{\{\d+\}\}/g, "___") })}
                        </DsText>
                        <DsText v="body-xs" w="600" c="error-text">
                          {t("workspace.results.wrong")}
                        </DsText>
                      </View>
                      {wrongRate.has(answer.questionId) ? (
                        <View style={[styles.resultTrack, styles.wrongTrack, { backgroundColor: ds.c.subtle }]}>
                          <View style={[styles.resultFill, { width: `${wrongRate.get(answer.questionId) ?? 0}%`, backgroundColor: ds.c["error-text"] }]} />
                        </View>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <DsText v="body-sm" c="success-fg">
                    {t("workspace.results.noMistakes")}
                  </DsText>
                )}
              </View>
            </View>

            <View style={[styles.ai, { backgroundColor: dsAlpha(ds.c.surface, 0.6) }]}>
              <View style={styles.aiHead}>
                <Icon name="auto-awesome" size={20} color={ds.c.brand} />
                <DsText v="body-sm" w="600">
                  {t("workspace.results.ai.title")}
                </DsText>
              </View>
              <DsText v="body-xs">{mistakes.length ? t("workspace.results.ai.text", { count: mistakes.length }) : t("workspace.results.ai.textNone")}</DsText>
              {mistakes.length ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={practice.isPending}
                  onPress={startPractice}
                  style={({ pressed }) => [styles.aiButton, { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }, practice.isPending && styles.faded]}
                >
                  <DsText v="body-sm" w="600" c="brand">
                    {t("workspace.results.ai.start")}
                  </DsText>
                </Pressable>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
      {latest ? (
        <MobileActionBar>
          <MobileButton label={t("workspace.results.retry")} onPress={retake} />
        </MobileActionBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.6 },
  /* `gap-5 px-4 pt-5 pb-6` */
  page: { gap: 20, paddingHorizontal: 16, paddingBottom: 24 },
  /* `grid-cols-2 gap-3.5` */
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  stat: { width: "47.5%", flexGrow: 1, gap: 4, paddingHorizontal: 18, paddingVertical: 16, borderRadius: dsRadius["2xl"] },
  statSkeleton: { height: 93 },
  /* `font-heading text-[28px]/9 font-semibold` */
  statValue: { fontFamily: headingFont("600"), fontSize: 28, lineHeight: 36 },
  tableSkeleton: { height: 200, borderRadius: dsRadius["2xl"] },
  /* `rounded-2xl bg-surface p-4`, qator `min-h-[65px] px-1 py-3` */
  table: { padding: 16, borderRadius: dsRadius["2xl"] },
  row: { minHeight: 65, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4, paddingVertical: 12 },
  result: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultTrack: { width: 70, height: 5, overflow: "hidden", borderRadius: 3 },
  wrongTrack: { width: "100%" },
  resultFill: { height: "100%", borderRadius: 3 },
  section: { gap: 12 },
  mistakes: { gap: 12, padding: 16, borderRadius: dsRadius["2xl"] },
  mistake: { gap: 8 },
  mistakeHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  ai: { gap: 12, padding: 16, borderRadius: dsRadius["2xl"] },
  aiHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiButton: { height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21 },
});
