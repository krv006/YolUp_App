import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import {
  averageFocus,
  buildLessonRoster,
  LATE_AFTER_MINUTES,
  useAttendance,
  useUpdateAttendanceNote,
  type RosterEntry,
  type RosterStatus,
} from "@/modules/attendance";
import { useAuth } from "@/modules/auth";
import { useCourseStudents } from "@/modules/course";
import { ROLES } from "@/shared/constants";
import { formatDayTime, formatDuration, formatMessageTime } from "@/shared/lib";
import type { AttendanceRow, Lesson } from "@/shared/types";
import { Avatar, DsText, dsRadius, dsType, Icon, MobileInput, Sheet, toast, useDs, type DsColor } from "@/shared/ui";

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
 * ko'rinadi. O'qituvchi darsga kirgan o'quvchi qatoriga kechikish sababi va
 * izoh yozadi (qator ostida ochiladigan forma).
 */
export function LessonAttendanceDialog({ lesson, open, onOpenChange }: LessonAttendanceDialogProps) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const enabled = open && Boolean(lesson);
  const attendance = useAttendance({ lesson: lesson?.id ?? "", page_size: 100 }, enabled);
  const students = useCourseStudents(lesson?.courseId ?? null, { page_size: 100 }, enabled);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const { user } = useAuth();
  const canEdit = user?.role === ROLES.TEACHER;

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
      onClose={() => {
        setEditing(null);
        onOpenChange(false);
      }}
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
                editing={editing === entry.student.id}
                onEdit={canEdit && entry.row ? () => setEditing(entry.student.id) : undefined}
                onEditDone={() => setEditing(null)}
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

/**
 * Kechikish sababi va o'qituvchi izohi — veb `NoteEditor`. Faqat o'zgargan
 * maydon `PATCH /attendance/<id>/` ga yuboriladi; hech narsa o'zgarmagan
 * bo'lsa so'rovsiz yopiladi.
 */
function NoteEditor({ row, onDone }: { row: AttendanceRow; onDone: () => void }) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const save = useUpdateAttendanceNote();
  const [lateReason, setLateReason] = useState(row.lateReason ?? "");
  const [teacherNote, setTeacherNote] = useState(row.teacherNote ?? "");

  function submit() {
    const nextReason = lateReason.trim();
    const nextNote = teacherNote.trim();
    const reasonChanged = nextReason !== (row.lateReason ?? "");
    const noteChanged = nextNote !== (row.teacherNote ?? "");
    if (!reasonChanged && !noteChanged) {
      onDone();
      return;
    }
    save.mutate(
      { id: row.id, lateReason: reasonChanged ? nextReason : undefined, teacherNote: noteChanged ? nextNote : undefined },
      {
        onSuccess: () => {
          toast.success(t("attendanceDetail.noteSaved"));
          onDone();
        },
        onError: (error) => toast.error(error.message || t("attendanceDetail.noteFailed")),
      }
    );
  }

  return (
    // `flex flex-col gap-2.5 bg-subtle px-3.5 py-3`
    <View style={[styles.editor, { backgroundColor: ds.c.subtle }]}>
      <View style={styles.field}>
        <DsText v="caption-strong" c="ink-secondary">
          {t("attendanceDetail.reasonLabel")}
        </DsText>
        <MobileInput
          surface
          autoFocus
          maxLength={200}
          value={lateReason}
          placeholder={t("attendanceDetail.reasonPlaceholder")}
          onChangeText={setLateReason}
          style={styles.input}
        />
      </View>
      <View style={styles.field}>
        <DsText v="caption-strong" c="ink-secondary">
          {t("attendanceDetail.noteLabel")}
        </DsText>
        <MobileInput
          surface
          multiline
          maxLength={2000}
          value={teacherNote}
          placeholder={t("attendanceDetail.notePlaceholder")}
          onChangeText={setTeacherNote}
          style={[styles.input, styles.textarea]}
        />
      </View>
      <DsText v="caption" c="ink-tertiary">
        {t("attendanceDetail.noteHint")}
      </DsText>
      <View style={styles.editorActions}>
        <Pressable
          accessibilityRole="button"
          onPress={onDone}
          style={({ pressed }) => [styles.pill, pressed && { backgroundColor: ds.c.surface }]}
        >
          <DsText v="button">{t("attendanceDetail.noteCancel")}</DsText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: save.isPending }}
          disabled={save.isPending}
          onPress={submit}
          style={({ pressed }) => [
            styles.pill,
            styles.pillPrimary,
            { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
            save.isPending && styles.dim,
          ]}
        >
          <DsText v="button" c="on-action">
            {t("attendanceDetail.noteSave")}
          </DsText>
        </Pressable>
      </View>
    </View>
  );
}

interface RosterRowProps {
  entry: RosterEntry;
  last: boolean;
  expanded: boolean;
  onToggle: () => void;
  editing: boolean;
  /** Faqat o'qituvchida va o'quvchi darsga kirgan bo'lsa. */
  onEdit?: () => void;
  onEditDone: () => void;
}

function RosterRow({ entry, last, expanded, onToggle, editing, onEdit, onEditDone }: RosterRowProps) {
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
        {row?.lateReason ? (
          <DsText v="caption" c="warning-text">
            {t("attendanceDetail.reasonLine", { text: row.lateReason })}
          </DsText>
        ) : null}
        {row?.teacherNote ? (
          <DsText v="caption" c="ink-secondary">
            {t("attendanceDetail.noteLine", { text: row.teacherNote })}
          </DsText>
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
      <View style={styles.rowWrap}>
        {exits ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={onToggle}
            style={({ pressed }) => [styles.row, styles.grow, pressed && { backgroundColor: ds.c.subtle }]}
          >
            {content}
          </Pressable>
        ) : (
          <View style={[styles.row, styles.grow]}>{content}</View>
        )}
        {onEdit && !editing ? (
          // `mt-2 mr-2 size-9 rounded-full text-icon-secondary`
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={row?.teacherNote || row?.lateReason ? t("attendanceDetail.noteEdit") : t("attendanceDetail.noteAdd")}
            onPress={onEdit}
            style={({ pressed }) => [styles.noteButton, pressed && { backgroundColor: ds.c.subtle }]}
          >
            {({ pressed }) => <Icon name="edit-note" size={20} color={pressed ? ds.c.brand : ds.c["icon-secondary"]} />}
          </Pressable>
        ) : null}
      </View>
      {editing && row ? <NoteEditor row={row} onDone={onEditDone} /> : null}

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
  rowWrap: { flexDirection: "row", alignItems: "flex-start" },
  /* `flex items-start gap-3 px-3.5 py-3` */
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: { flexShrink: 0, paddingHorizontal: 8, paddingVertical: 2, borderRadius: dsRadius.full },
  alert: { flexDirection: "row", alignItems: "center", gap: 4 },
  chevron: { marginTop: 10 },
  noteButton: { width: 36, height: 36, marginTop: 8, marginRight: 8, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  editor: { gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  field: { gap: 4 },
  /* `h-10 rounded-md px-3 text-body-sm` */
  input: { height: 40, paddingHorizontal: 12, borderRadius: dsRadius.md, fontSize: dsType["body-sm"].fontSize },
  /* `rows={2} py-2` — `input` balandligini bosib o'tadi. */
  textarea: { height: 64, paddingTop: 8, paddingBottom: 8 },
  editorActions: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  /* `h-9 rounded-full px-3.5` */
  pill: { height: 36, justifyContent: "center", paddingHorizontal: 14, borderRadius: dsRadius.full },
  pillPrimary: { paddingHorizontal: 16 },
  dim: { opacity: 0.6 },
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
