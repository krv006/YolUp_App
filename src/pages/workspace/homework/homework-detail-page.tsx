import { useMemo, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useAssignment,
  useAssignmentAiSummary,
  useDeleteAssignment,
  useRemindAssignment,
  useUpdateAssignment,
} from "@/modules/homework";
import { ROUTES } from "@/shared/config";
import type { Submission } from "@/shared/types";
import {
  Avatar,
  DsGradient,
  DsText,
  dsRadius,
  Icon,
  MobileEmptyCard,
  MobileRoundButton,
  PopoverMenu,
  PopoverMenuItem,
  toneColors,
  useDs,
  usePopoverAnchor,
  type DsColor,
  type IconName,
} from "@/shared/ui";
import { AssignmentFormDialog } from "@/widgets/homework-workspace";
import { DeleteAssignmentDialog } from "./delete-assignment-dialog";
import { formatDue } from "./format-due";
import { RemindDialog } from "./remind-dialog";

type Filter = "all" | "unchecked" | "graded";

const STATUS: Record<string, { tone: string; icon: IconName }> = {
  pending: { tone: "bg-brand-subtle text-brand", icon: "quiz" },
  late: { tone: "bg-accent-saffron-bg text-accent-saffron-fg", icon: "hourglass-empty" },
  graded: { tone: "bg-success-bg text-success-fg", icon: "check-circle" },
  checking: { tone: "bg-accent-violet-bg text-accent-violet-fg", icon: "auto-awesome" },
  error: { tone: "bg-danger-bg text-error-text", icon: "warning" },
};

function rowStatus(row: Submission): keyof typeof STATUS {
  if (row.gradeValue !== null || row.grade) return "graded";
  if (row.status === "checking") return "checking";
  if (row.status === "error") return "error";
  if (row.isLate) return "late";
  return "pending";
}

/**
 * Vazifa sahifasi — veb `homework-detail-page.tsx` + `mobile-homework-detail.tsx`
 * (tor ekran): sarlavha va "⋮" (tahrirlash, o'chirish), 3 ta ko'rsatkich,
 * AI guruh xulosasi, filtrlar, topshirganlar ro'yxati (AI va o'qituvchi
 * bahosi); pastda "Eslatma yuborish". Topshiriq bosilsa tekshirish sahifasi.
 */
