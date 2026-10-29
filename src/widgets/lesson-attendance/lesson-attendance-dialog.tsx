import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { averageFocus, buildLessonRoster, LATE_AFTER_MINUTES, useAttendance, type RosterEntry, type RosterStatus } from "@/modules/attendance";
import { useCourseStudents } from "@/modules/course";
import { formatDayTime, formatDuration, formatMessageTime } from "@/shared/lib";
import type { Lesson } from "@/shared/types";
import { Avatar, DsText, dsRadius, Icon, Sheet, useDs, type DsColor } from "@/shared/ui";

export interface LessonAttendanceDialogProps {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_TONE: Record<RosterStatus, { bg: DsColor; fg: DsColor }> = {
  inLesson: { bg: "brand-subtle", fg: "brand" },
  present: { bg: "success-bg", fg: "success-fg" },
  late: { bg: "warning-bg", fg: "warning-fg" },
  absent: { bg: "danger-bg", fg: "error-text" },
};

/**
 * Dars davomati — veb `widgets/lesson-attendance/lesson-attendance-dialog.tsx`
 * (`AppDialog variant="panel"`) ning pastki oyna varianti: qo'shilgan,
 * kechikkan, kelmagan va o'rtacha fokus; guruhning har bir o'quvchisi holati
 * bilan. Darsdan chiqishlari bo'lsa qator ochilib, chiqish-qaytish vaqtlari
 * ko'rinadi.
 */
export function LessonAttendanceDialog({ lesson, open, onOpenChange }: LessonAttendanceDialogProps) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const enabled = open && Boolean(lesson);
  const attendance = useAttendance({ lesson: lesson?.id ?? "", page_size: 100 }, enabled);
  const students = useCourseStudents(lesson?.courseId ?? null, { page_size: 100 }, enabled);
  const [expanded, setExpanded] = useState<string | null>(null);

  const roster = useMemo(
    () =>
      lesson
        ? buildLessonRoster(
            attendance.data ?? [],
            (students.data?.items ?? []).filter((item) => item.status === "approved").map((item) => item.student),
            lesson.startsAt,
            lesson.status === "live"
          )
        : [],
    [attendance.data, students.data, lesson]
  );

  const joined = roster.filter((entry) => entry.status !== "absent").length;
  const late = roster.filter((entry) => entry.lateMinutes >= LATE_AFTER_MINUTES && entry.row).length;
  const absent = roster.length - joined;
  const focus = averageFocus(attendance.data ?? []);
  const loading = attendance.isLoading || students.isLoading;

