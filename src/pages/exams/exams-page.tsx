import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { ClipboardCheck, Pencil, Plus, Trash2 } from "lucide-react-native";
import { useCourses } from "@/modules/course";
import { useQuizzes } from "@/modules/quiz";
import {
  ExamCreateSheet,
  ExamResultsSheet,
  ExamTemplateSheet,
  useCreateExam,
  useCreateExamTemplate,
  useDeleteExam,
  useExamTemplates,
  useExams,
} from "@/modules/exam";
import { formatDayTime } from "@/shared/lib";
import type { ExamSummary } from "@/shared/types";
import {
  Badge,
  Button,
  Card,
  ConfirmSheet,
  IconButton,
  Screen,
  ScreenEmpty,
  ScreenError,
  ScreenHeader,
  ScreenLoading,
  Text,
  useTheme,
} from "@/shared/ui";

export interface ExamsPageProps {
  role: "teacher" | "student";
  basePath: string;
}

/** Imtihonlar ro'yxati — o'qituvchida yaratish va natijalar, o'quvchida kirish. */
export function ExamsPage({ role, basePath }: ExamsPageProps) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const router = useRouter();
  const exams = useExams(null);
  const courses = useCourses();
  const quizzes = useQuizzes(null, role === "teacher");
  const templates = useExamTemplates(role === "teacher");
  const create = useCreateExam();
  const createTemplate = useCreateExamTemplate();
  const remove = useDeleteExam();
  const [createOpen, setCreateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [resultsOf, setResultsOf] = useState<ExamSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamSummary | null>(null);

  if (exams.isLoading) {
    return (
      <Screen>
        <ScreenLoading label={t("list.loading")} />
      </Screen>
    );
  }

  if (exams.isError) {
    return (
      <Screen>
        <ScreenError message={t("list.loadError")} onRetry={() => void exams.refetch()} />
      </Screen>
    );
  }

  const list = exams.data ?? [];
  const courseOptions = (courses.data ?? []).map((course) => ({ id: course.id, title: course.title }));

  return (
    <Screen padded={false}>
      <ScreenHeader
        title={t("list.title")}
        subtitle={role === "teacher" ? t("teacherList.subtitle") : t("list.subtitle")}
      />

      <ScrollView contentContainerStyle={styles.body}>
        {role === "teacher" ? (
          <Button
            title={t("teacherList.createButton")}
            icon={<Plus size={16} color={palette["primary-foreground"]} />}
            disabled={!courseOptions.length}
            onPress={() => setCreateOpen(true)}
          />
        ) : null}

        {list.length === 0 ? (
          <ScreenEmpty title={role === "teacher" ? t("teacherList.empty") : t("list.empty")} />
        ) : (
          list.map((exam) => (
            <Card key={exam.id} style={styles.card}>
              <View style={styles.cardHead}>
                <ClipboardCheck size={18} color={palette["primary-text"]} />
                <Text variant="label" style={styles.cardTitle} numberOfLines={2}>
                  {exam.title}
                </Text>
                <Badge
                  label={t(`state.${exam.state}`)}
                  tone={exam.state === "running" ? "success" : exam.state === "finished" ? "neutral" : "brand"}
                />
              </View>

              <Text variant="caption" tone="muted">
                {exam.courseTitle ? `${exam.courseTitle} · ` : ""}
                {formatDayTime(exam.startsAt)} · {t("list.minutes", { count: exam.totalMinutes })}
              </Text>

              <View style={styles.actions}>
                {role === "teacher" ? (
                  <>
                    <Button
                      variant="secondary"
                      title={t("teacherList.results")}
                      onPress={() => setResultsOf(exam)}
                    />
                    {exam.state === "upcoming" ? (
                      <>
                        <IconButton
                          accessibilityLabel={t("teacherList.editAria")}
                          onPress={() => router.push(`${basePath}/${exam.id}`)}
                        >
                          <Pencil size={18} color={palette.foreground} />
                        </IconButton>
                        <IconButton
                          accessibilityLabel={t("teacherList.deleteAria")}
                          onPress={() => setDeleteTarget(exam)}
                        >
                          <Trash2 size={18} color={palette.destructive} />
                        </IconButton>
                      </>
                    ) : null}
                  </>
                ) : (
                  <Button
                    title={exam.state === "finished" ? t("list.openResult") : t("list.enter")}
                    variant={exam.state === "running" ? "primary" : "secondary"}
                    disabled={exam.state === "upcoming"}
                    onPress={() => router.push(`${basePath}/${exam.id}`)}
                  />
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {role === "teacher" ? (
        <>
          <ExamCreateSheet
            open={createOpen}
            pending={create.isPending}
            courses={courseOptions}
            templates={templates.data ?? []}
            quizzes={quizzes.data ?? []}
            onClose={() => setCreateOpen(false)}
            onCreateTemplate={() => setTemplateOpen(true)}
            onCreate={(values) => void create.mutateAsync(values).then(() => setCreateOpen(false))}
          />

          <ExamTemplateSheet
            open={templateOpen}
            pending={createTemplate.isPending}
            onClose={() => setTemplateOpen(false)}
            onCreate={(values) =>
              void createTemplate.mutateAsync(values).then(() => setTemplateOpen(false))
            }
          />

          <ExamResultsSheet exam={resultsOf} onClose={() => setResultsOf(null)} />

          <ConfirmSheet
            open={Boolean(deleteTarget)}
            title={t("teacherList.deleteTitle")}
            description={deleteTarget ? t("teacherList.deleteDescription", { title: deleteTarget.title }) : ""}
            confirmLabel={t("teacherList.delete")}
            loading={remove.isPending}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() =>
              void remove.mutateAsync(deleteTarget?.id as string).then(() => setDeleteTarget(null))
            }
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { gap: 8 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
});
