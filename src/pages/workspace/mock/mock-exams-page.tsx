import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCourses } from "@/modules/course";
import {
  ExamCreateDialog,
  ExamTemplateDialog,
  examApi,
  examKeys,
  useCreateExam,
  useCreateExamTemplate,
  useDeleteExam,
  useExamTemplates,
  useExams,
} from "@/modules/exam";
import { useQuizzes } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import type { ExamSummary } from "@/shared/types";
import {
  DsGradient,
  DsText,
  dsRadius,
  Icon,
  MobileAlertDialog,
  MobileEmptyCard,
  MobileListSkeleton,
  MobilePageHeader,
  MobileRoundButton,
  MobileSegment,
  PopoverMenu,
  PopoverMenuItem,
  PullRefresh,
  toneColors,
  useDs,
  usePopoverAnchor,
  type IconName,
} from "@/shared/ui";

const CHIP: Record<string, { tone: string; icon: IconName }> = {
  running: { tone: "bg-danger-bg text-error-text", icon: "videocam-fill" },
  upcoming: { tone: "bg-accent-teal-bg text-accent-teal-fg", icon: "schedule" },
  finished: { tone: "bg-subtle text-ink-secondary", icon: "check-circle" },
};

/**
 * Mock imtihonlar — veb `mock-exams-page.tsx` + `mobile-mock-list.tsx`
 * (tor ekran): sarlavha va "+", shablonlar bo'yicha segment, imtihon
 * kartalari (holat belgisi va "Kuzatish / Tahrirlash / Natijalar");
 * karta sarlavhasi menyuni ochadi. `?new=1` bilan yaratish oynasi ochiq.
 */
