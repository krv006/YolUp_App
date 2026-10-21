import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ClipboardCheck } from "lucide-react-native";
import { ExamResultCard, useExamResults, useExams } from "@/modules/exam";
import { useSelectedChild } from "@/modules/parent";
import { ParentAppBar } from "@/modules/parent/ui/parent-app-bar";
import { toIntlLocale } from "@/shared/i18n/intl-locale";
import { useBackTo } from "@/shared/lib";
import type { ExamSummary } from "@/shared/types";
import { PortalButton, PortalEmpty, PortalHeading, PortalListIcon, portalPage, Screen, ScreenError, ScreenLoading, Sheet, Text, useLegacyColors, useTheme } from "@/shared/ui";

const WORKSPACE_PATH = "/parent/workspace";

/**
 * Farzandning mock testlari — veb `parent-exams-page.tsx`: farzand
 * guruhlaridagi imtihonlar, holat belgisi va tugaganlarida "Natija".
 *
 * Vebda tor ekranda "Natija" tugmasi matn yonida qolib sarlavhani ~125px
 * ga siqib qo'yadi; bu yerda (o'quvchi sahifasidagidek) tugma pastki
 * qatorga tushadi.
 */
export function ParentExamsPage() {
  const { t, i18n } = useTranslation("exam");
  const { t: tn } = useTranslation("nav");
  const { t: ts } = useTranslation("mobile");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const router = useRouter();
  useBackTo(WORKSPACE_PATH);
  const { selectedChild } = useSelectedChild();
  const exams = useExams(null);
  const [resultOf, setResultOf] = useState<ExamSummary | null>(null);

  const appBar = (
    <ParentAppBar
      a11yTitle={tn("parent.exams")}
      back={{ label: ts("shared.orqaga"), onPress: () => router.replace(WORKSPACE_PATH) }}
    />
  );

  if (!selectedChild) {
    return (
      <Screen padded={false}>
        {appBar}
        <View style={portalPage}>
          <PortalEmpty
            icon={ClipboardCheck}
            title={t("parentList.noChildTitle")}
            description={t("parentList.noChildDescription")}
          />
        </View>
      </Screen>
    );
  }

  if (exams.isLoading) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenLoading label={t("list.loading")} />
      </Screen>
    );
  }

  if (exams.isError) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenError message={exams.error?.message ?? t("list.loadError")} onRetry={() => void exams.refetch()} />
      </Screen>
    );
  }

  const list = exams.data ?? [];
  const format = new Intl.DateTimeFormat(toIntlLocale(i18n.language), { dateStyle: "medium", timeStyle: "short" });

  function badgeTone(exam: ExamSummary) {
    if (exam.state === "upcoming") return { bg: palette["primary-tint"], fg: palette["primary-text"] };
    if (exam.state === "running") return { bg: palette["success-soft"], fg: palette["tone-emerald-fg"] };
    return { bg: colors.mutedBg, fg: colors.muted };
  }

  return (
    <Screen padded={false}>
      {appBar}
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={portalPage}
        refreshControl={
          <RefreshControl
            refreshing={exams.isRefetching}
            onRefresh={() => void exams.refetch()}
            tintColor={palette["muted-foreground"]}
          />
        }
      >
        <PortalHeading eyebrow={t("list.eyebrow")} title={selectedChild.name} description={t("parentList.subtitle")} />

        {list.length ? (
          <View style={styles.list}>
            {list.map((exam) => {
              const tone = badgeTone(exam);
              return (
                <View key={exam.id} style={[styles.card, { borderColor: colors.border }]}>
                  <PortalListIcon icon={ClipboardCheck} />
                  <View style={styles.text}>
                    <View style={styles.titleRow}>
                      <Text variant="label" style={styles.cardTitle}>
                        {exam.title}
                      </Text>
                      {/* `.exam-state-badge` — 11/800 katta harf */}
                      <Text variant="caption" style={[styles.badge, { backgroundColor: tone.bg, color: tone.fg }]}>
                        {t(`state.${exam.state}`)}
                      </Text>
                    </View>
                    <Text variant="caption" style={[styles.meta, { color: colors.foreground }]}>
                      {exam.courseTitle ? `${exam.courseTitle} · ` : ""}
                      {format.format(new Date(exam.startsAt))} · {t("list.minutes", { count: exam.totalMinutes })}
                    </Text>
                  </View>
                  {exam.state === "finished" ? (
                    <View style={styles.footer}>
                      <PortalButton size="sm" label={t("list.openResult")} onPress={() => setResultOf(exam)} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <PortalEmpty icon={ClipboardCheck} title={t("list.empty")} />
        )}
      </ScrollView>

      <Sheet
        open={Boolean(resultOf)}
        onClose={() => setResultOf(null)}
        title={t("parentList.resultTitle", { name: selectedChild.name })}
        description={resultOf?.title}
      >
        {resultOf ? <ChildExamResult examId={resultOf.id} childId={selectedChild.id} /> : null}
      </Sheet>
    </Screen>
  );
}

/** Imtihon natijalaridan faqat tanlangan farzandniki — veb `ChildExamResult`. */
function ChildExamResult({ examId, childId }: { examId: string; childId: string }) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const results = useExamResults(examId);

  if (results.isLoading) {
    return (
      <View style={styles.resultState}>
        <ActivityIndicator color={palette.primary} />
        <Text variant="label" tone="muted">
          {t("result.loading")}
        </Text>
      </View>
    );
  }

  const message = results.isError
    ? t("result.loadError")
    : results.data?.hidden
      ? t("parentList.hidden")
      : null;
  const result = results.data?.results.find((item) => item.studentId === childId);
  const note = message ?? (!result ? t("parentList.notInExam") : !result.participated ? t("result.absent") : null);

  if (note || !result) {
    return (
      <Text variant="body" tone="muted" style={styles.resultNote}>
        {note}
      </Text>
    );
  }

  return <ExamResultCard result={result} />;
}

const styles = StyleSheet.create({
  /* `.student-workspace-list` — 15 bo'shliq, orasi 9 */
  list: { gap: 9 },
  /* `article` — 14 bo'shliq, radius 13; tor ekranda tugma pastga tushadi */
  card: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 12, padding: 14, borderWidth: 1, borderRadius: 13 },
  text: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  cardTitle: { fontSize: 14, lineHeight: 21, fontWeight: "700" },
  badge: {
    overflow: "hidden",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    fontSize: 11,
    lineHeight: 16.5,
    fontWeight: "700",
    letterSpacing: 0.44,
    textTransform: "uppercase",
  },
  meta: { fontSize: 12.8, lineHeight: 19.2 },
  // To'liq kenglikdagi qator; ikonka (41) + oraliq (12) ichkarida — tugma matn bilan bir chiziqda boshlanadi.
  footer: { width: "100%", flexDirection: "row", paddingLeft: 53 },
  resultState: { alignItems: "center", gap: 12, paddingVertical: 20 },
  resultNote: { paddingVertical: 12 },
});