export function HomeworkDetailPage() {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const { assignmentId = null } = useLocalSearchParams<{ assignmentId: string }>();
  const assignment = useAssignment(assignmentId);
  const remove = useDeleteAssignment();
  const remind = useRemindAssignment();
  const aiSummary = useAssignmentAiSummary();
  const update = useUpdateAssignment();
  const { anchorRef, rect, open: openMenu, close: closeMenu } = usePopoverAnchor();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [remindOpen, setRemindOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const item = assignment.data ?? null;
  const submissions = useMemo(() => item?.submissions ?? [], [item]);
  const total = item?.stats?.studentsCount ?? submissions.length;
  const summary = aiSummary.data ?? item?.aiGroupSummary ?? null;
  const missing = Math.max(total - submissions.length, 0);
  const days = item?.dueAt ? differenceInCalendarDays(new Date(item.dueAt), new Date()) : null;
  const emptyHint =
    days === null || days < 0 ? t("detail.emptyHintOverdue") : days === 0 ? t("detail.emptyHintToday") : t("detail.emptyHint", { count: days });
  const unchecked = submissions.filter((row) => rowStatus(row) !== "graded").length;
  const rows = submissions.filter((row) =>
    filter === "unchecked" ? rowStatus(row) !== "graded" : filter === "graded" ? rowStatus(row) === "graded" : true
  );

  const stats: Array<{ value: string; label: string; tone: DsColor }> = [
    { value: `${submissions.length}/${total}`, label: t("detail.stats.submitted"), tone: "ink" },
    { value: String(unchecked), label: t("mobileDetail.review"), tone: "brand" },
    { value: String(missing), label: t("detail.stats.missing"), tone: "error-text" },
  ];

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.teacher.workspace as never);
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + 20 }]}>
        <DsGradient name="auth" />
        <View style={styles.header}>
          <MobileRoundButton icon="chevron-left" label={t("mobileDetail.back")} onPress={goBack} />
          <View ref={anchorRef} collapsable={false}>
            <MobileRoundButton icon="more" label={t("mobileDetail.menu")} onPress={openMenu} />
          </View>
        </View>

        <DsText v="caption" c="ink-secondary" numberOfLines={1} style={styles.eyebrow}>
          {t("mobileDetail.eyebrow", { course: item?.courseTitle ?? "", due: formatDue(item?.dueAt ?? null, months) })}
        </DsText>
        <DsText w="700" style={styles.title}>
          {item?.title}
        </DsText>

        <View style={styles.stats}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.stat, { backgroundColor: ds.c.surface }]}>
              <DsText v="title-lg" c={stat.tone} style={styles.statValue}>
                {stat.value}
              </DsText>
              <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                {stat.label}
              </DsText>
            </View>
          ))}
        </View>

        {submissions.length ? (
          <>
            <View style={[styles.summary, { backgroundColor: ds.c.surface }]}>
              <View style={styles.summaryHead}>
                <Icon name="auto-awesome" size={20} color={ds.c["accent-saffron-fg"]} />
                <DsText v="title">{t("mobileDetail.aiSummary")}</DsText>
              </View>
              <DsText v="body-sm" c="ink-secondary">
                {summary ? summary.text || summary.summary : t("detail.aiAdviceHint")}
              </DsText>
              <Pressable
                accessibilityRole="button"
                disabled={aiSummary.isPending || !submissions.length}
                onPress={() => assignmentId && aiSummary.mutate(assignmentId)}
                style={({ pressed }) => [
                  styles.adviceButton,
                  { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] },
                  aiSummary.isPending && styles.half,
                ]}
              >
                <Icon name="auto-awesome" size={18} color={ds.c.brand} />
                <DsText v="button" c="brand">
                  {t("mobileDetail.groupAdvice")}
                </DsText>
              </Pressable>
            </View>

            <View style={styles.filters}>
              {(
                [
                  ["all", `${t("detail.filters.all")} · ${total}`],
                  ["unchecked", t("detail.status.pending_review")],
                  ["graded", t("mobileDetail.graded")],
                ] as const
              ).map(([id, label]) => {
                const active = filter === id;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setFilter(id)}
                    style={[styles.filter, active ? { backgroundColor: ds.c.brand } : { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: ds.c.surface }]}
                  >
                    <DsText v="body-sm" w="500" c={active ? "on-action" : "ink"} numberOfLines={1}>
                      {label}
                    </DsText>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
              {rows.map((row, index) => {
                const status = rowStatus(row);
                const tone = toneColors(STATUS[status]?.tone ?? "", ds);
                // Backend bahoni harf bilan ham beradi ("A") — vebdagi `Number()` NaN ko'rsatardi.
                const grade = row.gradeValue ?? (row.grade ? (Number.isNaN(Number(row.grade)) ? row.grade : Number(row.grade)) : null);
                return (
                  <Pressable
                    key={row.id}
                    accessibilityRole="button"
                    onPress={() => assignmentId && router.push(`${ROUTES.teacher.homeworkReview(assignmentId)}?s=${row.id}` as never)}
                    style={({ pressed }) => [styles.row, index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }, pressed && { backgroundColor: ds.c.subtle }]}
                  >
                    <Avatar variant="legacy" name={row.studentName} size="sm" box={44} />
                    <View style={styles.rowBody}>
                      <DsText v="title" numberOfLines={1}>
                        {row.studentName}
                      </DsText>
                      <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                        <Icon name={STATUS[status]?.icon ?? "quiz"} size={13} color={tone.fg ?? ds.c.brand} />
                        <DsText v="caption-strong" style={{ color: tone.fg }}>
                          {t(`mobileDetail.status.${status}`)}
                        </DsText>
                      </View>
                    </View>
                    <View style={styles.scores}>
                      <DsText v="caption" c="ink-secondary">
                        AI {row.overallScore === null ? "—" : Math.round(((row.overallScore ?? 0) / 100) * (item?.maxScore || 5))}
                      </DsText>
                      <DsText v="title-lg" c={grade === null ? "ink-secondary" : "success-fg"} style={styles.statValue}>
                        {grade === null ? "—" : grade}
                      </DsText>
                    </View>
                  </Pressable>
                );
              })}
              {!rows.length ? (
                <DsText v="body-sm" c="ink-secondary" style={styles.noRows}>
                  {t("detail.noStudents")}
                </DsText>
              ) : null}
            </View>
          </>
        ) : (
          <View style={styles.block}>
            <MobileEmptyCard icon="assignment" title={t("detail.emptyTitle")} description={emptyHint} descriptionStyle={styles.emptyDescription} />
          </View>
        )}
      </ScrollView>

      {/* `rounded-t-2xl bg-surface px-4 pt-3 pb-8.5` */}
      <View style={[styles.footer, { backgroundColor: ds.c.surface, paddingBottom: Math.max(34, insets.bottom + 12) }]}>
        <Pressable
          accessibilityRole="button"
          disabled={!missing}
          onPress={() => setRemindOpen(true)}
          style={({ pressed }) => [
            styles.remind,
            submissions.length
              ? { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }
              : { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
            !missing && styles.half,
          ]}
        >
          <Icon name="notifications" size={18} color={submissions.length ? ds.c.ink : ds.c["on-action"]} />
          <DsText v="button" c={submissions.length ? "ink" : "on-action"}>
            {t("detail.remind", { count: missing })}
          </DsText>
        </Pressable>
      </View>

      <PopoverMenu rect={rect} onClose={closeMenu} height={100}>
        <PopoverMenuItem
          label={t("detail.edit")}
          onPress={() => {
            closeMenu();
            setEditOpen(true);
          }}
        />
        <PopoverMenuItem
          danger
          label={t("detail.delete")}
          onPress={() => {
            closeMenu();
            setDeleteOpen(true);
          }}
        />
      </PopoverMenu>

      {item ? (
        <AssignmentFormDialog
          key={item.id}
          open={editOpen}
          onOpenChange={setEditOpen}
          courses={[{ id: item.courseId, title: item.courseTitle, studentCount: item.stats?.studentsCount ?? 0 }]}
          pending={update.isPending}
          initial={{
            courseId: item.courseId,
            title: item.title,
            body: item.body || item.description,
            dueAt: item.dueAt,
            grading: item.grading,
            announceInChat: item.announceInChat,
          }}
          onSubmit={(values) => update.mutate({ id: item.id, form: values }, { onSuccess: () => setEditOpen(false) })}
        />
      ) : null}

      <DeleteAssignmentDialog
        open={deleteOpen}
        count={submissions.length}
        pending={remove.isPending}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          if (!assignmentId) return;
          remove.mutate(assignmentId, {
            onSuccess: () => {
              setDeleteOpen(false);
              goBack();
            },
          });
        }}
      />

      <RemindDialog
        open={remindOpen}
        count={missing}
        title={item?.title ?? ""}
        due={formatDue(item?.dueAt ?? null, months)}
        pending={remind.isPending}
        onOpenChange={setRemindOpen}
        onConfirm={(input) => {
          if (!assignmentId) return;
          remind.mutate({ assignmentId, message: input.message, notifyParents: input.notifyParents }, { onSuccess: () => setRemindOpen(false) });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  half: { opacity: 0.5 },
  /* `px-4 pt-5 pb-6` */
  page: { paddingHorizontal: 16, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { marginTop: 14 },
  title: { marginTop: 2, fontSize: 22, lineHeight: 28 },
  stats: { marginTop: 16, flexDirection: "row", gap: 8 },
  stat: { flex: 1, minWidth: 0, height: 64, justifyContent: "center", paddingHorizontal: 12, borderRadius: dsRadius.xl },
  statValue: { lineHeight: 24 },
  summary: { marginTop: 16, gap: 12, padding: 16, borderRadius: dsRadius.xl },
  summaryHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  adviceButton: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 22 },
  filters: { marginTop: 16, flexDirection: "row", gap: 8 },
  filter: { flex: 1, minWidth: 0, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  list: { marginTop: 16, overflow: "hidden", borderRadius: dsRadius.xl },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowBody: { flex: 1, minWidth: 0, alignItems: "flex-start", gap: 4 },
  badge: { height: 24, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, borderRadius: 12 },
  scores: { alignItems: "flex-end", gap: 4 },
  noRows: { paddingHorizontal: 16, paddingVertical: 32, textAlign: "center" },
  block: { marginTop: 16 },
  emptyDescription: { maxWidth: 310 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopLeftRadius: dsRadius["2xl"], borderTopRightRadius: dsRadius["2xl"] },
  remind: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 26 },
});
