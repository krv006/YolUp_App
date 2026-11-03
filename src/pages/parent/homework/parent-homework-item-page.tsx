import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { ROUTES } from "@/shared/config";
import { MobilePageHeader, useDs } from "@/shared/ui";
import { ParentScreen, useParentBack } from "@/widgets/parent-shell";
import { HomeworkDetail } from "./homework-detail";
import { useHomeworkView } from "./use-homework-view";

/** Vazifa sahifasi — veb `parent-homework-item-page.tsx` (faqat telefon). */
export function ParentHomeworkItemPage({ assignmentId }: { assignmentId: string }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const back = useParentBack(ROUTES.parent.homework);
  const view = useHomeworkView();
  const assignment = view.assignments.find((item) => item.id === assignmentId) ?? null;
  if (!view.loading && !assignment) return <Redirect href={ROUTES.parent.homework as never} />;

  return (
    <ParentScreen onRefresh={async () => view.retry()}>
      <MobilePageHeader title={t("mobile.homework.title")} backLabel={t("homeworkView.title")} onBack={back} />
      {assignment ? (
        <HomeworkDetail
          assignment={assignment}
          assignments={view.assignments}
          course={view.courseById.get(assignment.courseId)}
          childId={view.child?.id ?? null}
          childName={view.child?.name ?? ""}
          now={view.now}
        />
      ) : (
        <View style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />
      )}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  skeleton: { height: 420, borderRadius: 24 },
});
