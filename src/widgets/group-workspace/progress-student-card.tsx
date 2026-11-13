import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { INACTIVE_DAYS, daysSinceVisit, type StudentProgress } from "@/modules/progress";
import { Avatar, DsText, dsRadius, Icon, useDs, type DsColor } from "@/shared/ui";

/**
 * Progress tabidagi o'quvchi kartasi — veb `progress-student-card.tsx`:
 * ism va qo'shilgan sana (bosilsa batafsil oyna), to'lov holati belgisi,
 * davomat / vazifa / baho ko'rsatkichlari, ogohlantirish chip'lari va
 * to'lovni belgilash yoki tahrirlash tugmalari.
 */
export function ProgressStudentCard({
  student,
  withPayments,
  beforeJoin,
  busy,
  now,
  formatDate,
  formatMoney,
  onOpen,
  onPay,
  onUnmark,
}: {
  student: StudentProgress;
  withPayments: boolean;
  beforeJoin: boolean;
  busy: boolean;
  now: Date;
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  onOpen: () => void;
  onPay: () => void;
  onUnmark: () => void;
}) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const paid = student.payment.status === "paid";
  const payable = withPayments && !beforeJoin;
  const { homework, attendance } = student;
  const idle = daysSinceVisit(student.lastVisitAt, now);
  const warnings = [
    homework.missed > 0
      ? { text: t("progress.missed", { count: homework.missed }), danger: true }
      : null,
    withPayments && !paid && student.payment.unpaidMonths > 1
      ? {
          text: t("progress.unpaidMonths", { count: student.payment.unpaidMonths }),
          danger: true,
        }
      : null,
    homework.resubmitRequested > 0
      ? { text: t("progress.resubmit", { count: homework.resubmitRequested }), danger: false }
      : null,
    idle === null
      ? attendance.total > 0
        ? { text: t("progress.neverVisited"), danger: false }
        : null
      : idle >= INACTIVE_DAYS
        ? { text: t("progress.inactive", { count: idle }), danger: false }
        : null,
  ].filter((item) => item !== null);

  /* paid: `bg-brand-subtle text-brand`; overdue: `bg-danger-bg text-danger`; aks holda saffron */
  const status: { bg: DsColor; fg: DsColor } = paid
    ? { bg: "brand-subtle", fg: "brand" }
    : student.payment.overdue
      ? { bg: "danger-bg", fg: "danger" }
      : { bg: "accent-saffron-bg", fg: "accent-saffron-fg" };

  return (
    // `flex flex-col gap-3 rounded-xl bg-surface p-4`
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.head}>
        <Avatar variant="legacy" name={student.name} size="sm" box={44} />
        <View style={styles.grow}>
          <DsText v="title" numberOfLines={1}>
            {student.name}
          </DsText>
          <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
            {t("progress.joined", { date: formatDate(student.joinedAt) })}
          </DsText>
        </View>
        {payable ? (
          <View style={[styles.pill, { backgroundColor: ds.c[status.bg] }]}>
            <DsText v="caption-strong" c={status.fg}>
              {paid
                ? t("progress.paid")
                : student.payment.overdue
                  ? t("progress.overdue")
                  : t("progress.unpaid")}
            </DsText>
          </View>
        ) : withPayments ? (
          <View style={[styles.pill, { backgroundColor: ds.c.subtle }]}>
            <DsText v="caption-strong" c="ink-secondary">
              {t("progress.notJoinedYet")}
            </DsText>
          </View>
        ) : null}
      </Pressable>

      {/* `grid grid-cols-3 gap-2` */}
      <View style={styles.stats}>
        <ProgressStat
          label={t("progress.statAttendance")}
          value={attendance.percent === null ? "—" : `${attendance.percent}%`}
          percent={attendance.percent}
          hint={
            attendance.focusPercent === null
              ? undefined
              : t("progress.focusHint", { value: attendance.focusPercent })
          }
        />
        <ProgressStat
          label={t("progress.statHomework")}
          value={`${homework.submitted}/${homework.total}`}
          percent={homework.completionPercent}
          hint={
            homework.awaitingReview > 0
              ? t("progress.awaitingHint", { count: homework.awaitingReview })
              : undefined
          }
        />
        <ProgressStat
          label={t("progress.gradeLabel")}
          value={homework.average === null ? "—" : String(homework.average)}
        />
      </View>

      {warnings.length ? (
        // `flex flex-wrap gap-1.5`
        <View style={styles.warnings}>
          {warnings.map((warning) => (
            <View
              key={warning.text}
              style={[
                styles.warning,
                { backgroundColor: warning.danger ? ds.c["danger-bg"] : ds.c["warning-bg"] },
              ]}
            >
              <DsText v="caption-strong" c={warning.danger ? "danger" : "warning-text"}>
                {warning.text}
              </DsText>
            </View>
          ))}
        </View>
      ) : null}

      {!payable ? null : paid ? (
        <View style={styles.paidRow}>
          <DsText v="body-xs" c="ink-secondary" numberOfLines={1} style={styles.grow}>
            {[
              student.payment.amount !== null
                ? t("progress.payment.sum", { amount: formatMoney(student.payment.amount) })
                : "",
              student.payment.note,
            ]
              .filter(Boolean)
              .join(" · ")}
          </DsText>
          {/* `h-10 rounded-full bg-subtle px-4 gap-1.5` */}
          <Pressable
            accessibilityRole="button"
            onPress={onPay}
            style={({ pressed }) => [
              styles.edit,
              { backgroundColor: pressed ? ds.c.muted : ds.c.subtle },
            ]}
          >
            <Icon name="edit" size={16} color={ds.c.ink} />
            <DsText v="body-sm" w="500">
              {t("progress.payment.edit")}
            </DsText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("progress.undoPaid")}
            disabled={busy}
            onPress={onUnmark}
            style={({ pressed }) => [
              styles.undo,
              { backgroundColor: pressed ? ds.c["danger-bg"] : ds.c.subtle },
              busy && styles.dim,
            ]}
          >
            {({ pressed }) => (
              <Icon name="close" size={16} color={pressed ? ds.c.danger : ds.c["ink-secondary"]} />
            )}
          </Pressable>
        </View>
      ) : (
        // `h-10 rounded-full bg-brand gap-2 text-body-sm font-medium text-on-action`
        <Pressable
          accessibilityRole="button"
          onPress={onPay}
          style={({ pressed }) => [
            styles.markPaid,
            { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
          ]}
        >
          <Icon name="check-circle" size={16} color={ds.c["on-action"]} />
          <DsText v="body-sm" w="500" c="on-action">
            {t("progress.markPaid")}
          </DsText>
        </Pressable>
      )}
    </View>
  );
}

