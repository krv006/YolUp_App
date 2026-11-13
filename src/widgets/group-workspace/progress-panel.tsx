import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { describeCreateError } from "@/modules/auth";
import { useCourse } from "@/modules/course";
import {
  matchesStudent,
  monthKey,
  paymentMonthBounds,
  shiftMonth,
  sortStudents,
  useCourseProgress,
  useUnmarkPaid,
  type ProgressRange,
  type ProgressSort,
  type StudentProgress,
} from "@/modules/progress";
import {
  ConfirmDialog,
  DsText,
  dsRadius,
  Icon,
  MobileEmptyCard,
  MobileListSkeleton,
  MobileSearchField,
  MobileSelectSheet,
  toast,
  useDs,
} from "@/shared/ui";
import { TeacherNotifyDialog } from "@/widgets/teacher-notify-dialog";
import { PanelHeading } from "./panel-heading";
import { PaymentDialog, type PaymentTarget } from "./payment-dialog";
import { PaymentSettingsDialog } from "./payment-settings-dialog";
import { formatProgressDate, formatProgressMoney, formatProgressMonth } from "./progress-format";
import { ProgressStudentCard } from "./progress-student-card";
import { StudentProgressDialog } from "./student-progress-dialog";

type PaymentFilter = "all" | "unpaid" | "paid";

interface ProgressPanelProps {
  courseId: string | null;
}

/**
 * Guruhning "Progress" bo'limi (faqat o'qituvchi) — veb `progress-panel.tsx`
 * (tor ekran): to'lov sozlamalari va "Xabar yuborish", oy almashtirgich,
 * davr bo'yicha umumiy ko'rsatkichlar, to'lov filtri, qidiruv va saralash,
 * o'quvchi kartalari. Kurs narxi kiritilmagan bo'lsa to'lov qismi yashiriladi.
 */
