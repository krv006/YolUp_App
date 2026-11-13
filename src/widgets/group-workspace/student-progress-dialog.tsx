import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { describeCreateError } from "@/modules/auth";
import {
  useStudentProgress,
  useUnmarkPaid,
  type AssignmentState,
  type Payment,
  type ProgressRange,
  type StudentProgress,
} from "@/modules/progress";
import { ROUTES } from "@/shared/config";
import { formatMessageTime } from "@/shared/lib";
import {
  ConfirmDialog,
  DsText,
  dsRadius,
  Icon,
  MobileListSkeleton,
  Sheet,
  toast,
  useDs,
  type DsColor,
} from "@/shared/ui";
import { PaymentDialog, type PaymentTarget } from "./payment-dialog";
import { formatProgressDate, formatProgressMoney, formatProgressMonth } from "./progress-format";

type DetailTab = "lessons" | "assignments" | "payments";

interface StudentProgressDialogProps {
  courseId: string | null;
  student: StudentProgress | null;
  monthlyFee: number | null;
  range: ProgressRange;
  onOpenChange: (open: boolean) => void;
}

const STATE_TONE: Record<AssignmentState, DsColor> = {
  done: "success",
  awaiting_review: "brand",
  resubmit: "danger",
  missed: "danger",
  not_submitted: "ink-secondary",
};

/**
 * O'quvchining batafsil progressi — veb `student-progress-dialog.tsx`
 * (`AppDialog variant="panel"`, tor ekranda `max-h-[88dvh]` pastki oyna):
 * Darslar (kirish-chiqish vaqti, daqiqalar, kechikish sababi, izoh),
 * Vazifalar (bosilsa shu o'quvchi topshirig'i tekshirish sahifasida
 * ochiladi) va kurs narxi bo'lsa To'lovlar (har oyni belgilash, tahrirlash,
 * bekor qilish). To'lov va tasdiqlash oynalari shu oynaning ichida ochiladi
 * (iOS yonma-yon Modal'ni ko'rsatmaydi).
 */
