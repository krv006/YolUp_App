import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useMyAnalytics } from "@/modules/analytics";
import { formatCountdown, useQuizSessionsLeft } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import type { Assignment, QuizSummary } from "@/shared/types";
import { dsRadius, MobileEmptyCard, useDs } from "@/shared/ui";
import { PanelHeading } from "@/widgets/group-workspace/panel-heading";
import { TaskCards, type TaskRow } from "@/widgets/group-workspace/task-cards";
import { useAssignmentRows } from "./use-assignment-rows";

export interface StudentTasksProps {
  assignments: Assignment[];
  quizzes: QuizSummary[];
  loading: boolean;
  courseTitle: string;
  courseImage?: string | null;
  courseTone?: string;
}

/**
 * Guruhdagi vazifa va testlar (o'quvchi) — veb `student-tasks.tsx`: vazifalar
 * va testlar bitta ro'yxatda (`TaskCards`); test yechilgan bo'lsa natija,
 * aks holda "Yechish"; boshlangan seansda "Davom etish · 12:34" jonli taymer,
 * urinishlar tugaganda "Urinishlar tugagan".
 */
export function StudentTasks({ assignments, quizzes, loading, courseTitle, courseImage, courseTone }: StudentTasksProps) {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const ds = useDs();
  const router = useRouter();
  const analytics = useMyAnalytics();
  const assignmentRow = useAssignmentRows();
  const sessions = useQuizSessionsLeft(quizzes);

  const attempts = new Map((analytics.data?.kind === "student" ? analytics.data.recentAttempts : []).map((item) => [item.quizId, item]));
  const day = (value: string) => {
    const date = new Date(value);
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;
  };
  const assignmentRows: TaskRow[] = assignments.filter((item) => item.status !== "draft").map(assignmentRow);

  const quizRows: TaskRow[] = quizzes
    .filter((quiz) => quiz.status !== "draft")
    .map((quiz) => {
      const attempt = attempts.get(quiz.id);
      const left = sessions.get(quiz.id) ?? null;
      const locked = left === null && !attempt && quiz.attemptsLeft === 0;
      const open = () =>
        router.push((attempt && left === null ? ROUTES.student.testResults(quiz.id) : ROUTES.student.test(quiz.id)) as never, { withAnchor: true });
      return {
        id: `quiz-${quiz.id}`,
        quizId: quiz.id,
        title: quiz.title,
        meta: [
          t("groupWorkspace.tasks.quizMeta", { count: quiz.questionCount }),
          attempt || left !== null || locked ? "" : quiz.dueAt ? t("groupWorkspace.tasks.due", { date: day(quiz.dueAt) }) : t("groupWorkspace.tasks.noDue"),
        ]
          .filter(Boolean)
          .join(" · "),
        pill:
          left !== null
            ? { tone: left <= 60 ? "danger" : "brand", icon: "timer", label: t("groupWorkspace.tasks.continue", { time: formatCountdown(left) }) }
            : attempt
              ? { tone: "success", icon: "check-circle", label: t("groupWorkspace.tasks.finished") }
              : locked
                ? { tone: "danger", icon: "lock", label: t("groupWorkspace.tasks.attemptsOver") }
                : { tone: "violet", icon: "edit", label: t("groupWorkspace.tasks.new") },
        aside:
          left !== null || locked
            ? ""
            : attempt
              ? t("groupWorkspace.tasks.result", { value: `${Math.round(attempt.percentage ?? 0)}%` })
              : t("groupWorkspace.tasks.solve"),
        progress: null,
        onOpen: open,
        menu: [
          {
            id: "open",
            label: left !== null ? t("groupWorkspace.tasks.continueAction") : attempt ? t("groupWorkspace.tasks.results") : t("groupWorkspace.tasks.solve"),
            run: open,
          },
        ],
      };
    });

  const rows = [...assignmentRows, ...quizRows];

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.page}>
      <PanelHeading eyebrow={t("groupWorkspace.tasks.eyebrow")} title={t("groupWorkspace.tasks.title")} subtitle={t("groupWorkspace.tasks.subtitle")} />
      {loading && !rows.length ? (
        <View style={styles.list}>
          {Array.from({ length: 4 }, (_, index) => (
            <View key={index} style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />
          ))}
        </View>
      ) : rows.length ? (
        <TaskCards rows={rows} courseTitle={courseTitle} courseImage={courseImage} courseTone={courseTone} />
      ) : (
        <MobileEmptyCard icon="assign" title={t("groupWorkspace.tasks.emptyTitle")} description={t("groupWorkspace.tasks.emptyHint")} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* `gap-5 px-4 pt-5 pb-8` */
  page: { gap: 20, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  list: { gap: 12 },
  skeleton: { height: 112, borderRadius: dsRadius.xl },
});