export function MockExamsPage() {
  const { t } = useTranslation("exam");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ new?: string }>();
  const months = tl("list.months", { returnObjects: true }) as string[];
  const exams = useExams(null);
  const remove = useDeleteExam();
  const create = useCreateExam();
  const createTemplate = useCreateExamTemplate();
  const courses = useCourses();
  const examTemplates = useExamTemplates();
  const quizzes = useQuizzes(null);
  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(() => params.new === "1");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [deleting, setDeleting] = useState<ExamSummary | null>(null);

  const items = useMemo(() => exams.data ?? [], [exams.data]);
  const templates = useMemo(() => {
    const map = new Map<string, number>();
    for (const exam of items) map.set(exam.templateKey, (map.get(exam.templateKey) ?? 0) + 1);
    return [...map.keys()];
  }, [items]);
  const visible = filter === "all" ? items : items.filter((exam) => exam.templateKey === filter);
  const finishedExams = items.filter((exam) => exam.state === "finished");
  const finished = useQueries({
    queries: finishedExams.map((exam) => ({
      queryKey: examKeys.results(exam.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => examApi.getResults(exam.id, { signal }),
    })),
  });

  function changeCreateOpen(open: boolean) {
    setCreateOpen(open);
    if (!open && params.new) router.setParams({ new: undefined });
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.teacher.workspace as never);
  }

  function duration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours ? t("mock.mobile.hours", { hours, minutes: rest }) : t("mock.minutes", { count: rest });
  }

  function sectionCount(exam: ExamSummary): number | null {
    const template = (examTemplates.data ?? []).find((item) => item.id === exam.templateKey || item.name.toLowerCase() === exam.templateKey.toLowerCase());
    return template ? template.items.filter((item) => item.kind === "section").length : null;
  }

  function summary(exam: ExamSummary) {
    const data = finished[finishedExams.indexOf(exam)]?.data;
    if (!data) return null;
    const done = data.results.filter((row) => row.participated);
    const totals = done.map((row) => row.total?.score ?? null).filter((value): value is number => value !== null);
    return { submitted: done.length, total: data.results.length, average: totals.length ? totals.reduce((sum, value) => sum + value, 0) / totals.length : null };
  }

  function subtitle(exam: ExamSummary): string {
    if (exam.state === "upcoming") {
      const date = new Date(exam.startsAt);
      const stamp = Number.isNaN(date.getTime())
        ? ""
        : `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      return [exam.courseTitle, stamp].filter(Boolean).join(" · ");
    }
    if (exam.state === "finished") {
      const stats = summary(exam);
      return [exam.courseTitle, stats ? `${stats.submitted}/${stats.total}` : null, stats?.average != null ? t("mock.mobile.average", { value: stats.average.toFixed(1) }) : null]
        .filter(Boolean)
        .join(" · ");
    }
    const sections = sectionCount(exam);
    return [exam.courseTitle, sections ? t("mock.mobile.sections", { count: sections }) : null, duration(exam.totalMinutes)].filter(Boolean).join(" · ");
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 32 }]}
        refreshControl={<PullRefresh onRefresh={() => Promise.all([exams.refetch(), ...finished.map((query) => query.refetch())])} />}
      >
        <DsGradient name="auth" />
        <MobilePageHeader
          title={t("mock.title")}
          backLabel={t("mock.mobile.back")}
          onBack={goBack}
          action={<MobileRoundButton icon="add" iconSize={24} label={t("mock.create")} onPress={() => changeCreateOpen(true)} />}
        />

        <View style={styles.chips}>
          <MobileSegment
            scroll
            items={[{ id: "all", label: t("mock.filters.all") }, ...templates.map((key) => ({ id: key, label: t(`mock.templates.${key}`, { defaultValue: key.toUpperCase() }) }))]}
            value={filter}
            onChange={setFilter}
          />
        </View>

        {exams.isLoading ? <MobileListSkeleton style={styles.skeleton} /> : null}

        <View style={styles.list}>
          {visible.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              subtitle={subtitle(exam)}
              onOpen={() => router.push(ROUTES.teacher.mockResults(exam.id) as never)}
              onDelete={() => setDeleting(exam)}
            />
          ))}

          {!exams.isLoading && !visible.length ? (
            <MobileEmptyCard icon="assignment-check-fill" title={t("mock.empty")} action={{ label: t("mock.create"), icon: "add", onPress: () => changeCreateOpen(true) }} />
          ) : null}
        </View>
      </ScrollView>

      <MobileAlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        icon="delete"
        tone="danger"
        title={t("mock.deleteTitle")}
        description={t("mock.deleteDescription", { title: deleting?.title ?? "" })}
        cancelLabel={t("mock.cancel")}
        confirmLabel={t("mock.delete")}
        confirmTone="danger"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />

      <ExamCreateDialog
        open={createOpen}
        pending={create.isPending}
        courses={(courses.data ?? []).map((course) => ({ id: course.id, title: course.title, studentCount: course.studentCount ?? 0 }))}
        templates={examTemplates.data ?? []}
        quizzes={quizzes.data ?? []}
        onOpenChange={changeCreateOpen}
        onCreateTemplate={() => setTemplateOpen(true)}
        onCreate={(values) => create.mutate(values, { onSuccess: () => changeCreateOpen(false) })}
      />

      <ExamTemplateDialog
        open={templateOpen}
        pending={createTemplate.isPending}
        onOpenChange={setTemplateOpen}
        onCreate={(values) => createTemplate.mutate(values, { onSuccess: () => setTemplateOpen(false) })}
      />
    </View>
  );
}

/** Imtihon kartasi — `rounded-xl bg-surface p-4`. */
function ExamCard({ exam, subtitle, onOpen, onDelete }: { exam: ExamSummary; subtitle: string; onOpen: () => void; onDelete: () => void }) {
  const { t } = useTranslation("exam");
  const ds = useDs();
  const { anchorRef, rect, open, close } = usePopoverAnchor();
  const look = CHIP[exam.state] ?? CHIP.upcoming!;
  const colors = toneColors(look.tone, ds);
  const action = t(exam.state === "running" ? "mock.watch" : exam.state === "finished" ? "mock.results" : "mock.edit");

  return (
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <View ref={anchorRef} collapsable={false}>
        <Pressable accessibilityRole="button" onPress={open} style={styles.cardHead}>
          <View style={[styles.cardIcon, { backgroundColor: ds.c["accent-violet-bg"] }]}>
            <Icon name="assignment-check-fill" size={20} color={ds.c["accent-violet-fg"]} />
          </View>
          <View style={styles.grow}>
            <DsText v="title" numberOfLines={1}>
              {exam.title}
            </DsText>
            <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
              {subtitle}
            </DsText>
          </View>
        </Pressable>
        <PopoverMenu rect={rect} onClose={close} align="start" height={(exam.state === "running" ? 1 : 2) * 44 + 12}>
          <PopoverMenuItem
            label={action}
            onPress={() => {
              close();
              onOpen();
            }}
          />
          {exam.state === "running" ? null : (
            <PopoverMenuItem
              danger
              label={t("mock.delete")}
              onPress={() => {
                close();
                onDelete();
              }}
            />
          )}
        </PopoverMenu>
      </View>

      <View style={styles.cardFoot}>
        <View style={[styles.chip, { backgroundColor: colors.bg }]}>
          <Icon name={look.icon} size={14} color={colors.fg ?? ds.c.ink} />
          <DsText v="caption-strong" style={{ color: colors.fg }}>
            {t(`mock.state.${exam.state === "upcoming" ? "scheduled" : exam.state}`)}
          </DsText>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          style={({ pressed }) => [
            styles.action,
            exam.state === "running"
              ? { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }
              : exam.state === "finished"
                ? { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }
                : { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
          ]}
        >
          <DsText v="button-sm" c={exam.state === "running" ? "on-action" : exam.state === "finished" ? "brand-strong" : "ink"}>
            {action}
          </DsText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  /* `px-4 pt-5.5 pb-8` */
  page: { paddingHorizontal: 16 },
  chips: { marginTop: 18 },
  skeleton: { marginTop: 14 },
  list: { marginTop: 20, gap: 20 },
  card: { padding: 16, borderRadius: dsRadius.xl },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  cardFoot: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  chip: { height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, borderRadius: 12 },
  action: { height: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 22 },
});