export function StudentProgressDialog({
  courseId,
  student,
  monthlyFee,
  range,
  onOpenChange,
}: StudentProgressDialogProps) {
  const { t, i18n } = useTranslation("group");
  const ds = useDs();
  const router = useRouter();
  const [tab, setTab] = useState<DetailTab>("lessons");
  // Yopilish animatsiyasi paytida oxirgi o'quvchi ko'rinib tursin.
  const [last, setLast] = useState(student);
  if (student && student !== last) setLast(student);
  const shown = student ?? last;
  const detail = useStudentProgress(courseId, shown?.id ?? null, range);
  const unmarkPaid = useUnmarkPaid();
  const [paying, setPaying] = useState<PaymentTarget | null>(null);
  const [unmarking, setUnmarking] = useState<Payment | null>(null);
  const date = (value: string) => formatProgressDate(value, i18n.language);
  const month = (value: string) => formatProgressMonth(value, i18n.language);
  const money = (value: number) => formatProgressMoney(value, i18n.language);

  const TABS: Array<{ id: DetailTab; label: string }> = [
    { id: "lessons", label: t("progress.detail.lessons") },
    { id: "assignments", label: t("progress.detail.assignments") },
    ...(monthlyFee ? [{ id: "payments" as const, label: t("progress.detail.payments") }] : []),
  ];
  const activeTab = TABS.some((item) => item.id === tab) ? tab : "lessons";
  const data = detail.data;
  const divider = { borderBottomWidth: 1, borderBottomColor: ds.c.line };

  function openReview(assignmentId: string, submissionId: string | null) {
    // Vebda sahifa almashadi va oyna o'zi yo'qoladi; mobilda yangi ekran ustida qolmasin.
    onOpenChange(false);
    router.push(
      (submissionId
        ? `${ROUTES.teacher.homeworkReview(assignmentId)}?s=${encodeURIComponent(submissionId)}`
        : ROUTES.teacher.homeworkReview(assignmentId)) as never
    );
  }

  function confirmUnmark() {
    if (!courseId || !shown || !unmarking) return;
    const name = shown.name;
    unmarkPaid.mutate(
      { courseId, studentId: shown.id, month: unmarking.period },
      {
        onSuccess: () => {
          toast.success(t("progress.unmarked", { name }));
          setUnmarking(null);
        },
        onError: (error: Error) => toast.error(describeCreateError(error)),
      }
    );
  }

  return (
    <Sheet
      variant="app"
      open={student !== null}
      onClose={() => onOpenChange(false)}
      title={shown?.name ?? ""}
      description={
        shown
          ? [
              t("progress.joined", { date: date(shown.joinedAt) }),
              shown.lastVisitAt
                ? t("progress.lastVisit", { date: date(shown.lastVisitAt) })
                : t("progress.noVisit"),
            ].join(" · ")
          : undefined
      }
    >
      {shown ? (
        <>
          {/* `grid grid-cols-2|3 gap-2`; tab `h-10 rounded-full text-body-sm font-medium` */}
          <View accessibilityRole="tablist" style={styles.tabs}>
            {TABS.map((item) => {
              const selected = activeTab === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => setTab(item.id)}
                  style={[styles.tab, { backgroundColor: selected ? ds.c.brand : ds.c.subtle }]}
                >
                  <DsText v="body-sm" w="500" c={selected ? "on-action" : "ink"} numberOfLines={1}>
                    {item.label}
                  </DsText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.content}>
            {detail.isLoading ? (
              <MobileListSkeleton card rows={3} style={[styles.list, { borderColor: ds.c.line }]} />
            ) : detail.isError || !data ? (
              <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
                {t("progress.errorDescription")}
              </DsText>
            ) : activeTab === "lessons" ? (
              data.lessons.length ? (
                // `rounded-xl border border-line`
                <View style={[styles.list, { borderColor: ds.c.line }]}>
                  {data.lessons.map((lesson, index) => (
                    <View
                      key={lesson.lessonId}
                      style={[styles.lesson, index < data.lessons.length - 1 && divider]}
                    >
                      <View style={styles.lessonBody}>
                        <DsText v="title-sm" numberOfLines={1}>
                          {lesson.title}
                        </DsText>
                        <DsText v="body-xs" c="ink-secondary">
                          {[
                            date(lesson.startsAt),
                            lesson.joinedAt
                              ? `${formatMessageTime(lesson.joinedAt)} → ${
                                  lesson.leftAt ? formatMessageTime(lesson.leftAt) : "…"
                                }`
                              : "",
                            lesson.minutes !== null
                              ? t("progress.detail.minutes", { count: lesson.minutes })
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </DsText>
                        {lesson.lateReason ? (
                          <DsText v="caption" c="warning-text">
                            {t(
                              lesson.attended
                                ? "progress.detail.lateReason"
                                : "progress.detail.absentReason",
                              { reason: lesson.lateReason }
                            )}
                          </DsText>
                        ) : null}
                        {lesson.teacherNote ? (
                          <DsText v="caption" c="ink-secondary">
                            {t("progress.detail.teacherNote", { note: lesson.teacherNote })}
                          </DsText>
                        ) : null}
                      </View>
                      <DsText v="title-sm" c={lesson.attended ? "success" : "danger"}>
                        {lesson.attended
                          ? t("progress.detail.attended")
                          : t("progress.detail.absent")}
                      </DsText>
                    </View>
                  ))}
                </View>
              ) : (
                <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
                  {t("progress.detail.noLessons")}
                </DsText>
              )
            ) : activeTab === "assignments" ? (
              data.assignments.length ? (
                <View style={[styles.list, { borderColor: ds.c.line }]}>
                  {data.assignments.map((assignment, index) => (
                    <Pressable
                      key={assignment.assignmentId}
                      accessibilityRole="button"
                      onPress={() => openReview(assignment.assignmentId, assignment.submissionId)}
                      style={({ pressed }) => [
                        styles.row,
                        index < data.assignments.length - 1 && divider,
                        pressed && { backgroundColor: ds.c.subtle },
                      ]}
                    >
                      <View style={styles.grow}>
                        <DsText v="title-sm" numberOfLines={1}>
                          {assignment.title}
                        </DsText>
                        <DsText v="body-xs" c="ink-secondary">
                          {assignment.dueAt
                            ? t("progress.detail.due", { date: date(assignment.dueAt) })
                            : t("progress.detail.noDeadline")}
                        </DsText>
                      </View>
                      <View style={styles.end}>
                        <DsText v="title-sm" c={STATE_TONE[assignment.state]}>
                          {t(`progress.detail.state.${assignment.state}`)}
                        </DsText>
                        {assignment.score !== null ? (
                          <DsText v="caption" c="ink-secondary" numeric>
                            {t("progress.detail.score", { value: assignment.score })}
                          </DsText>
                        ) : null}
                      </View>
                      <Icon name="chevron-right" size={18} color={ds.c["icon-tertiary"]} />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
                  {t("progress.detail.noAssignments")}
                </DsText>
              )
            ) : (
              <View style={[styles.list, { borderColor: ds.c.line }]}>
                {data.payments.map((payment, index) => {
                  const paid = payment.status === "paid";
                  return (
                    <View
                      key={payment.period}
                      style={[styles.row, index < data.payments.length - 1 && divider]}
                    >
                      <View style={styles.grow}>
                        <DsText v="title-sm" numberOfLines={1} style={styles.capitalize}>
                          {month(payment.period)}
                        </DsText>
                        <DsText v="body-xs" c="ink-secondary">
                          {paid && payment.paidAt
                            ? `${t("progress.detail.paidOn", { date: date(payment.paidAt) })}${
                                payment.note ? ` · ${payment.note}` : ""
                              }`
                            : monthlyFee
                              ? t("progress.fee", { amount: money(monthlyFee) })
                              : ""}
                        </DsText>
                      </View>
                      <DsText v="title-sm" c={paid ? "success" : "danger"}>
                        {paid
                          ? payment.amount !== null
                            ? money(payment.amount)
                            : t("progress.paid")
                          : t("progress.unpaid")}
                      </DsText>
                      {paid ? (
                        <View style={styles.actions}>
                          {/* `size-9 rounded-full bg-subtle text-ink-secondary` */}
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t("progress.payment.edit")}
                            onPress={() =>
                              setPaying({
                                studentId: shown.id,
                                name: shown.name,
                                month: payment.period,
                                payment,
                              })
                            }
                            style={({ pressed }) => [
                              styles.iconButton,
                              { backgroundColor: pressed ? ds.c.muted : ds.c.subtle },
                            ]}
                          >
                            <Icon name="edit" size={16} color={ds.c["ink-secondary"]} />
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t("progress.undoPaid")}
                            onPress={() => setUnmarking(payment)}
                            style={({ pressed }) => [
                              styles.iconButton,
                              { backgroundColor: pressed ? ds.c["danger-bg"] : ds.c.subtle },
                            ]}
                          >
                            {({ pressed }) => (
                              <Icon
                                name="close"
                                size={16}
                                color={pressed ? ds.c.danger : ds.c["ink-secondary"]}
                              />
                            )}
                          </Pressable>
                        </View>
                      ) : (
                        // `h-9 rounded-full bg-brand px-3.5 gap-1.5 text-body-xs font-medium`
                        <Pressable
                          accessibilityRole="button"
                          onPress={() =>
                            setPaying({
                              studentId: shown.id,
                              name: shown.name,
                              month: payment.period,
                              payment: null,
                            })
                          }
                          style={({ pressed }) => [
                            styles.markShort,
                            { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
                          ]}
                        >
                          <Icon name="check-circle" size={14} color={ds.c["on-action"]} />
                          <DsText v="body-xs" w="500" c="on-action">
                            {t("progress.payment.markShort")}
                          </DsText>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <PaymentDialog
            courseId={courseId}
            target={paying}
            monthlyFee={monthlyFee}
            onClose={() => setPaying(null)}
          />
          <ConfirmDialog
            open={unmarking !== null}
            onOpenChange={(open) => !open && setUnmarking(null)}
            icon="check-circle"
            title={t("progress.unmarkTitle")}
            description={t("progress.unmarkDescription", {
              name: shown.name,
              month: unmarking ? month(unmarking.period) : "",
            })}
            confirmLabel={t("progress.unmarkConfirm")}
            cancelLabel={t("progress.cancel")}
            pending={unmarkPaid.isPending}
            onConfirm={confirmUnmark}
          />
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    minWidth: 0,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: dsRadius.full,
  },
  /* `pb-2` */
  content: { paddingBottom: 8 },
  list: { overflow: "hidden", borderWidth: 1, borderRadius: dsRadius.xl },
  /* `items-start gap-3 px-4 py-3` */
  lesson: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lessonBody: { flex: 1, minWidth: 0, gap: 2 },
  /* `items-center gap-3 px-4 py-3` */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  grow: { flex: 1, minWidth: 0 },
  end: { flexShrink: 0, alignItems: "flex-end" },
  capitalize: { textTransform: "capitalize" },
  actions: { flexDirection: "row", gap: 4 },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dsRadius.full,
  },
  markShort: {
    height: 36,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: dsRadius.full,
  },
  /* `py-6 text-center text-body-sm text-ink-secondary` */
  empty: { paddingVertical: 24, textAlign: "center" },
});
