import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ROUTES } from "@/shared/config";
import type { ExamTemplate, QuizSummary } from "@/shared/types";
import {
  DsText,
  dsRadius,
  Icon,
  MobileButton,
  MobileFieldLabel,
  MobilePickerField,
  MobileScreenDialog,
  MobileSelectSheet,
  useDs,
  type IconName,
} from "@/shared/ui";
import type { ExamFormValues } from "../api/exam.dto";

const SECTION_ICON: Record<string, IconName> = {
  listening: "volume-up",
  reading: "menu-book",
  writing: "edit-note",
  speaking: "mic",
};

export interface ExamCreateDialogProps {
  open: boolean;
  pending?: boolean;
  courses: Array<{ id: string; title: string; studentCount?: number }>;
  templates: ExamTemplate[];
  quizzes: QuizSummary[];
  onOpenChange: (open: boolean) => void;
  onCreate: (values: ExamFormValues) => void;
  onCreateTemplate: () => void;
}

function totalMinutes(template: ExamTemplate): number {
  return template.items.reduce((sum, item) => sum + (item.minutes ?? 0), 0);
}

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}s ${minutes % 60}d` : `${minutes}d`;
}

/**
 * Mock imtihon yaratish — veb `exam-create-dialog.tsx` ning tor ekran
 * varianti (to'liq ekran): shablon kartalari (3 ustun), "Yangi shablon",
 * guruh, boshlanish vaqti va bo'limlar (har biriga e'lon qilingan test);
 * xatolar soni tepada, bo'lim qatori qizil hoshiyada.
 */
export function ExamCreateDialog({ open, pending = false, courses, templates, quizzes, onOpenChange, onCreate, onCreateTemplate }: ExamCreateDialogProps) {
  const { t } = useTranslation("exam");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const router = useRouter();
  const months = tl("list.months", { returnObjects: true }) as string[];
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [templateId, setTemplateId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [sectionQuiz, setSectionQuiz] = useState<Record<string, string>>({});
  const [picking, setPicking] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const template = templates.find((item) => item.id === templateId) ?? null;
  const sections = useMemo(() => (template?.items ?? []).filter((item) => item.kind === "section"), [template]);
  const usableQuizzes = useMemo(() => quizzes.filter((quiz) => quiz.status === "published" && quiz.questionCount > 0), [quizzes]);
  const errorCount = Object.keys(errors).length;
  const course = courses.find((item) => item.id === (courseId || courses[0]?.id)) ?? null;
  const start = startsAt ? new Date(startsAt) : null;
  const startLabel = start && !Number.isNaN(start.getTime()) ? `${start.getDate()}-${(months[start.getMonth()] ?? "").toLowerCase()}, ${startsAt.slice(11, 16)}` : null;
  const courseLabel = (item: { title: string; studentCount?: number }) =>
    item.studentCount === undefined ? item.title : `${item.title} · ${t("createDialog.mobile.students", { count: item.studentCount })}`;
  const pickingSection = sections.find((item) => item.key === picking) ?? null;

  function dropError(key: string) {
    setErrors(({ [key]: _removed, ...rest }) => rest);
  }

  function close() {
    setTemplateId("");
    setStartsAt("");
    setSectionQuiz({});
    setErrors({});
    onOpenChange(false);
  }

  function submit() {
    const next: Record<string, string> = {};
    const finalCourse = courseId || courses[0]?.id || "";
    if (!finalCourse) next.course = t("createDialog.validation.chooseCourse");
    if (!template) next.template = t("createDialog.validation.chooseTemplate");
    if (!startsAt) next.start = t("createDialog.validation.chooseStart");
    else if (new Date(startsAt).getTime() <= Date.now()) next.start = t("createDialog.validation.startInFuture");

    const used = new Set<string>();
    for (const section of sections) {
      const quizId = sectionQuiz[section.key];
      if (section.manual) continue;
      if (!quizId) {
        next[section.key] = t("createDialog.validation.chooseQuiz", { title: section.title });
        continue;
      }
      if (used.has(quizId)) next[section.key] = t("createDialog.validation.quizTwice");
      used.add(quizId);
    }

    setErrors(next);
    if (Object.keys(next).length || !template) return;

    onCreate({
      courseId: finalCourse,
      templateId: template.id,
      title: `${template.name} · ${courses.find((item) => item.id === finalCourse)?.title ?? ""}`.trim(),
      startsAt,
      startNow: false,
      sections: sections.map((section) => ({ key: section.key, quizId: sectionQuiz[section.key] })),
    });
  }

  return (
    <MobileScreenDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={t("createDialog.title")}
      closeLabel={t("createDialog.cancel")}
      onClose={close}
      footer={<MobileButton label={t("createDialog.submit")} disabled={pending} onPress={submit} />}
    >
      {errorCount ? (
        <View style={[styles.errorBanner, { backgroundColor: ds.c["danger-bg"] }]}>
          <Icon name="warning-fill" size={20} color={ds.c.danger} />
          <DsText v="body-sm" w="500" c="error-text" style={styles.grow}>
            {t("createDialog.errorSummary", { count: errorCount })}
          </DsText>
        </View>
      ) : (
        <DsText v="body-sm" c="ink-secondary" style={styles.intro}>
          {t("createDialog.description")}
        </DsText>
      )}

      {/* `mt-[11px] grid grid-cols-3 gap-2`, karta `h-16 rounded-lg border-[1.5px] px-3` */}
      <View style={styles.templates}>
        {templates.map((item) => {
          const active = item.id === templateId;
          const minutes = totalMinutes(item);
          return (
            <View key={item.id} style={styles.templateCell}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setTemplateId(item.id);
                  setSectionQuiz({});
                  dropError("template");
                }}
                style={[
                  styles.template,
                  { borderColor: errors.template ? ds.c.danger : active ? ds.c.brand : "transparent", backgroundColor: active ? ds.c["brand-subtle"] : ds.c.surface },
                ]}
              >
                <DsText v="title" numberOfLines={1}>
                  {item.name}
                </DsText>
                <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1} style={styles.tight}>
                  {t("createDialog.sectionCount", { count: item.items.filter((part) => part.kind === "section").length })}
                  {minutes ? ` · ${durationLabel(minutes)}` : ""}
                </DsText>
              </Pressable>
            </View>
          );
        })}
      </View>

      <DsText v="body-sm" w="600" c="brand" accessibilityRole="button" onPress={onCreateTemplate} style={styles.newTemplate}>
        {t("createDialog.newTemplate")}
      </DsText>

      <View style={styles.fields}>
        <MobileFieldLabel gap={7} label={t("createDialog.courseLabel")}>
          <MobilePickerField
            type="select"
            surface
            value={course?.id ?? ""}
            invalid={Boolean(errors.course)}
            display={course ? courseLabel(course) : t("createDialog.mobile.pick")}
            placeholder={!course}
            ariaLabel={t("createDialog.courseLabel")}
            options={courses.map((item) => ({ value: item.id, label: courseLabel(item) }))}
            onChange={(value) => {
              setCourseId(value);
              dropError("course");
            }}
          />
        </MobileFieldLabel>

        <View>
          <MobileFieldLabel gap={7} label={t("createDialog.startLabel")}>
            <MobilePickerField
              type="datetime"
              surface
              value={startsAt}
              invalid={Boolean(errors.start)}
              display={startLabel ?? t("createDialog.mobile.pick")}
              placeholder={!startLabel}
              ariaLabel={t("createDialog.startLabel")}
              onChange={(value) => {
                setStartsAt(value);
                dropError("start");
              }}
            />
          </MobileFieldLabel>
          {errors.start ? (
            <DsText v="caption" w="400" c="error-text" style={styles.fieldError}>
              {errors.start}
            </DsText>
          ) : null}
        </View>
      </View>

      <DsText v="caption-strong" c="ink-secondary" style={styles.sectionsHead}>
        {t("createDialog.sectionsHead")} · {sections.length}
      </DsText>

      {template ? (
        <View style={[styles.sections, { backgroundColor: ds.c.surface }]}>
          {sections.map((item) => {
            const quiz = usableQuizzes.find((row) => row.id === sectionQuiz[item.key]) ?? null;
            const invalid = Boolean(errors[item.key]);
            const note = invalid
              ? errors[item.key]
              : item.manual
                ? item.key === "speaking"
                  ? t("createDialog.offlineSection")
                  : t("createDialog.mobile.manual")
                : (quiz?.title ?? quiz?.topic ?? t("createDialog.pickQuiz"));
            const body = (
              <>
                <View style={[styles.sectionIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
                  <Icon name={SECTION_ICON[item.key] ?? "description"} size={18} color={ds.c.brand} />
                </View>
                <View style={styles.grow}>
                  <DsText v="title" numberOfLines={1}>
                    <DsText v="title" w="600">
                      {item.title}
                    </DsText>
                    <DsText v="body-sm" c="ink-secondary">
                      {" · "}
                      {item.minutes ? t("createDialog.mobile.minutes", { count: item.minutes }) : "—"}
                    </DsText>
                  </DsText>
                  <DsText
                    v="caption"
                    w={item.manual && !invalid ? "400" : undefined}
                    c={invalid ? "error-text" : item.manual ? "ink-secondary" : quiz ? "success-fg" : "brand"}
                    numberOfLines={1}
                  >
                    {note}
                  </DsText>
                </View>
                {item.manual ? null : <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />}
              </>
            );
            const rowStyle = [styles.sectionRow, invalid && [styles.sectionInvalid, { borderColor: ds.c.danger, backgroundColor: ds.c["danger-bg"] }]];
            return item.manual ? (
              <View key={item.key} style={rowStyle}>
                {body}
              </View>
            ) : (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={t("createDialog.mobile.pickFor", { title: item.title })}
                onPress={() => setPicking(item.key)}
                style={rowStyle}
              >
                {body}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={[styles.noTemplate, { backgroundColor: ds.c.surface }]}>
          <DsText v="body-sm" c="ink-secondary" style={styles.center}>
            {t("createDialog.validation.chooseTemplate")}
          </DsText>
        </View>
      )}

      {template && !usableQuizzes.length ? (
        <View style={styles.noQuizzes}>
          <DsText v="body-sm" w="500">
            {t("createDialog.noQuizzesShort")}
          </DsText>
          <DsText
            v="body-sm"
            w="600"
            c="brand"
            accessibilityRole="link"
            onPress={() => {
              close();
              router.push(ROUTES.teacher.workspaceAi as never);
            }}
          >
            {t("createDialog.createWithAiShort")}
          </DsText>
        </View>
      ) : null}

      <MobileSelectSheet
        open={Boolean(pickingSection)}
        onOpenChange={(next) => !next && setPicking(null)}
        title={pickingSection ? t("createDialog.mobile.pickFor", { title: pickingSection.title }) : ""}
        value={pickingSection ? (sectionQuiz[pickingSection.key] ?? "") : ""}
        options={[{ value: "", label: t("createDialog.pickQuiz") }, ...usableQuizzes.map((row) => ({ value: row.id, label: `${row.title || row.topic} · ${row.questionCount}` }))]}
        onChange={(value) => {
          if (!pickingSection) return;
          setSectionQuiz((current) => ({ ...current, [pickingSection.key]: value }));
          dropError(pickingSection.key);
        }}
      />
    </MobileScreenDialog>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  intro: { marginTop: 16 },
  errorBanner: { marginTop: 16, height: 44, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, borderRadius: dsRadius.xl },
  templates: { marginTop: 11, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  templateCell: { width: "31.8%" },
  /* `tracking-tight` */
  tight: { letterSpacing: -0.6 },
  template: { height: 64, justifyContent: "center", paddingHorizontal: 12, borderWidth: 1.5, borderRadius: dsRadius.lg },
  newTemplate: { marginTop: 14, alignSelf: "flex-start" },
  fields: { marginTop: 11, gap: 11 },
  fieldError: { marginTop: 6 },
  sectionsHead: { marginTop: 13, textTransform: "uppercase" },
  sections: { marginTop: 11, overflow: "hidden", borderRadius: dsRadius.xl },
  sectionRow: { height: 72, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  sectionInvalid: { marginHorizontal: 4, paddingHorizontal: 12, borderWidth: 1.5, borderRadius: dsRadius.lg },
  sectionIcon: { width: 36, height: 36, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  noTemplate: { marginTop: 13, paddingHorizontal: 16, paddingVertical: 24, borderRadius: dsRadius.xl },
  noQuizzes: { marginTop: 20, gap: 4, paddingHorizontal: 12 },
});