export function ProgressPanel({ courseId }: ProgressPanelProps) {
  const { t, i18n } = useTranslation("group");
  const ds = useDs();
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [range, setRange] = useState<ProgressRange>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProgressSort>("name");
  const [sortOpen, setSortOpen] = useState(false);
  const [openStudent, setOpenStudent] = useState<StudentProgress | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const course = useCourse(courseId);
  const [unmarkTarget, setUnmarkTarget] = useState<StudentProgress | null>(null);
  const [paying, setPaying] = useState<PaymentTarget | null>(null);
  const progress = useCourseProgress(courseId, month, range);
  const unmarkPaid = useUnmarkPaid();

  const data = progress.data;
  const shownMonth = data?.month ?? month;
  const withPayments = !data || Boolean(data.monthlyFee);
  const [now] = useState(() => new Date());
  const bounds = useMemo(
    () =>
      paymentMonthBounds(
        (data?.students ?? []).map((item) => item.joinedAt),
        now
      ),
    [data, now]
  );
  const students = useMemo(
    () =>
      sortStudents(
        (data?.students ?? []).filter(
          (item) =>
            matchesStudent(item, query) &&
            (!withPayments ||
              filter === "all" ||
              (item.payment.status === filter &&
                !(shownMonth && shownMonth < monthKey(new Date(item.joinedAt)))))
        ),
        sort
      ),
    [data, filter, withPayments, shownMonth, query, sort]
  );

  const monthLabel = shownMonth ? formatProgressMonth(shownMonth, i18n.language) : "";
  const formatDate = (value: string) => formatProgressDate(value, i18n.language);
  const formatMoney = (value: number) => formatProgressMoney(value, i18n.language);

  function openPayment(student: StudentProgress) {
    if (!shownMonth) return;
    setPaying({
      studentId: student.id,
      name: student.name,
      month: shownMonth,
      payment: student.payment.status === "paid" ? student.payment : null,
    });
  }

  function confirmUnmark() {
    if (!courseId || !shownMonth || !unmarkTarget) return;
    const name = unmarkTarget.name;
    unmarkPaid.mutate(
      { courseId, studentId: unmarkTarget.id, month: shownMonth },
      {
        onSuccess: () => {
          toast.success(t("progress.unmarked", { name }));
          setUnmarkTarget(null);
        },
        onError: (error: Error) => toast.error(describeCreateError(error)),
      }
    );
  }

  const RANGES: Array<{ id: ProgressRange; label: string }> = [
    { id: "all", label: t("attendance.filterAllShort") },
    { id: "30d", label: t("attendance.filterMonthShort") },
    { id: "month", label: t("attendance.filterCurrent") },
  ];

  const FILTERS: Array<{ id: PaymentFilter; label: string }> = [
    { id: "all", label: t("progress.filterAll") },
    { id: "unpaid", label: t("progress.filterUnpaid") },
    { id: "paid", label: t("progress.filterPaid") },
  ];

  const SORTS: ProgressSort[] = [
    "name",
    "attendance",
    "homework",
    ...(withPayments ? (["debt"] as const) : []),
  ];

  const prevDisabled = !shownMonth || shownMonth <= bounds.min;
  const nextDisabled = !shownMonth || shownMonth >= bounds.max;

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
    >
      {/*
       * Vebda `mb-1 flex items-end gap-3` — sarlavha va tugmalar bir qatorda.
       * Telefonda tugmalar uchun joy qolmay "O'quvchilar" so'z o'rtasidan
       * bo'linardi, shuning uchun tugmalar sarlavha ostida, o'ngda.
       */}
      <View style={styles.head}>
        <PanelHeading
          eyebrow={t("progress.eyebrow")}
          title={t("progress.title")}
          subtitle={
            data?.monthlyFee
              ? [
                  t("progress.fee", { amount: formatMoney(data.monthlyFee) }),
                  course.data?.paymentDay
                    ? t("paymentSettings.dueDay", { day: course.data.paymentDay })
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ")
              : data
                ? t("progress.noFee")
                : undefined
          }
        />
        <View style={styles.headActions}>
          {/* Tor ekranda faqat belgi (`max-lg:hidden` yozuv): `h-10 rounded-full bg-surface px-3` */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("paymentSettings.title")}
            onPress={() => setSettingsOpen(true)}
            style={({ pressed }) => [
              styles.settings,
              { backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
            ]}
          >
            <Icon name="payments" size={18} color={ds.c.ink} />
          </Pressable>
          {/* `h-10 rounded-full bg-brand px-4 gap-2 text-button text-on-action` */}
          <Pressable
            accessibilityRole="button"
            onPress={() => setNotifyOpen(true)}
            style={({ pressed }) => [
              styles.notify,
              { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
            ]}
          >
            <Icon name="campaign" size={18} color={ds.c["on-action"]} />
            <DsText v="button" c="on-action" numberOfLines={1}>
              {t("notification:teacherSend.button")}
            </DsText>
          </Pressable>
        </View>
      </View>
      <TeacherNotifyDialog open={notifyOpen} onOpenChange={setNotifyOpen} courseId={courseId} />
      <PaymentSettingsDialog
        course={course.data}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      {withPayments ? (
        // `h-11 rounded-full bg-surface px-2 justify-between`
        <View style={[styles.months, { backgroundColor: ds.c.surface }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("progress.prevMonth")}
            disabled={prevDisabled}
            onPress={() => shownMonth && setMonth(shiftMonth(shownMonth, -1))}
            style={({ pressed }) => [
              styles.monthArrow,
              pressed && { backgroundColor: ds.c.subtle },
              prevDisabled && styles.faint,
            ]}
          >
            <Icon name="chevron-left" size={20} color={ds.c.ink} />
          </Pressable>
          {shownMonth && shownMonth !== bounds.current ? (
            <Pressable
              accessibilityRole="button"
              accessibilityHint={t("progress.currentMonth")}
              onPress={() => setMonth(bounds.current)}
              style={({ pressed }) => [
                styles.monthReset,
                pressed && { backgroundColor: ds.c.subtle },
              ]}
            >
              <DsText v="body-sm" w="500" style={styles.capitalize}>
                {monthLabel}
              </DsText>
              <Icon name="today" size={16} color={ds.c["icon-tertiary"]} />
            </Pressable>
          ) : (
            <DsText v="body-sm" w="500" style={styles.capitalize}>
              {monthLabel}
            </DsText>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("progress.nextMonth")}
            disabled={nextDisabled}
            onPress={() => shownMonth && setMonth(shiftMonth(shownMonth, 1))}
            style={({ pressed }) => [
              styles.monthArrow,
              pressed && { backgroundColor: ds.c.subtle },
              nextDisabled && styles.faint,
            ]}
          >
            <Icon name="chevron-right" size={20} color={ds.c.ink} />
          </Pressable>
        </View>
      ) : null}

      {progress.isLoading ? (
        <MobileListSkeleton card rows={4} />
      ) : progress.isError ? (
        <MobileEmptyCard
          icon="bar-chart"
          title={t("progress.errorTitle")}
          description={t("progress.errorDescription")}
          action={{
            label: t("progress.retry"),
            icon: "refresh",
            onPress: () => void progress.refetch(),
          }}
        />
      ) : data && data.students.length ? (
        <>
          {/* `rounded-xl bg-brand p-4 gap-3 text-on-action` */}
          <View style={[styles.summary, { backgroundColor: ds.c.brand }]}>
            <View style={styles.rangeRow}>
              <DsText v="caption-strong" c="on-action">
                {t("progress.rangeLabel")}
              </DsText>
              {/* `flex-1 gap-1 rounded-full bg-on-brand-subtle p-1` */}
              <View style={[styles.ranges, { backgroundColor: ds.c["on-brand-subtle"] }]}>
                {RANGES.map((item) => {
                  const active = range === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setRange(item.id)}
                      style={[styles.range, active && { backgroundColor: ds.c.surface }]}
                    >
                      <DsText
                        v="caption-strong"
                        c={active ? "brand" : "on-action"}
                        numberOfLines={1}
                      >
                        {item.label}
                      </DsText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {/* `grid gap-2 grid-cols-2` (to'lov bilan) yoki `grid-cols-3` */}
            <View style={styles.tiles}>
              {[
                ...(withPayments
                  ? [
                      {
                        value: `${data.summary.paid}/${data.summary.students}`,
                        label: t("progress.statPaid"),
                      },
                    ]
                  : []),
                {
                  value:
                    data.summary.attendancePercent === null
                      ? "—"
                      : `${data.summary.attendancePercent}%`,
                  label: t("progress.statAttendanceLessons", { count: data.lessonCount }),
                },
                {
                  value: data.summary.focusPercent === null ? "—" : `${data.summary.focusPercent}%`,
                  label: t("progress.statFocus"),
                },
                {
                  value:
                    data.summary.homeworkCompletionPercent === null
                      ? "—"
                      : `${data.summary.homeworkCompletionPercent}%`,
                  label: t("progress.statHomework"),
                },
              ].map((tile) => (
                <View
                  key={tile.label}
                  style={[
                    styles.tile,
                    withPayments ? styles.tileHalf : styles.tileThird,
                    { backgroundColor: ds.c["on-brand-subtle"] },
                  ]}
                >
                  <DsText v="title-lg" c="on-action" style={styles.tileValue}>
                    {tile.value}
                  </DsText>
                  <DsText v="caption" c="on-action" numberOfLines={1}>
                    {tile.label}
                  </DsText>
                </View>
              ))}
            </View>
          </View>

          {withPayments ? (
            // `grid grid-cols-3 gap-2`; `h-11 rounded-full text-body-sm font-medium`
            <View style={styles.filters}>
              {FILTERS.map((item) => {
                const active = filter === item.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setFilter(item.id)}
                    style={[styles.filter, { backgroundColor: active ? ds.c.brand : ds.c.surface }]}
                  >
                    <DsText v="body-sm" w="500" c={active ? "on-action" : "ink"} numberOfLines={1}>
                      {item.label}
                    </DsText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.tools}>
            <MobileSearchField
              value={query}
              onChange={setQuery}
              placeholder={t("progress.searchShort")}
              ariaLabel={t("progress.search")}
              clearLabel={t("common:formPickers.clear")}
              style={styles.search}
            />
            {/* Vebdagi `<select>` o'rniga: `h-11 rounded-full bg-surface pl-4 pr-3.5`, o'ngda `sort` belgisi */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("progress.sort.label")}
              onPress={() => setSortOpen(true)}
              style={({ pressed }) => [
                styles.sort,
                { backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
              ]}
            >
              <DsText v="body-sm" w="500" numberOfLines={1} style={styles.sortLabel}>
                {t(`progress.sort.${sort}`)}
              </DsText>
              <Icon name="sort" size={18} color={ds.c["icon-secondary"]} />
            </Pressable>
          </View>

          {students.length ? (
            <View style={styles.cards}>
              {students.map((student) => (
                <ProgressStudentCard
                  key={student.id}
                  student={student}
                  withPayments={withPayments}
                  beforeJoin={
                    shownMonth ? shownMonth < monthKey(new Date(student.joinedAt)) : false
                  }
                  busy={unmarkPaid.isPending}
                  now={now}
                  formatDate={formatDate}
                  formatMoney={formatMoney}
                  onOpen={() => setOpenStudent(student)}
                  onPay={() => openPayment(student)}
                  onUnmark={() => setUnmarkTarget(student)}
                />
              ))}
            </View>
          ) : (
            <DsText v="body-sm" c="ink-secondary" style={styles.filterEmpty}>
              {t("progress.filterEmpty")}
            </DsText>
          )}
        </>
      ) : (
        <MobileEmptyCard
          icon="bar-chart"
          title={t("progress.emptyTitle")}
          description={t("progress.emptyDescription")}
        />
      )}

      <MobileSelectSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        title={t("progress.sort.label")}
        value={sort}
        options={SORTS.map((id) => ({ value: id, label: t(`progress.sort.${id}`) }))}
        onChange={(value) => setSort(value as ProgressSort)}
      />

      <StudentProgressDialog
        courseId={courseId}
        student={openStudent}
        monthlyFee={data?.monthlyFee ?? null}
        range={range}
        onOpenChange={(open) => !open && setOpenStudent(null)}
      />

      <PaymentDialog
        courseId={courseId}
        target={paying}
        monthlyFee={data?.monthlyFee ?? null}
        onClose={() => setPaying(null)}
      />

      <ConfirmDialog
        open={unmarkTarget !== null}
        onOpenChange={(open) => !open && setUnmarkTarget(null)}
        icon="check-circle"
        title={t("progress.unmarkTitle")}
        description={t("progress.unmarkDescription", {
          name: unmarkTarget?.name ?? "",
          month: monthLabel,
        })}
        confirmLabel={t("progress.unmarkConfirm")}
        cancelLabel={t("progress.cancel")}
        pending={unmarkPaid.isPending}
        onConfirm={confirmUnmark}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* `gap-5 px-4 pt-5 pb-8` */
  page: { gap: 20, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  head: { gap: 12, marginBottom: 4 },
  headActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  settings: {
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: dsRadius.full,
  },
  notify: {
    height: 40,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: dsRadius.full,
  },
  months: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderRadius: dsRadius.full,
  },
  /* `size-9 rounded-full`, `disabled:opacity-30` */
  monthArrow: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dsRadius.full,
  },
  faint: { opacity: 0.3 },
  /* `h-9 gap-1.5 rounded-full px-3` */
  monthReset: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: dsRadius.full,
  },
  capitalize: { textTransform: "capitalize" },
  summary: { gap: 12, padding: 16, borderRadius: dsRadius.xl },
  rangeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  ranges: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: dsRadius.full,
  },
  /* `h-8 flex-1 rounded-full px-2` */
  range: {
    flex: 1,
    minWidth: 0,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: dsRadius.full,
  },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  /* `h-16 rounded-xl px-3` */
  tile: {
    minWidth: 0,
    height: 64,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: dsRadius.xl,
  },
  // Ikki ustun: 2 × 40% + gap < 100% < 3 × 40% — har qatorda ikkitadan.
  tileHalf: { flexBasis: "40%", flexGrow: 1 },
  tileThird: { flex: 1 },
  /* `text-title-lg leading-6` */
  tileValue: { lineHeight: 24 },
  filters: { flexDirection: "row", gap: 8 },
  filter: {
    flex: 1,
    minWidth: 0,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dsRadius.full,
  },
  tools: { flexDirection: "row", alignItems: "center", gap: 8 },
  /* `h-11 rounded-full bg-surface` */
  search: { flex: 1, minWidth: 0, height: 44 },
  /* `max-w-[46vw]` */
  sort: {
    height: 44,
    maxWidth: "50%",
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 16,
    paddingRight: 14,
    borderRadius: dsRadius.full,
  },
  sortLabel: { flexShrink: 1 },
  cards: { gap: 12 },
  /* `py-6 text-center text-body-sm text-ink-secondary` */
  filterEmpty: { paddingVertical: 24, textAlign: "center" },
});
