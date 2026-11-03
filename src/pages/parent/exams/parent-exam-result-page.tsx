import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { parentResults } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized } from "@/shared/lib";
import { DsText, MobilePageHeader, MobileRoundButton, useDs } from "@/shared/ui";
import { ParentScreen, useParentBack } from "@/widgets/parent-shell";
import { MockResultBody, useResultPdf } from "./mock-result-dialog";
import { useMockView } from "./use-mock-view";

/** Imtihon natijasi sahifasi — veb `parent-exam-result-page.tsx` (faqat telefon), o'ngda PDF. */
export function ParentExamResultPage({ examId }: { examId: string }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const back = useParentBack(ROUTES.parent.exams);
  const view = useMockView();
  const pdf = useResultPdf(view.childId ?? "");

  const exam = view.list.find((item) => item.id === examId) ?? null;
  const result = exam ? (view.byExam.get(exam.id) ?? null) : null;
  if (!view.loading && !exam) return <Redirect href={ROUTES.parent.exams as never} />;

  return (
    <ParentScreen>
      <MobilePageHeader
        title={t("mobile.mock.resultTitle")}
        backLabel={t("results.title")}
        onBack={back}
        action={
          exam && result?.total?.score != null ? (
            <MobileRoundButton icon="download" label={t("mock.result.pdf")} disabled={pdf.pending} onPress={() => void pdf.download(exam)} />
          ) : undefined
        }
      />
      {exam && result ? (
        <>
          <View style={styles.head}>
            <DsText v="title">{exam.title}</DsText>
            <DsText v="body-xs" c="ink-secondary">
              {[formatLocalized(exam.startsAt, t("mock.result.datePattern")), t("mock.minutes", { count: exam.totalMinutes }), exam.courseTitle].filter(Boolean).join(" · ")}
            </DsText>
          </View>
          <MockResultBody result={result} delta={parentResults.previousOverall(exam, view.list, view.byExam)} groupAverage={view.groupAverage.get(exam.id) ?? null} />
        </>
      ) : (
        <View style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />
      )}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 4 },
  skeleton: { height: 360, borderRadius: 24 },
});
