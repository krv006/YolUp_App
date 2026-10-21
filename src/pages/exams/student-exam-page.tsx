import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ExamRunner, useExam, useExamCurrent } from "@/modules/exam";
import { NotificationBell } from "@/modules/notification";
import { AppBar, AppBarAction, Screen, ScreenError, ScreenLoading } from "@/shared/ui";

/** Imtihonni topshirish sahifasi — veb `pages/student/exams/student-exam-page.tsx` porti. */
export function StudentExamPage() {
  const { t } = useTranslation("exam");
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const router = useRouter();
  const { t: tn } = useTranslation("nav");
  const { t: tw } = useTranslation("workspace");
  // Vebda bu sahifa ham umumiy tepa panel ostida ochiladi.
  const appBar = (
    <AppBar title={tn("titles.workspace")} back={{ label: tw("searchBack"), onPress: () => router.replace("/student/exams") }}>
      <AppBarAction name="search" label={tw("searchAria")} onPress={() => router.push("/student/search")} />
      <NotificationBell />
    </AppBar>
  );
  const exam = useExam(examId ?? null);
  const current = useExamCurrent(examId ?? null);

  if (current.isLoading || exam.isLoading) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenLoading label={t("runner.loading")} />
      </Screen>
    );
  }
  if (current.isError) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenError message={current.error?.message ?? t("runner.loadError")} onRetry={() => void current.refetch()} />
      </Screen>
    );
  }
  if (!current.data) return null;

  return (
    <Screen padded={false}>
      {appBar}
      <ExamRunner
        key={current.data.item?.key ?? "none"}
        examId={examId as string}
        title={exam.data?.title ?? ""}
        current={current.data}
        onRefresh={() => void current.refetch()}
        onExit={() => router.replace("/student/exams")}
      />
    </Screen>
  );
}
