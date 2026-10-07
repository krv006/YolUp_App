import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Coffee } from "lucide-react-native";
import type { ExamTemplate, QuizSummary } from "@/shared/types";
import {
  Button,
  DateField,
  Input,
  SelectField,
  Sheet,
  Text,
  TimeField,
  useTheme,
  type SelectOption,
} from "@/shared/ui";
import type { ExamFormValues } from "../api/exam.dto";

export interface ExamCreateSheetProps {
  open: boolean;
  pending?: boolean;
  courses: Array<{ id: string; title: string }>;
  templates: ExamTemplate[];
  quizzes: QuizSummary[];
  onClose: () => void;
  onCreate: (values: ExamFormValues) => void;
  onCreateTemplate: () => void;
}

/** Imtihon yaratish — shablon, har bo'limga test va boshlanish vaqti. */
export function ExamCreateSheet({
  open,
  pending = false,
  courses,
  templates,
  quizzes,
  onClose,
  onCreate,
  onCreateTemplate,
}: ExamCreateSheetProps) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const [courseId, setCourseId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [sectionQuiz, setSectionQuiz] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const template = templates.find((item) => item.id === templateId) ?? null;
  const sections = useMemo(
    () => (template?.items ?? []).filter((item) => item.kind === "section"),
    [template]
  );
  const quizOptions: SelectOption[] = useMemo(
    () =>
      quizzes
        .filter((quiz) => quiz.status === "published" && quiz.questionCount > 0)
        .map((quiz) => ({
          value: quiz.id,
          label: `${quiz.title || quiz.topic} · ${quiz.questionCount}`,
        })),
    [quizzes]
  );

  const selectedCourse = courseId || courses[0]?.id || "";

  function submit() {
    if (!selectedCourse) {
      setError(t("createDialog.validation.chooseCourse"));
      return;
    }
    if (!template) {
      setError(t("createDialog.validation.chooseTemplate"));
      return;
    }
    if (!title.trim()) {
      setError(t("createDialog.validation.enterTitle"));
      return;
    }
    if (!date) {
      setError(t("createDialog.validation.chooseStart"));
      return;
    }
    const startsAt = `${date}T${time || "00:00"}`;
    if (new Date(startsAt).getTime() <= Date.now()) {
      setError(t("createDialog.validation.startInFuture"));
      return;
    }
    const missing = sections.find((section) => !sectionQuiz[section.key]);
    if (missing) {
      setError(t("createDialog.validation.chooseQuiz", { title: missing.title }));
      return;
    }
    const used = new Set<string>();
    for (const section of sections) {
      const quizId = sectionQuiz[section.key];
      if (used.has(quizId)) {
        setError(t("createDialog.validation.quizTwice"));
        return;
      }
      used.add(quizId);
    }

    onCreate({
      courseId: selectedCourse,
      templateId: template.id,
      title: title.trim(),
      startsAt,
      sections: sections.map((section) => ({ key: section.key, quizId: sectionQuiz[section.key] })),
    });
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("createDialog.title")} description={t("createDialog.description")}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {courses.length > 1 ? (
          <SelectField
            label={t("createDialog.courseLabel")}
            value={selectedCourse}
            options={courses.map((course) => ({ value: course.id, label: course.title }))}
            onChange={(value) => {
              setCourseId(value);
              setError(null);
            }}
          />
        ) : null}

        <SelectField
          label={t("createDialog.templateLabel")}
          value={templateId}
          options={templates.map((item) => ({
            value: item.id,
            label: item.kind === "custom" ? `${item.name} · ${t("createDialog.customTag")}` : item.name,
          }))}
          onChange={(value) => {
            setTemplateId(value);
            setSectionQuiz({});
            setError(null);
          }}
        />

        <Button variant="ghost" title={t("createDialog.newTemplate")} onPress={onCreateTemplate} />

        <Input
          label={t("createDialog.titleLabel")}
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setError(null);
          }}
          placeholder={t("createDialog.titlePlaceholder")}
        />

        <DateField label={t("createDialog.startLabel")} value={date} onChange={setDate} />
        <TimeField label={t("createDialog.startTimeLabel")} value={time} onChange={setTime} />

        {template ? (
          <View style={styles.sections}>
            <Text variant="caption" tone="muted">
              {t("createDialog.sectionsHead")}
            </Text>
            {template.items.map((item) =>
              item.kind === "section" ? (
                <View key={item.key} style={styles.section}>
                  <Text variant="label">
                    {item.title}
                    {item.manual ? ` · ${t("createDialog.manualSection")}` : ""}
                  </Text>
                  <SelectField
                    label={t("createDialog.quizLabel")}
                    value={sectionQuiz[item.key] ?? ""}
                    options={quizOptions}
                    onChange={(value) => {
                      setSectionQuiz((current) => ({ ...current, [item.key]: value }));
                      setError(null);
                    }}
                  />
                </View>
              ) : (
                <View key={item.key} style={styles.muted}>
                  {item.kind === "break" ? <Coffee size={14} color={palette["muted-foreground"]} /> : null}
                  <Text variant="caption" tone="muted">
                    {item.title}
                    {item.kind === "break"
                      ? ` · ${t("createDialog.breakMinutes", { count: item.minutes ?? 0 })}`
                      : ` · ${t("createDialog.offlineSection")}`}
                  </Text>
                </View>
              )
            )}
            {!quizOptions.length ? (
              <Text variant="caption" tone="muted">
                {t("createDialog.noQuizzes")}
              </Text>
            ) : null}
          </View>
        ) : null}

        {error ? (
          <Text variant="caption" style={{ color: palette.destructive }}>
            {error}
          </Text>
        ) : null}

        <Button title={t("createDialog.submit")} loading={pending} onPress={submit} />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12, paddingBottom: 24 },
  sections: { gap: 12 },
  section: { gap: 6 },
  muted: { flexDirection: "row", alignItems: "center", gap: 6 },
});
