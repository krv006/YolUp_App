import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { BookOpen, Check, Coffee, LayoutList } from "lucide-react-native";
import { useQuizColors } from "@/modules/quiz";
import type { ExamTemplate, QuizSummary } from "@/shared/types";
import {
  DateTimeField,
  Input,
  SelectField,
  Sheet,
  SheetButton,
  SheetFooter,
  Text,
  useTheme,
} from "@/shared/ui";
import type { ExamFormValues } from "../api/exam.dto";

/** IELTS shablonidagi bo'lim -> AI sahifasidagi imtihon nomi. */
const AI_EXAM_FOR_SECTION: Record<string, string> = {
  listening: "IELTS Listening",
  reading: "IELTS Academic Reading",
  writing: "IELTS Writing",
};

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

/**
 * Mock test yaratish — veb `modules/exam/ui/exam-create-dialog.tsx` porti.
 *
 * Maydonlar va tekshiruvlar vebdagidek: guruh (bir nechta bo'lsa), shablon,
 * "Yangi shablon", nom, "Hoziroq boshlash" yoki boshlanish sana-vaqti, har
 * bo'lim uchun test va daqiqa. IELTS bo'limlari yonidagi "AI bilan yaratish"
 * havolasi vebda yangi oynada ochiladi; mobilda AI sahifasiga o'tadi.
 */
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
  const colors = useQuizColors();
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState("");
  const courseId = selectedCourse || courses[0]?.id || "";
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [startNow, setStartNow] = useState(false);
  const [sectionQuiz, setSectionQuiz] = useState<Record<string, string>>({});
  const [sectionMinutes, setSectionMinutes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const template = templates.find((item) => item.id === templateId) ?? null;
  const sections = useMemo(() => (template?.items ?? []).filter((item) => item.kind === "section"), [template]);
  const usableQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.status === "published" && quiz.questionCount > 0),
    [quizzes]
  );
  const draftCount = useMemo(
    () => quizzes.filter((quiz) => quiz.status === "draft" && quiz.questionCount > 0).length,
    [quizzes]
  );

  function close() {
    setTemplateId("");
    setTitle("");
    setStartsAt("");
    setStartNow(false);
    setSectionQuiz({});
    setSectionMinutes({});
    setError(null);
    onClose();
  }

  function submit() {
    if (!courseId) return setError(t("createDialog.validation.chooseCourse"));
    if (!template) return setError(t("createDialog.validation.chooseTemplate"));
    if (!title.trim()) return setError(t("createDialog.validation.enterTitle"));
    if (!startNow && !startsAt) return setError(t("createDialog.validation.chooseStart"));
    if (!startNow && new Date(startsAt).getTime() <= Date.now()) {
      return setError(t("createDialog.validation.startInFuture"));
    }
    const missing = sections.find((section) => !sectionQuiz[section.key]);
    if (missing) return setError(t("createDialog.validation.chooseQuiz", { title: missing.title }));
    const used = new Set<string>();
    for (const section of sections) {
      const quizId = sectionQuiz[section.key];
      if (used.has(quizId)) return setError(t("createDialog.validation.quizTwice"));
      used.add(quizId);
    }

    onCreate({
      courseId,
      templateId: template.id,
      title: title.trim(),
      startsAt,
      startNow,
      sections: sections.map((section) => ({
        key: section.key,
        quizId: sectionQuiz[section.key],
        ...(sectionMinutes[section.key] ? { minutes: Number(sectionMinutes[section.key]) } : {}),
      })),
    });
  }

  const iconColor = palette["subtle-foreground"];

  return (
    <Sheet open={open} onClose={close} title={t("createDialog.title")} description={t("createDialog.description")}>
      <View style={styles.form}>
        {courses.length > 1 ? (
          <SelectField
            label={t("createDialog.courseLabel")}
            icon={<BookOpen size={17} color={iconColor} />}
            searchable
            value={courseId}
            onChange={(value) => {
              setSelectedCourse(value);
              setError(null);
            }}
            options={courses.map((course) => ({ value: course.id, label: course.title }))}
          />
        ) : null}

        <SelectField
          label={t("createDialog.templateLabel")}
          icon={<LayoutList size={17} color={iconColor} />}
          value={templateId}
          onChange={(value) => {
            setTemplateId(value);
            setSectionQuiz({});
            setSectionMinutes({});
            setError(null);
          }}
          options={templates.map((item) => ({
            value: item.id,
            label: item.kind === "custom" ? `${item.name} · ${t("createDialog.customTag")}` : item.name,
          }))}
        />
        {/* `.exam-template-link` — matnli havola, tepadan -6 */}
        <Pressable accessibilityRole="button" onPress={onCreateTemplate} style={styles.templateLink}>
          <Text variant="caption" style={[styles.link, { color: palette["primary-text"] }]}>
            {t("createDialog.newTemplate")}
          </Text>
        </Pressable>

        <Input
          label={t("createDialog.titleLabel")}
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setError(null);
          }}
          placeholder={t("createDialog.titlePlaceholder")}
          autoCapitalize="sentences"
        />

        {/* `.exam-start-now` — 16px belgi, 13/700 */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: startNow }}
          onPress={() => {
            setStartNow((current) => !current);
            setError(null);
          }}
          style={styles.startNow}
        >
          <View
            style={[
              styles.check,
              startNow
                ? { backgroundColor: palette.primary, borderColor: palette.primary }
                : { borderColor: colors.borderStrong },
            ]}
          >
            {startNow ? <Check size={11} color="#ffffff" strokeWidth={3} /> : null}
          </View>
          <Text variant="caption" style={styles.startNowText}>
            {t("createDialog.startNow")}
          </Text>
        </Pressable>
        {startNow ? null : (
          <DateTimeField
            label={t("createDialog.startLabel")}
            value={startsAt}
            onChange={(value) => {
              setStartsAt(value);
              setError(null);
            }}
          />
        )}

        {template ? (
          <View style={[styles.sections, { borderColor: colors.border, backgroundColor: colors.surfaceTint }]}>
            <Text variant="caption" style={[styles.sectionsHead, { color: colors.muted }]}>
              {t("createDialog.sectionsHead")}
            </Text>
            {draftCount ? (
              <Text variant="caption" style={{ color: colors.muted }}>
                {t("createDialog.draftsHint", { count: draftCount })}
              </Text>
            ) : null}
            {template.items.map((item) =>
              item.kind === "section" ? (
                <View key={item.key} style={styles.sectionRow}>
                  <View style={styles.sectionTitle}>
                    <Text variant="caption" style={styles.sectionName}>
                      {item.title}
                    </Text>
                    <Text variant="caption" style={[styles.tiny, { color: colors.muted }]}>
                      {item.minutes ? t("createDialog.defaultMinutes", { count: item.minutes }) : ""}
                      {item.manual ? ` · ${t("createDialog.manualSection")}` : ""}
                    </Text>
                  </View>
                  <View style={styles.sectionQuiz}>
                    {AI_EXAM_FOR_SECTION[item.key] && template.id === "ielts" ? (
                      <Pressable
                        accessibilityRole="link"
                        onPress={() => {
                          close();
                          router.push(`/teacher/ai?exam=${encodeURIComponent(AI_EXAM_FOR_SECTION[item.key])}`);
                        }}
                      >
                        <Text variant="caption" style={[styles.link, styles.aiLink, { color: palette["primary-text"] }]}>
                          {t("createDialog.createWithAi")}
                        </Text>
                      </Pressable>
                    ) : null}
                    <SelectField
                      label={t("createDialog.quizLabel")}
                      hideLabel
                      searchable
                      value={sectionQuiz[item.key] ?? ""}
                      onChange={(value) => {
                        setSectionQuiz((current) => ({ ...current, [item.key]: value }));
                        setError(null);
                      }}
                      options={usableQuizzes.map((quiz) => ({
                        value: quiz.id,
                        label: `${quiz.title || quiz.topic} · ${quiz.questionCount}`,
                      }))}
                    />
                  </View>
                  {/* `.exam-template-minutes` — 68x36 maydon va "daq" */}
                  <View style={styles.minutes}>
                    <TextInput
                      value={sectionMinutes[item.key] ?? ""}
                      placeholder={String(item.minutes ?? "")}
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      accessibilityLabel={t("createDialog.minutesLabel", { title: item.title })}
                      onChangeText={(value) => setSectionMinutes((current) => ({ ...current, [item.key]: value }))}
                      style={[
                        styles.minutesInput,
                        { borderColor: colors.borderStrong, backgroundColor: palette.surface, color: colors.foreground },
                      ]}
                    />
                    <Text variant="caption" style={[styles.minutesLabel, { color: colors.muted }]}>
                      {t("templateDialog.minutesShort")}
                    </Text>
                  </View>
                </View>
              ) : (
                <View key={item.key} style={styles.sectionRow}>
                  <View style={styles.sectionTitle}>
                    <View style={styles.breakTitle}>
                      {item.kind === "break" ? <Coffee size={14} color={colors.muted} /> : null}
                      <Text variant="caption" style={[styles.sectionName, { color: colors.muted }]}>
                        {item.title}
                      </Text>
                    </View>
                    <Text variant="caption" style={[styles.tiny, { color: colors.muted }]}>
                      {item.kind === "break"
                        ? t("createDialog.breakMinutes", { count: item.minutes ?? 0 })
                        : t("createDialog.offlineSection")}
                    </Text>
                  </View>
                </View>
              )
            )}
            {!usableQuizzes.length ? (
              <Text variant="caption" style={{ color: colors.muted }}>
                {t("createDialog.noQuizzes")}
              </Text>
            ) : null}
          </View>
        ) : null}

        {error ? (
          <View style={styles.alert}>
            <Text variant="body" style={styles.alertText}>
              {error}
            </Text>
          </View>
        ) : null}
      </View>

      <SheetFooter>
        <SheetButton title={t("createDialog.cancel")} onPress={close} />
        <SheetButton variant="primary" title={t("createDialog.submit")} loading={pending} onPress={submit} />
      </SheetFooter>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  link: { fontSize: 13, fontWeight: "700" },
  templateLink: { alignSelf: "flex-start", marginTop: -6 },
  startNow: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" },
  check: { width: 16, height: 16, borderWidth: 1.5, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  startNowText: { fontSize: 13, fontWeight: "700" },
  /* `.exam-section-list` — bo'shliq 12, chegara 1, radius 13, oraliq 10 */
  sections: { gap: 10, padding: 12, borderWidth: 1, borderRadius: 13 },
  sectionsHead: { fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  sectionRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  sectionTitle: { width: 150, gap: 2 },
  sectionName: { fontSize: 13, fontWeight: "700" },
  breakTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  tiny: { fontSize: 11 },
  sectionQuiz: { flexGrow: 1, minWidth: 180 },
  aiLink: { marginBottom: 4, fontSize: 12 },
  minutes: { flexDirection: "row", alignItems: "center", gap: 5 },
  minutesInput: {
    width: 68,
    minHeight: 36,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Onest-Regular",
  },
  minutesLabel: { fontWeight: "700" },
  /* `.form-alert` */
  alert: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginTop: -4,
    borderWidth: 1,
    borderColor: "#f4dadd",
    borderRadius: 10,
    backgroundColor: "#fff0f2",
  },
  alertText: { fontSize: 15, color: "#b93636" },
});
