import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCurrentUser } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { useExam, useExamResults, useExamStudentResult } from "@/modules/exam";
import { ROUTES } from "@/shared/config";
import type { ExamSectionResult, ExamWritingAiItem } from "@/shared/types";
import { dsAlpha, DsGradient, DsText, dsRadius, headingFont, MobileActionBar, MobileEmptyCard, MobilePageHeader, toast, useDs, type DsColor } from "@/shared/ui";

function band(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : Number.isInteger(value) ? value.toFixed(1) : String(value);
}

function sectionValue(section: ExamSectionResult): string {
  if (section.score !== null) return band(section.score);
  if (section.percent !== null) return `${Math.round(section.percent)}%`;
  return "—";
}

function sectionShare(section: ExamSectionResult): number {
  if (section.score !== null && section.scaleMax) return (section.score / section.scaleMax) * 100;
  return section.percent ?? 0;
}

function initials(title: string): string {
  return title
    .split(/\s+/)
    .filter((word) => /^[A-Z]/.test(word))
    .map((word) => word[0])
    .join("");
}

/**
 * Mock natijasi — veb `student-mock-result-page.tsx` (tor ekran): umumiy,
 * guruh o'rtachasi va maqsad; bo'limlar bo'yicha ballar, tafsilot, insho va
 * AI baholash; pastda "O'qituvchidan so'rash" / "Mashq qilish".
 */