  const tiles = [
    { label: t("attendanceDetail.statJoined"), value: `${joined}/${roster.length}` },
    { label: t("attendanceDetail.statLate"), value: String(late) },
    { label: t("attendanceDetail.statAbsent"), value: String(absent) },
    { label: t("attendanceDetail.statFocus"), value: focus === null ? "—" : `${focus}%` },
  ];

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("attendanceDetail.title")}
      description={lesson ? `${lesson.courseTitle} · ${formatDayTime(lesson.startsAt)}` : undefined}
    >
      <View style={styles.body}>
        {/* `grid-cols-2 gap-2`, karta `rounded-xl bg-subtle px-3 py-2.5` */}
        <View style={styles.tiles}>
          {tiles.map((tile) => (
            <View key={tile.label} style={[styles.tile, { backgroundColor: ds.c.subtle }]}>
              <DsText v="title" numeric>
                {loading ? "…" : tile.value}
              </DsText>
              <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                {tile.label}
              </DsText>
            </View>
          ))}
        </View>
        <DsText v="caption" c="ink-tertiary">
          {t("attendanceDetail.lateHint", { count: LATE_AFTER_MINUTES })}
        </DsText>

        {loading ? (
          <View>
            {Array.from({ length: 4 }, (_, index) => (
              <View key={index} style={[styles.skeletonRow, index < 3 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
                <View style={[styles.skeletonAvatar, { backgroundColor: ds.c.skeleton }]} />
                <View style={styles.skeletonLines}>
                  <View style={[styles.skeletonLine, { width: 140, backgroundColor: ds.c.skeleton }]} />
                  <View style={[styles.skeletonLine, { width: 90, backgroundColor: ds.c.skeleton }]} />
                </View>
              </View>
            ))}
          </View>
        ) : roster.length ? (
          <View style={[styles.list, { borderColor: ds.c.line }]}>
            {roster.map((entry, index) => (
              <RosterRow
                key={entry.student.id}
                entry={entry}
                last={index === roster.length - 1}
                expanded={expanded === entry.student.id}
                onToggle={() => setExpanded((current) => (current === entry.student.id ? null : entry.student.id))}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.empty, { backgroundColor: ds.c.subtle }]}>
            <DsText v="body-sm" c="ink-secondary" style={styles.center}>
              {t("attendanceDetail.empty")}
            </DsText>
          </View>
        )}
      </View>
    </Sheet>
  );
}

function RosterRow({ entry, last, expanded, onToggle }: { entry: RosterEntry; last: boolean; expanded: boolean; onToggle: () => void }) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const { row, status } = entry;
  const exits = row?.focus.exits ?? 0;
  const tone = STATUS_TONE[status];
  const statusLabel =
    status === "inLesson"
      ? t("attendanceDetail.statusInLesson")
      : status === "late"
        ? t("attendanceDetail.statusLate", { count: entry.lateMinutes })
        : status === "absent"
          ? t("attendanceDetail.statusAbsent")
          : t("attendanceDetail.statusPresent");

  const details = row
    ? [
        row.minutes === null
          ? t("attendanceDetail.since", { time: row.entered })
          : t("attendanceDetail.stay", { from: row.entered, to: row.exited, minutes: row.minutes }),
        row.focusPercent === null ? null : t("attendanceDetail.focus", { value: Math.round(row.focusPercent) }),
        exits ? t("attendanceDetail.exits", { count: exits, duration: formatDuration(row.focus.awaySeconds) }) : t("attendanceDetail.noExits"),
        row.attentionTotal ? t("attendanceDetail.attention", { answered: row.attentionAnswered, total: row.attentionTotal }) : null,
      ].filter(Boolean)
    : [];

  const content: ReactNode = (
    <>
      <Avatar variant="legacy" name={entry.student.name} src={entry.student.avatarUrl ?? undefined} tone={entry.student.avatarTone} size="sm" box={40} />
      <View style={styles.grow}>
        <View style={styles.nameRow}>
          <DsText v="title-sm" numberOfLines={1} style={styles.grow}>
            {entry.student.name}
          </DsText>
          <View style={[styles.chip, { backgroundColor: ds.c[tone.bg] }]}>
            <DsText v="caption-strong" c={tone.fg}>
              {statusLabel}
            </DsText>
          </View>
        </View>
        {details.length ? (
          <DsText v="body-xs" c="ink-secondary">
            {details.join(" · ")}
          </DsText>
        ) : null}
        {row?.focus.alert ? (
          <View style={styles.alert}>
            <Icon name="warning" size={14} color={ds.c["error-text"]} />
            <DsText v="caption-strong" c="error-text">
              {t("attendanceDetail.alert")}
            </DsText>
          </View>
        ) : null}
      </View>
      {exits ? (
        <View style={styles.chevron}>
          <Icon name={expanded ? "expand-less" : "expand-more"} size={20} color={ds.c["icon-secondary"]} />
        </View>
      ) : null}
    </>
  );

  return (
    <View style={!last && { borderBottomWidth: 1, borderBottomColor: ds.c.line }}>
      {exits ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={onToggle}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: ds.c.subtle }]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.row}>{content}</View>
      )}

      {expanded && row ? (
        <View style={[styles.details, { backgroundColor: ds.c.subtle }]}>
          <View style={styles.totals}>
            <DsText v="body-xs" c="ink-secondary">
              {t("attendanceDetail.awayTotal", { duration: formatDuration(row.focus.awaySeconds) })}
            </DsText>
            <DsText v="body-xs" c="ink-secondary">
              {t("attendanceDetail.longest", { duration: formatDuration(row.focus.longestSeconds) })}
            </DsText>
          </View>
          {row.focus.timeline.map((exit, index) => (
            // `rounded-lg bg-surface px-3 py-2 gap-3 text-body-xs`
            <View key={`${exit.leftAt}-${index}`} style={[styles.exit, { backgroundColor: ds.c.surface }]}>
              <View style={[styles.exitIndex, { backgroundColor: ds.c["warning-bg"] }]}>
                <DsText v="caption-strong" c="warning-fg">
                  {index + 1}
                </DsText>
              </View>
              <DsText v="body-xs" numeric style={styles.grow}>
                {formatMessageTime(exit.leftAt)} → {exit.returnedAt ? formatMessageTime(exit.returnedAt) : t("attendanceDetail.notReturned")}
              </DsText>
              <DsText v="body-xs" w="600" numeric>
                {exit.seconds === null ? "—" : formatDuration(exit.seconds)}
              </DsText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, paddingBottom: 16 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { width: "48.5%", flexGrow: 1, minWidth: 0, gap: 2, paddingHorizontal: 12, paddingVertical: 10, borderRadius: dsRadius.xl },
  list: { overflow: "hidden", borderWidth: 1, borderRadius: dsRadius.xl },
  /* `flex items-start gap-3 px-3.5 py-3` */
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: { flexShrink: 0, paddingHorizontal: 8, paddingVertical: 2, borderRadius: dsRadius.full },
  alert: { flexDirection: "row", alignItems: "center", gap: 4 },
  chevron: { marginTop: 10 },
  details: { gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  totals: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 4 },
  exit: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: dsRadius.lg },
  exitIndex: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  empty: { paddingHorizontal: 16, paddingVertical: 24, borderRadius: dsRadius.xl },
  skeletonRow: { height: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4 },
  skeletonAvatar: { width: 40, height: 40, borderRadius: 20 },
  skeletonLines: { gap: 8 },
  skeletonLine: { height: 12, borderRadius: 6 },
});