/** `rounded-xl bg-subtle px-3 py-2.5 gap-1.5`: yorliq, qiymat, `h-1` chiziq va izoh. */
function ProgressStat({
  label,
  value,
  percent,
  hint,
}: {
  label: string;
  value: string;
  percent?: number | null;
  hint?: string;
}) {
  const ds = useDs();
  return (
    <View style={[styles.stat, { backgroundColor: ds.c.subtle }]}>
      <DsText v="caption" c="ink-secondary" numberOfLines={1}>
        {label}
      </DsText>
      <DsText v="title" numeric style={styles.statValue}>
        {value}
      </DsText>
      <View style={[styles.bar, { backgroundColor: ds.c.line }]}>
        {percent !== null && percent !== undefined ? (
          <View
            style={[
              styles.barFill,
              {
                width: `${percent}%`,
                backgroundColor: percent >= 50 ? ds.c.brand : ds.c.danger,
              },
            ]}
          />
        ) : null}
      </View>
      {hint ? (
        <DsText v="caption" c="ink-secondary" numberOfLines={1}>
          {hint}
        </DsText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, padding: 16, borderRadius: dsRadius.xl },
  /* `flex items-center gap-3 text-left` */
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  /* `h-7 rounded-full px-3 text-caption-strong` */
  pill: {
    height: 28,
    flexShrink: 0,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: dsRadius.full,
  },
  stats: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: dsRadius.xl,
  },
  /* `text-title leading-5 font-numeric` */
  statValue: { lineHeight: 20 },
  bar: { height: 4, overflow: "hidden", borderRadius: dsRadius.full },
  barFill: { height: "100%", borderRadius: dsRadius.full },
  warnings: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  /* `h-6 rounded-full px-2.5 text-caption-strong` */
  warning: {
    height: 24,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: dsRadius.full,
  },
  paidRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  edit: {
    height: 40,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: dsRadius.full,
  },
  /* `size-10 rounded-full bg-subtle` */
  undo: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dsRadius.full,
  },
  dim: { opacity: 0.6 },
  markPaid: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: dsRadius.full,
  },
});
