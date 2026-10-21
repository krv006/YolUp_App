import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ClipboardCheck, Plus } from "lucide-react-native";
import { useCourses } from "@/modules/course";
import {
  ExamCreateSheet,
  ExamScoreSheet,
  ExamTemplateSheet,
  ExamWritingReview,
  useCreateExam,
  useCreateExamTemplate,
  useDeleteExam,
  useExamResults,
  useExamTemplates,
  useExams,
  useSaveManualScores,
  useUpdateExam,
} from "@/modules/exam";
import { NotificationBell } from "@/modules/notification";
import { useQuizzes } from "@/modules/quiz";
import { downloadBlob } from "@/shared/lib";
import type { ExamStudentResult, ExamSummary } from "@/shared/types";
import {
  AppBar,
  AppBarAction,
  Avatar,
  DateTimeField,
  Icon,
  Input,
  radius,
  Screen,
  Sheet,
  SheetButton,
  SheetFooter,
  Text,
  toast,
  useTheme,
  type Palette,
} from "@/shared/ui";

type Filter = "all" | "ielts" | "sat" | "cert" | "custom";

const WORKSPACE_PATH = "/teacher/workspace";

function stateTone(state: string, palette: Palette) {
  if (state === "running") return { icon: palette.primary, badgeBg: palette["primary-soft"], badgeFg: palette.primary };
  if (state === "finished")
    return { icon: palette.success, badgeBg: palette["success-soft"], badgeFg: palette["success-strong"] };
  return { icon: palette["saffron-strong"], badgeBg: palette["saffron-soft"], badgeFg: palette["saffron-strong"] };
}

function matchesFilter(exam: ExamSummary, filter: Filter): boolean {
  if (filter === "all") return true;
  const key = `${exam.templateKey} ${exam.title}`.toLowerCase();
  if (filter === "ielts") return key.includes("ielts");
  if (filter === "sat") return key.includes("sat");
  if (filter === "cert") return key.includes("cert") || key.includes("sertifikat");
  return !/ielts|sat|cert|sertifikat/.test(key);
}

/**
 * O'qituvchining Mock testlari — veb `pages/teacher/exams/teacher-exams-page.tsx`
 * ning TOR EKRAN varianti.
 *
 *   ro'yxat     filtr chiplari (IELTS / SAT / Sertifikat / O'z formatim) va
 *               imtihon kartalari: holat, sana, guruh, davomiylik, tugma
 *   natijalar   kartadagi "Natijalar"/"Kuzatish" bosilganda: yuklab olish,
 *               statistika, bo'lim o'rtachalari, o'quvchilar ro'yxati
 *   insholar    o'quvchi bosilganda: yozma javoblar, AI tahlil va ball qo'yish
 */