export function StudentMockResultPage() {
  const { t } = useTranslation("student");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { examId = "" } = useLocalSearchParams<{ examId: string }>();
  const me = useCurrentUser();
  const exam = useExam(examId || null);
  const result = useExamStudentResult(examId || null, me?.id ?? null);
  const group = useExamResults(examId || null);
  const conversations = useConversations("student");

  const data = result.data;
  const ready = Boolean(data?.participated && (data.total || data.sections.length));
  const others = (group.data?.results ?? []).map((row) => row.total?.score ?? null).filter((value): value is number => value !== null);
  const groupAvg = others.length > 1 ? Math.round((others.reduce((sum, value) => sum + value, 0) / others.length) * 2) / 2 : null;
  const essay = data?.manualAnswers.find((answer) => answer.answer.trim().split(/\s+/).length > 30) ?? null;
  const essayWords = essay ? essay.answer.trim().split(/\s+/).length : 0;
  const ai: ExamWritingAiItem | null = data?.writingAi?.status === "done" ? (data.writingAi.items.at(-1) ?? null) : null;
  const room = conversations.data?.find((item) => item.courseId === exam.data?.courseId);

  const askTeacher = () => router.push((room ? ROUTES.student.chat(room.id) : ROUTES.student.chats) as never);
  const practice = () => toast.info(t("workspace.soon"));
  const goBack = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.student.mockExams as never));

  const stats: Array<{ id: string; value: string; tone: DsColor }> = [
    { id: "overall", value: data?.total?.label || band(data?.total?.score), tone: "ink" },
    { id: "group", value: band(groupAvg), tone: "brand" },
    { id: "target", value: "—", tone: "success-fg" },
  ];
  const pending = result.isLoading || exam.isLoading;

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView style={styles.fill} contentContainerStyle={[styles.page, { paddingTop: insets.top + 20 }]}>
        <DsGradient name="auth" />
        <MobilePageHeader title={exam.data?.title ?? ""} backLabel={t("workspace.back")} onBack={goBack} />

        {pending ? (
          <>
            <View style={styles.stats}>
              {Array.from({ length: 3 }, (_, index) => (
                <View key={index} style={[styles.stat, styles.statSkeleton, { backgroundColor: ds.c.surface }]} />
              ))}
            </View>
            <View style={[styles.block, { height: 128, backgroundColor: ds.c.surface }]} />
            <View style={[styles.block, { height: 256, backgroundColor: ds.c.surface }]} />
          </>
        ) : !ready || !data ? (
          <MobileEmptyCard icon="emoji-events" title={t("workspace.mockResult.notReady")} description={t("workspace.mockResult.notReadyHint")} />
        ) : (
          <>
            <View style={styles.stats}>
              {stats.map((stat) => (
                <View key={stat.id} style={[styles.stat, { backgroundColor: ds.c.surface }]}>
                  <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1}>
                    {t(`workspace.mockResult.stats.${stat.id}`)}
                  </DsText>
                  <DsText c={stat.tone} numberOfLines={1} style={styles.statValue}>
                    {stat.value}
                  </DsText>
                </View>
              ))}
            </View>

            <View style={[styles.block, styles.sections, { backgroundColor: ds.c.surface }]}>
              <DsText v="title-lg" w="600">
                {t("workspace.mockResult.sections")}
              </DsText>
              <View style={styles.sectionGrid}>
                {data.sections.map((section) => (
                  <View key={section.key} style={styles.sectionCell}>
                    <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                      {section.title}
                    </DsText>
                    <DsText style={styles.sectionValue}>{sectionValue(section)}</DsText>
                    <View style={[styles.track, { backgroundColor: ds.c.subtle }]}>
                      <View style={[styles.trackFill, { width: `${sectionShare(section)}%`, backgroundColor: ds.c.brand }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.block, styles.details, { backgroundColor: ds.c.surface }]}>
              <DsText v="title-lg" w="600" style={styles.detailsTitle}>
                {t("workspace.mockResult.details")}
              </DsText>
              {data.sections.map((section) => (
                <View key={section.key} style={[styles.detail, { borderTopColor: ds.c.line }]}>
                  <View style={styles.grow}>
                    <DsText v="title" w="500" numberOfLines={1}>
                      {section.title}
                    </DsText>
                    <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1}>
                      {section.manual
                        ? data.pending.includes(section.key)
                          ? t("workspace.mockResult.pending")
                          : t("workspace.mockResult.manual")
                        : section.earned !== null && section.max !== null
                          ? t("workspace.mockResult.correct", { earned: section.earned, max: section.max })
                          : ""}
                    </DsText>
                  </View>
                  <View style={[styles.score, { backgroundColor: ds.c["brand-subtle"] }]}>
                    <DsText v="title" w="600" c="brand">
                      {sectionValue(section)}
                    </DsText>
                  </View>
                </View>
              ))}
            </View>

            {essay ? (
              <View style={[styles.block, styles.essay, { backgroundColor: ds.c.surface }]}>
                <View style={styles.essayHead}>
                  <DsText v="title" w="600" numberOfLines={1} style={styles.grow}>
                    {t("workspace.mockResult.essay", { title: essay.question || essay.section })}
                  </DsText>
                  <View style={[styles.words, { backgroundColor: ds.c.subtle }]}>
                    <DsText v="caption-strong">{t("workspace.mockResult.words", { count: ai?.wordCount ?? essayWords })}</DsText>
                  </View>
                </View>
                <DsText v="body-xs" numberOfLines={3}>
                  “{essay.answer.trim()}”
                </DsText>
              </View>
            ) : null}

            {data.writingAi ? (
              <View style={[styles.block, styles.ai, { backgroundColor: dsAlpha(ds.c.surface, 0.6) }]}>
                {ai ? (
                  <>
                    <View style={styles.aiHead}>
                      <View style={[styles.aiBand, { backgroundColor: ds.c.brand }]}>
                        <DsText c="ink-inverse" style={styles.aiBandText}>
                          {band(ai.overallBand)}
                        </DsText>
                      </View>
                      <View style={styles.grow}>
                        <DsText v="body-sm" w="600" c="brand" numberOfLines={1}>
                          {t("workspace.mockResult.aiTitle")}
                        </DsText>
                        <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1}>
                          {ai.criteria.map((criterion) => `${initials(criterion.title) || criterion.key} ${band(criterion.band)}`).join(" · ")}
                        </DsText>
                      </View>
                    </View>
                    <DsText v="body-xs">
                      {[
                        ai.errors.length
                          ? t("workspace.mockResult.mistakes", {
                              value: ai.errors
                                .slice(0, 2)
                                .map((error) => (error.correction ? `“${error.quote}” → “${error.correction}”` : error.issue))
                                .join(", "),
                            })
                          : "",
                        ai.strengths.length ? t("workspace.mockResult.strengths", { value: ai.strengths.slice(0, 2).join(", ") }) : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </DsText>
                  </>
                ) : (
                  <DsText v="body-sm" c="ink-secondary">
                    {t("workspace.mockResult.aiQueued")}
                  </DsText>
                )}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {ready ? (
        <MobileActionBar>
          <Pressable
            accessibilityRole="button"
            onPress={askTeacher}
            style={({ pressed }) => [styles.footerButton, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
          >
            <DsText v="body-sm" w="600" numberOfLines={1}>
              {t("workspace.mockResult.askTeacher")}
            </DsText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={practice} style={({ pressed }) => [styles.footerButton, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}>
            <DsText v="body-sm" w="600" c="on-action" numberOfLines={1}>
              {t("workspace.mockResult.practice")}
            </DsText>
          </Pressable>
        </MobileActionBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  /* `gap-5 px-4 pt-5 pb-6` */
  page: { gap: 20, paddingHorizontal: 16, paddingBottom: 24 },
  /* `grid-cols-3 gap-3`, karta `rounded-2xl p-4 gap-1` */
  stats: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, minWidth: 0, gap: 4, padding: 16, borderRadius: dsRadius["2xl"] },
  statSkeleton: { height: 93 },
  /* `font-heading text-[26px]/9 font-semibold` */
  statValue: { fontFamily: headingFont("600"), fontSize: 26, lineHeight: 36 },
  block: { borderRadius: dsRadius["2xl"] },
  sections: { gap: 12, padding: 16 },
  /* `grid-cols-2 gap-x-3 gap-y-4` */
  sectionGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 16, columnGap: 12 },
  sectionCell: { width: "47%", flexGrow: 1, minWidth: 0, gap: 4 },
  sectionValue: { fontFamily: headingFont("600"), fontSize: 22, lineHeight: 28 },
  track: { height: 5, overflow: "hidden", borderRadius: 3 },
  trackFill: { height: "100%", borderRadius: 3 },
  /* `px-4 pt-4 pb-2`, qator `min-h-[67px] border-t py-3 gap-3` */
  details: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  detailsTitle: { paddingBottom: 8 },
  detail: { minHeight: 67, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 1 },
  score: { height: 30, justifyContent: "center", paddingHorizontal: 10, borderRadius: 15 },
  essay: { gap: 8, padding: 16 },
  essayHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  words: { height: 24, justifyContent: "center", paddingHorizontal: 8, borderRadius: 12 },
  ai: { gap: 14, padding: 16 },
  aiHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiBand: { width: 56, height: 56, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  aiBandText: { fontFamily: headingFont("600"), fontSize: 20, lineHeight: 26 },
  /* `h-13 flex-1 rounded-full px-3 text-body-sm font-semibold` */
  footerButton: { flex: 1, minWidth: 0, height: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderRadius: 26 },
});
