import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { parentAttendance, type AttendanceEntry, type AttendanceStats } from "@/modules/parent";
import { formatLocalized } from "@/shared/lib";
import { DsText, dsRadius, Icon, useDs, type DsColor } from "@/shared/ui";

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DAY_TONE: Record<string, { bg: DsColor; fg: DsColor }> = {
  attended: { bg: "accent-green-bg", fg: "accent-green-fg" },
  late: { bg: "accent-saffron-bg", fg: "accent-saffron-fg" },
  missed: { bg: "danger-bg", fg: "error-text" },
  live: { bg: "danger-bg", fg: "error-text" },
};

/**
 * Davomat xulosasi — veb `attendance-summary.tsx` `AttendanceDonut`: keldi,
 * kechikdi, kelmadi bo'laklari bilan halqa, foiz va izoh, ostida o'rtacha
 * fokus va eng yaxshi kun.
 */
export function AttendanceDonut({ stats }: { stats: AttendanceStats }) {
  const { t } = useTranslation(["parent", "lesson"]);
  const ds = useDs();
  const total = stats.attended + stats.late + stats.missed;
  const weekdays = t("lesson:list.weekdaysLong", { returnObjects: true }) as string[];

  if (!total) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: ds.c.surface }]}>
        <View style={[styles.emptyRing, { borderColor: ds.c.subtle }]}>
          <View style={[styles.emptyBar, { backgroundColor: ds.c["line-strong"] }]} />
        </View>
        <DsText v="title-sm" c="ink-secondary">
          {t("attendanceView.summary.empty")}
        </DsText>
      </View>
    );
  }

  const parts: Array<{ key: string; value: number; color: DsColor }> = [
    { key: "attended", value: stats.attended, color: "success" },
    { key: "late", value: stats.late, color: "saffron" },
    { key: "missed", value: stats.missed, color: "danger" },
  ];
  let offset = 0;

  return (
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <View style={styles.cardRow}>
        <View style={styles.donut}>
          <Svg width={116} height={116} viewBox="0 0 116 116" style={styles.donutSvg}>
            <Circle cx={58} cy={58} r={RADIUS} fill="none" strokeWidth={12} stroke={ds.c.subtle} />
            {parts.map((part) => {
              const length = (part.value / total) * CIRCUMFERENCE;
              const circle = (
                <Circle
                  key={part.key}
                  cx={58}
                  cy={58}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={12}
                  stroke={ds.c[part.color]}
                  strokeDasharray={`${Math.max(0, length - 2)} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return part.value ? circle : null;
            })}
          </Svg>
          <DsText v="h2" heading w="600" style={styles.percent}>
            {stats.percent}%
          </DsText>
          <DsText v="caption" c="ink-secondary">
            {t("attendanceView.summary.label")}
          </DsText>
        </View>
        <View style={styles.legend}>
          {parts.map((part) => (
            <View key={part.key} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: ds.c[part.color] }]} />
              <DsText v="body-sm" numberOfLines={1} style={styles.grow}>
                {t(`attendanceView.legend.${part.key}`)}
              </DsText>
              <DsText v="body-sm" w="600">
                {part.value}
              </DsText>
            </View>
          ))}
        </View>
      </View>
      {stats.averageFocus !== null ? (
        <View style={[styles.insight, { backgroundColor: ds.c["brand-subtle"] }]}>
          <Icon name="visibility" size={18} color={ds.c.brand} />
          <DsText v="body-xs" c="brand" style={styles.grow}>
            {stats.bestWeekday !== null
              ? t("attendanceView.summary.insight", { focus: stats.averageFocus, day: (weekdays[stats.bestWeekday] ?? "").toLowerCase() })
              : t("attendanceView.summary.insightNoDay", { focus: stats.averageFocus })}
          </DsText>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Kichik oylik kalendar — veb `attendance-summary.tsx` `MiniCalendar`: kun
 * holati rangida, bugun ko'k, kelgusi dars nuqta bilan, tanlangan kun ramkada.
 */
export function MiniCalendar({
  month,
  byDay,
  now,
  selected,
  onMonth,
  onPick,
}: {
  month: Date;
  byDay: Map<string, AttendanceEntry[]>;
  now: number;
  selected: string | null;
  onMonth: (step: number) => void;
  onPick: (date: Date) => void;
}) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const labels = t("home.hero.weekdays", { returnObjects: true }) as string[];
  const today = parentAttendance.dayKey(now);
  const cells = parentAttendance.monthGrid(month.getFullYear(), month.getMonth());

  return (
    <View style={[styles.calendar, { backgroundColor: ds.c.surface }]}>
      <View style={styles.calendarHead}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("attendanceView.calendar.prev")}
          onPress={() => onMonth(-1)}
          style={({ pressed }) => [styles.arrow, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }]}
        >
          <Icon name="chevron-left" size={18} color={ds.c.icon} />
        </Pressable>
        <DsText v="title-sm" style={styles.calendarTitle}>
          {formatLocalized(month, "LLLL yyyy")}
        </DsText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("attendanceView.calendar.next")}
          onPress={() => onMonth(1)}
          style={({ pressed }) => [styles.arrow, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }]}
        >
          <Icon name="chevron-right" size={18} color={ds.c.icon} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {labels.map((label) => (
          <View key={label} style={styles.cell}>
            <DsText v="caption" c="ink-tertiary" style={styles.weekday}>
              {label}
            </DsText>
          </View>
        ))}
        {cells.map((date) => {
          const key = parentAttendance.dayKey(date);
          const status = parentAttendance.dayStatus(byDay.get(key));
          const outside = date.getMonth() !== month.getMonth();
          const isToday = key === today;
          const tone = isToday ? { bg: "brand" as DsColor, fg: "on-action" as DsColor } : status && status !== "upcoming" ? DAY_TONE[status] : null;
          return (
            <View key={key} style={styles.cell}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: selected === key }}
                onPress={() => onPick(date)}
                style={({ pressed }) => [
                  styles.day,
                  tone ? { backgroundColor: ds.c[tone.bg] } : null,
                  outside && styles.outside,
                  selected === key && { borderWidth: 2, borderColor: ds.c.brand },
                  pressed && styles.pressed,
                ]}
              >
                <DsText v="body-sm" w="500" c={tone?.fg ?? "ink"}>
                  {date.getDate()}
                </DsText>
                {status === "upcoming" && !isToday ? <View style={[styles.upcoming, { backgroundColor: ds.c["accent-teal-fg"] }]} /> : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.8 },
  emptyCard: { alignItems: "center", gap: 12, padding: 24, borderRadius: 20 },
  emptyRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 10, alignItems: "center", justifyContent: "center" },
  emptyBar: { width: 28, height: 4, borderRadius: 2 },
  card: { gap: 16, padding: 20, borderRadius: 20 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  donut: { width: 116, height: 116, alignItems: "center", justifyContent: "center" },
  donutSvg: { position: "absolute", transform: [{ rotate: "-90deg" }] },
  /* `font-heading text-[22px]/7 font-semibold` */
  percent: { fontSize: 22, lineHeight: 28 },
  legend: { flex: 1, minWidth: 0, gap: 10 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  insight: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: dsRadius.xl },
  calendar: { gap: 12, padding: 16, borderRadius: 20 },
  calendarHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  calendarTitle: { flex: 1, textAlign: "center" },
  arrow: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  /* `grid grid-cols-7 gap-1` */
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 4 },
  /* 7 ustun: aniq `100/7 %` yaxlitlashda sig'may 7-katakni keyingi qatorga tushirardi. */
  cell: { width: "14.28%", paddingHorizontal: 2 },
  weekday: { paddingBottom: 4, textAlign: "center" },
  day: { height: 40, alignItems: "center", justifyContent: "center", borderRadius: dsRadius.xl },
  outside: { opacity: 0.35 },
  upcoming: { position: "absolute", bottom: 4, width: 4, height: 4, borderRadius: 2 },
});