export function TeacherExamsPage() {
  const { t } = useTranslation("exam");
  const { t: tn } = useTranslation("nav");
  const { t: tw } = useTranslation("workspace");
  const router = useRouter();
  const { palette } = useTheme();
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const courses = useCourses();
  const exams = useExams(null);
  const templates = useExamTemplates();
  const quizzes = useQuizzes(null);
  const create = useCreateExam();
  const createTemplate = useCreateExamTemplate();
  const update = useUpdateExam();
  const remove = useDeleteExam();

  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<ExamSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamSummary | null>(null);
  const [essayStudent, setEssayStudent] = useState<ExamStudentResult | null>(null);
  const [scoreStudent, setScoreStudent] = useState<ExamStudentResult | null>(null);

  const list = (exams.data ?? []).filter((exam) => matchesFilter(exam, filter));
  // Telefonda (vebdagi `isCompact`) avtomatik tanlov yo'q — ro'yxat ochiladi.
  const selected = list.find((exam) => exam.id === selectedId) ?? null;
  const results = useExamResults(selected?.id ?? null, Boolean(selected));
  const saveScores = useSaveManualScores(selected?.id ?? "");
  const courseOptions = (courses.data ?? []).map((course) => ({ id: course.id, title: course.title }));

  const rows = useMemo(() => results.data?.results ?? [], [results.data]);
  const submitted = rows.filter((row) => row.participated);
  const bands = submitted.map((row) => row.total?.score).filter((value): value is number => typeof value === "number");
  const average = bands.length ? (bands.reduce((sum, value) => sum + value, 0) / bands.length).toFixed(1) : "—";
  const top = bands.length ? Math.max(...bands).toFixed(1) : "—";

  const sectionAverages = useMemo(() => {
    const map = new Map<string, { title: string; values: number[] }>();
    for (const row of submitted) {
      for (const section of row.sections) {
        const entry = map.get(section.key) ?? { title: section.title, values: [] };
        if (typeof section.score === "number") entry.values.push(section.score);
        map.set(section.key, entry);
      }
    }
    return [...map.entries()].map(([key, value]) => ({
      key,
      title: value.title,
      score: value.values.length ? value.values.reduce((sum, item) => sum + item, 0) / value.values.length : null,
    }));
  }, [submitted]);

  /*
   * Tizimning "orqaga" tugmasi: avval insholardan natijalarga, natijalardan
   * ro'yxatga, ro'yxatdan Ish maydoniga.
   */
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (essayStudent) setEssayStudent(null);
        else if (selectedId) setSelectedId(null);
        else router.replace(WORKSPACE_PATH);
        return true;
      });
      return () => subscription.remove();
    }, [essayStudent, selectedId, router])
  );

  function formatDate(value: string, withTime = true): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const day = `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${date.getFullYear()}`;
    if (!withTime) return day;
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${day} · ${time}`;
  }

  function duration(minutes: number): string {
    if (minutes < 60) return t("mock.minutesOnly", { count: minutes });
    const rest = minutes % 60;
    return rest
      ? t("mock.durationValue", { hours: Math.floor(minutes / 60), minutes: rest })
      : t("mock.hoursOnly", { count: Math.floor(minutes / 60) });
  }

  function downloadResults() {
    if (!selected || !rows.length) return;
    const header = ["O'quvchi", "Band", ...sectionAverages.map((item) => item.title)];
    const lines = rows.map((row) => [
      row.studentName,
      row.total?.score ?? "",
      ...sectionAverages.map((item) => row.sections.find((section) => section.key === item.key)?.score ?? ""),
    ]);
    const csv = [header, ...lines]
      .map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    void downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), `${selected.title}.csv`);
  }

  const appBar = (
    <AppBar
      title={tn("titles.workspace")}
      back={{ label: tw("searchBack"), onPress: () => router.replace(WORKSPACE_PATH) }}
    >
      <AppBarAction name="search" label={tw("searchAria")} onPress={() => router.push("/teacher/search")} />
      <AppBarAction
        name="add"
        variant="primary"
        label={t("teacherList.createButton")}
        onPress={() => setCreateOpen(true)}
      />
      <NotificationBell />
    </AppBar>
  );

  const sheets = (
    <>
      <ExamScoreSheet
        open={Boolean(scoreStudent)}
        onClose={() => setScoreStudent(null)}
        result={scoreStudent}
        pending={saveScores.isPending}
        onSave={(scores) => {
          if (!scoreStudent) return;
          saveScores
            .mutateAsync({ studentId: scoreStudent.studentId, scores })
            .then(() => setScoreStudent(null))
            .catch((error: Error) => toast.error(error.message));
        }}
      />
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
        onCreate={(values) => void createTemplate.mutateAsync(values).then(() => setTemplateOpen(false))}
      />
      <Sheet
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={t("teacherList.editTitle")}
        description={t("teacherList.editDescription")}
      >
        {editTarget ? (
          <View style={styles.form}>
            <Input
              label={t("createDialog.titleLabel")}
              value={editTarget.title}
              onChangeText={(title) => setEditTarget({ ...editTarget, title })}
            />
            <DateTimeField
              label={t("createDialog.startLabel")}
              value={editTarget.startsAt.slice(0, 16)}
              onChange={(value) => setEditTarget({ ...editTarget, startsAt: value })}
            />
          </View>
        ) : null}
        <SheetFooter>
          <SheetButton title={t("teacherList.cancel")} onPress={() => setEditTarget(null)} />
          <SheetButton
            variant="primary"
            title={t("teacherList.save")}
            disabled={update.isPending}
            loading={update.isPending}
            onPress={() => {
              if (!editTarget) return;
              update
                .mutateAsync({ id: editTarget.id, values: { title: editTarget.title, startsAt: editTarget.startsAt } })
                .then(() => setEditTarget(null))
                .catch((error: Error) => toast.error(error.message));
            }}
          />
        </SheetFooter>
      </Sheet>
      <Sheet
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={t("teacherList.deleteTitle")}
        description={t("teacherList.deleteDescription", { title: deleteTarget?.title ?? "" })}
      >
        <SheetFooter>
          <SheetButton title={t("teacherList.cancel")} onPress={() => setDeleteTarget(null)} />
          <SheetButton
            variant="danger"
            title={t("teacherList.delete")}
            disabled={remove.isPending}
            onPress={() => {
              if (!deleteTarget) return;
              remove
                .mutateAsync(deleteTarget.id)
                .then(() => setDeleteTarget(null))
                .catch((error: Error) => toast.error(error.message));
            }}
          />
        </SheetFooter>
      </Sheet>
    </>
  );

  if (exams.isLoading) {
    return (
      <Screen padded={false}>
        {appBar}
        <View style={[styles.page, { backgroundColor: palette.background }]}>
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={[styles.skeleton, { backgroundColor: palette.muted }]} />
          ))}
        </View>
      </Screen>
    );
  }

  if (!list.length && filter === "all") {
    return (
      <Screen padded={false}>
        {appBar}
        <View style={[styles.page, { backgroundColor: palette.background }]}>
          <View style={[styles.empty, { borderColor: palette.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: palette.primary }]}>
              <ClipboardCheck size={28} color={palette["primary-foreground"]} />
            </View>
            <Text variant="subheading" style={styles.center}>
              {t("teacherList.empty")}
            </Text>
            <Text variant="label" style={[styles.bodySm, styles.center, { color: palette["muted-foreground"] }]}>
              {t("teacherList.emptyDescription")}
            </Text>
            {courseOptions.length ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setCreateOpen(true)}
                style={({ pressed }) => [
                  styles.emptyAction,
                  { backgroundColor: pressed ? palette["primary-hover"] : palette.primary },
                ]}
              >
                <Plus size={18} color={palette["primary-foreground"]} />
                <Text variant="label" style={{ color: palette["primary-foreground"] }}>
                  {t("teacherList.createFirst")}
                </Text>
              </Pressable>
            ) : (
              <Text variant="label" style={[styles.bodySm, { color: palette["subtle-foreground"] }]}>
                {t("teacherList.needCourse")}
              </Text>
            )}
          </View>
        </View>
        {sheets}
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      {appBar}
      <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page}>
        {!selected ? (
          <>
            <View style={styles.filters}>
              {(
                [
                  ["ielts", t("mock.filterIelts")],
                  ["sat", t("mock.filterSat")],
                  ["cert", t("mock.filterCert")],
                  ["custom", t("mock.filterCustom")],
                ] as const
              ).map(([id, label]) => {
                const active = filter === id;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setFilter(active ? "all" : id)}
                    style={[
                      styles.filter,
                      active
                        ? { backgroundColor: palette["primary-soft"] }
                        : { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1 },
                    ]}
                  >
                    <Text variant="label" style={{ color: active ? palette.primary : palette["muted-foreground"] }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {list.map((exam) => {
              const tone = stateTone(exam.state, palette);
              return (
                <View
                  key={exam.id}
                  style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
                >
                  <View style={styles.cardHead}>
                    <View style={[styles.cardIcon, { backgroundColor: tone.icon }]}>
                      <ClipboardCheck size={18} color="#ffffff" />
                    </View>
                    <View style={styles.cardBody}>
                      <Text variant="body" numberOfLines={1} style={styles.title}>
                        {exam.title}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: tone.badgeBg }]}>
                        <Text variant="caption" style={[styles.strong, { color: tone.badgeFg }]}>
                          {exam.state === "upcoming"
                            ? t("mock.stateScheduled")
                            : exam.state === "running"
                              ? t("mock.stateRunning")
                              : t("mock.stateFinished")}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("teacherList.deleteAria")}
                      onPress={() => setDeleteTarget(exam)}
                      style={({ pressed }) => [styles.more, pressed && { backgroundColor: palette["surface-subtle"] }]}
                    >
                      <Icon name="more" size={18} color={palette["subtle-foreground"]} />
                    </Pressable>
                  </View>

                  <View style={styles.meta}>
                    <MetaRow icon="nav-calendar" text={formatDate(exam.startsAt)} />
                    <MetaRow icon="groups" text={exam.courseTitle} />
                    <MetaRow icon="assign" text={duration(exam.totalMinutes)} />
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      if (exam.state === "upcoming") {
                        setEditTarget(exam);
                        return;
                      }
                      setSelectedId(exam.id);
                      setEssayStudent(null);
                    }}
                    style={({ pressed }) => [
                      styles.cardAction,
                      {
                        borderColor: palette.border,
                        backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
                      },
                    ]}
                  >
                    <Text variant="label">
                      {exam.state === "upcoming"
                        ? t("mock.edit")
                        : exam.state === "running"
                          ? t("mock.watch")
                          : t("mock.results")}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </>
        ) : essayStudent ? (
          <>
            <View style={styles.essayHead}>
              <RoundButton label={t("mock.backToResults")} onPress={() => setEssayStudent(null)}>
                <Icon name="arrow-back" size={19} color={palette.foreground} />
              </RoundButton>
              <View style={styles.grow}>
                <Text variant="subheading" numberOfLines={1}>
                  {essayStudent.studentName}
                </Text>
                <Text variant="caption" numberOfLines={1} style={{ color: palette["subtle-foreground"] }}>
                  {t("mock.essaysHeader", {
                    exam: selected.title,
                    date: formatDate(selected.startsAt, false),
                    count: essayStudent.sections.filter((section) => section.manual).length,
                  })}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setScoreStudent(essayStudent)}
                style={({ pressed }) => [
                  styles.pillButton,
                  { backgroundColor: pressed ? palette["primary-hover"] : palette.primary },
                ]}
              >
                <Icon name="add" size={18} color={palette["primary-foreground"]} />
                <Text variant="label" style={{ color: palette["primary-foreground"] }}>
                  {t("result.manualScores")}
                </Text>
              </Pressable>
            </View>
            <ExamWritingReview examId={selected.id} studentId={essayStudent.studentId} />
          </>
        ) : (
          <>
            <RoundButton label={t("mock.backToList")} onPress={() => setSelectedId(null)} style={styles.close}>
              <View style={styles.rotated}>
                <Icon name="add" size={19} color={palette.foreground} />
              </View>
            </RoundButton>

            <View style={styles.resultsHead}>
              <Text variant="label" style={[styles.bodySm, styles.grow, styles.resultsText, { color: palette["muted-foreground"] }]}>
                {t("mock.resultsHeader", { date: formatDate(selected.startsAt, false), course: selected.courseTitle })}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={!rows.length}
                onPress={downloadResults}
                style={({ pressed }) => [
                  styles.pillButton,
                  {
                    borderWidth: 1,
                    borderColor: palette.border,
                    backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
                  },
                ]}
              >
                <Icon name="download" size={17} color={palette.foreground} />
                <Text variant="label">{t("mock.download")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!rows.length}
                onPress={() => toast.info(t("mock.shareUnavailable"))}
                style={({ pressed }) => [
                  styles.pillButton,
                  { backgroundColor: pressed ? palette["primary-hover"] : palette.primary },
                ]}
              >
                <Icon name="send" size={17} color={palette["primary-foreground"]} />
                <Text variant="label" style={{ color: palette["primary-foreground"] }}>
                  {t("mock.share")}
                </Text>
              </Pressable>
            </View>

            {(
              [
                [`${submitted.length}/${rows.length || 0}`, t("mock.statSubmitted")],
                [average, t("mock.statAvg")],
                [top, t("mock.statTop")],
              ] as const
            ).map(([value, label]) => (
              <View key={label} style={[styles.stat, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Text variant="title">{value}</Text>
                <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
                  {label}
                </Text>
              </View>
            ))}

            {sectionAverages.length ? (
              <View style={[styles.box, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Text variant="label">{t("mock.sectionAverages")}</Text>
                {sectionAverages.map((section) => (
                  <View key={section.key} style={styles.avgRow}>
                    <Text variant="label" style={[styles.bodySm, styles.avgTitle, { color: palette["muted-foreground"] }]}>
                      {section.title}
                    </Text>
                    <View style={[styles.track, { backgroundColor: palette["surface-subtle"] }]}>
                      <View
                        style={[
                          styles.trackFill,
                          { width: `${((section.score ?? 0) / 9) * 100}%`, backgroundColor: palette.primary },
                        ]}
                      />
                    </View>
                    <Text variant="label" style={[styles.avgValue, styles.numeric]}>
                      {section.score === null ? "—" : section.score.toFixed(1)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={[styles.students, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={[styles.studentsHead, { borderBottomColor: palette.border }]}>
                <Text variant="label" style={styles.grow}>
                  {t("mock.studentsTitle")}
                </Text>
                <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                  {t("mock.byBand")}
                </Text>
              </View>
              {results.isLoading ? (
                <Text variant="label" style={[styles.bodySm, styles.center, styles.emptyRows, { color: palette["subtle-foreground"] }]}>
                  {t("result.loading")}
                </Text>
              ) : rows.length ? (
                [...rows]
                  .sort((a, b) => (b.total?.score ?? -1) - (a.total?.score ?? -1))
                  .map((row, index, all) => (
                    <Pressable
                      key={row.studentId}
                      accessibilityRole="button"
                      onPress={() => row.participated && setEssayStudent(row)}
                      style={({ pressed }) => [
                        styles.studentRow,
                        index < all.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.border },
                        pressed && { backgroundColor: palette["surface-subtle"] },
                      ]}
                    >
                      <Avatar variant="legacy" name={row.studentName} size="sm" />
                      <View style={styles.grow}>
                        <Text variant="label" numberOfLines={1}>
                          {row.studentName}
                        </Text>
                        <Text variant="caption" numberOfLines={1} style={{ color: palette["subtle-foreground"] }}>
                          {row.participated
                            ? row.sections
                                .map(
                                  (section) =>
                                    `${section.title.slice(0, 1)} ${section.score === null ? "—" : section.score}`
                                )
                                .join(" · ")
                            : t("mock.notEntered")}
                        </Text>
                      </View>
                      {row.participated ? (
                        <View style={[styles.scorePill, { backgroundColor: palette["success-soft"] }]}>
                          <Text variant="caption" style={[styles.strong, styles.numeric, { color: palette["success-strong"] }]}>
                            {row.total?.score === null || row.total?.score === undefined
                              ? "—"
                              : row.total.score.toFixed(1)}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.scorePill, { backgroundColor: palette["destructive-soft"] }]}>
                          <Text variant="caption" style={[styles.strong, { color: palette["destructive-strong"] }]}>
                            {t("mock.notSubmitted")}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  ))
              ) : (
                <Text variant="label" style={[styles.bodySm, styles.center, styles.emptyRows, { color: palette["subtle-foreground"] }]}>
                  {t("mock.noResults")}
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
      {sheets}
    </Screen>
  );
}

function MetaRow({ icon, text }: { icon: "nav-calendar" | "groups" | "assign"; text: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.metaRow}>
      <Icon name={icon} size={15} color={palette["subtle-foreground"]} />
      <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
        {text}
      </Text>
    </View>
  );
}

/** `size-10 rounded-full border bg-surface` */
function RoundButton({
  label,
  onPress,
  children,
  style,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  style?: object;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  bodySm: { fontWeight: "400" },
  strong: { fontWeight: "600" },
  numeric: { fontVariant: ["tabular-nums"] },
  title: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  /* `flex-col gap-3 p-4` */
  page: { gap: 12, padding: 16 },
  skeleton: { height: 160, borderRadius: radius["2xl"] },
  form: { gap: 16 },

  empty: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingVertical: 40, borderWidth: 1, borderStyle: "dashed", borderRadius: radius["2xl"] },
  emptyIcon: { width: 64, height: 64, borderRadius: radius["2xl"], alignItems: "center", justifyContent: "center" },
  emptyAction: {
    alignSelf: "stretch",
    marginTop: 4,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: radius.full,
  },

  /* `flex-wrap gap-2`, chip `h-10 rounded-full px-4` */
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: { height: 40, justifyContent: "center", paddingHorizontal: 16, borderRadius: radius.full },

  /* `rounded-2xl border bg-surface p-4 gap-3` */
  card: { gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, minWidth: 0, gap: 4 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.full },
  more: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  meta: { gap: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardAction: { height: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: radius.xl },

  round: { width: 40, height: 40, borderWidth: 1, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  close: { marginLeft: -4 },
  rotated: { transform: [{ rotate: "45deg" }] },
  essayHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  pillButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: radius.full,
  },
  /*
   * Vebda izoh matni `flex-1` va tugmalar bilan bir qatorda qoladi —
   * telefonda u so'zlar bo'yicha tor ustunga siqiladi. RN'da "min-content"
   * yo'q, shuning uchun eng uzun so'zga yetadigan minimal kenglik.
   */
  resultsHead: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
  resultsText: { minWidth: 62 },
  stat: { gap: 4, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  box: { gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  avgRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avgTitle: { width: 96 },
  track: { flex: 1, height: 6, borderRadius: radius.full, overflow: "hidden" },
  trackFill: { height: "100%", borderRadius: radius.full },
  avgValue: { width: 40, textAlign: "right" },
  students: { overflow: "hidden", borderWidth: 1, borderRadius: radius["2xl"] },
  studentsHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  scorePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  emptyRows: { paddingHorizontal: 16, paddingVertical: 32 },
});
