import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { Lesson } from "@/shared/types";
import { DsText, dsRadius, Icon, MobileButton, Sheet, toneColors, useDs, type IconName } from "@/shared/ui";

export interface LessonDetailDrawerProps {
  lesson: Lesson | null;
  studentCount: number;
  now: Date;
  onOpenChange: (open: boolean) => void;
  onChat: (lesson: Lesson) => void;
  onJoin: (lesson: Lesson) => void;
  onRatings: (lesson: Lesson) => void;
  onCancel: (lesson: Lesson) => void;
  student?: boolean;
  teacherName?: string;
  onRemind?: (lesson: Lesson) => void;
  onRecording?: (lesson: Lesson) => void;
  onRate?: (lesson: Lesson) => void;
}

function clock(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Dars tafsilotlari — veb `lesson-detail-drawer.tsx` ning tor ekran varianti
 * (pastki oyna): holat va test yorlig'i, vaqt, takrorlanish, mavzu, vazifa,
 * o'quvchilar (o'quvchida — o'qituvchi); o'qituvchida "Tahrirlash"/"Baholar"
 * va "Bekor qilish", o'quvchida yozuv, baholash yoki eslatma; pastda
 * "Chatni ochish" va "Darsga kirish".
 */
export function LessonDetailDrawer({
  lesson,
  studentCount,
  now,
  onOpenChange,
  onChat,
  onJoin,
  onRatings,
  onCancel,
  student = false,
  teacherName = "",
  onRemind,
  onRecording,
  onRate,
}: LessonDetailDrawerProps) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const months = t("list.monthsLong", { returnObjects: true }) as string[];
  const weekdaysShort = t("list.weekdaysShort", { returnObjects: true }) as string[];

  if (!lesson) return null;

  const starts = new Date(lesson.startsAt);
  const ends = new Date(starts.getTime() + (lesson.durationMinutes || 45) * 60_000);
  const minutes = Math.round((starts.getTime() - now.getTime()) / 60_000);
  const today = starts.toDateString() === now.toDateString();
  const live = lesson.status === "live";
  const finished = lesson.status === "finished";
  const closed = finished || lesson.status === "cancelled";

  const timeValue = `${today ? `${t("schedule.today")}, ` : `${starts.getDate()}-${months[starts.getMonth()]}, `}${clock(starts)} – ${clock(ends)} · ${t(
    "list.durationMinutes",
    { count: lesson.durationMinutes || 45 }
  )}`;
  const statusLabel = live ? t("schedule.live") : minutes >= 0 ? t("schedule.startsIn", { count: minutes }) : t(`status.${lesson.status}`);
  const statusTone = toneColors(live ? "bg-danger-bg text-error-text" : finished ? "bg-success-bg text-success-fg" : "bg-accent-teal-bg text-accent-teal-fg", ds);
  const repeatValue = lesson.recurrence
    ? [
        lesson.recurrence.weekdays
          .map((day) => weekdaysShort[day] ?? "")
          .filter(Boolean)
          .join(", "),
        t(`schedule.rows.freq.${lesson.recurrence.freq}`, { defaultValue: t("schedule.rows.repeatValue") }),
      ]
        .filter(Boolean)
        .join(" — ")
    : t("schedule.rows.repeatValue");
  const homework = student ? lesson.note || lesson.assignment?.title || "" : lesson.note;

  const footer = (
    <>
      <MobileButton variant="secondary" label={t("schedule.openChat")} onPress={() => onChat(lesson)} />
      {student && closed ? null : <MobileButton label={t("schedule.join")} onPress={() => onJoin(lesson)} />}
    </>
  );

  return (
    <Sheet variant="app" open onClose={() => onOpenChange(false)} title={lesson.courseTitle} description={t("schedule.detailTitle")} footer={footer}>
      <View style={styles.body}>
        <View style={[styles.chips, !student && styles.chipsSpaced]}>
          <View style={[styles.chip, { backgroundColor: statusTone.bg }]}>
            <Icon name="schedule" size={14} color={statusTone.fg ?? ds.c.ink} />
            <DsText v="caption-strong" style={{ color: statusTone.fg }}>
              {statusLabel}
            </DsText>
          </View>
          {lesson.quizId ? (
            <View style={[styles.chip, { backgroundColor: ds.c["brand-subtle"] }]}>
              <Icon name="quiz" size={14} color={ds.c.brand} />
              <DsText v="caption-strong" c="brand">
                {t("schedule.quizAttached")}
              </DsText>
            </View>
          ) : null}
        </View>

        <DetailRow icon="schedule" label={t("schedule.rows.time")} value={timeValue} />
        {lesson.recurrence || lesson.recurrenceId ? <DetailRow icon="refresh" label={t("schedule.rows.repeat")} value={repeatValue} /> : null}
        <DetailRow icon="quiz" label={t("schedule.rows.topic")} value={lesson.title || t("list.missingTopic")} />
        {homework ? <DetailRow icon="assign" label={t("schedule.rows.homework")} value={homework} /> : null}
        {student ? (
          teacherName ? <DetailRow icon="person" label={t("schedule.rows.teacher")} value={teacherName} /> : null
        ) : (
          <DetailRow icon="person" label={t("schedule.rows.students")} value={t("schedule.students", { count: studentCount })} />
        )}

        {student ? (
          finished ? (
            <View style={[styles.pair, styles.actionsTop]}>
              <ActionButton icon="play-circle-fill" label={t("schedule.recording")} outline onPress={() => onRecording?.(lesson)} height={42} />
              <ActionButton
                icon="star"
                label={lesson.myRating ? t("schedule.myRating", { value: lesson.myRating }) : t("schedule.rate")}
                tone="brand"
                onPress={() => onRate?.(lesson)}
                height={42}
              />
            </View>
          ) : lesson.status === "cancelled" ? null : (
            <View style={styles.actionsTop}>
              {/* Veb #161: eslatma yoqilgan bo'lsa `bg-brand-subtle text-brand` va daqiqasi */}
              <ActionButton
                icon={lesson.hasReminder ? "notifications-off" : "notifications"}
                label={lesson.hasReminder ? t("schedule.reminderOn", { count: lesson.reminderMinutes ?? 15 }) : t("schedule.remind")}
                outline={!lesson.hasReminder}
                tone={lesson.hasReminder ? "brand" : undefined}
                onPress={() => onRemind?.(lesson)}
                height={42}
              />
            </View>
          )
        ) : (
          <View style={[styles.pair, styles.actionsTeacher]}>
            <ActionButton
              icon={finished ? "star" : "edit"}
              label={finished ? t("schedule.ratings") : t("schedule.edit")}
              outline
              onPress={() => (finished ? onRatings(lesson) : onChat(lesson))}
            />
            <ActionButton icon="close" label={t("schedule.cancel")} tone="danger" disabled={finished} onPress={() => onCancel(lesson)} />
          </View>
        )}
      </View>
    </Sheet>
  );
}

/** Tafsilot qatori — veb `MobileRow`: `size-9 rounded-md bg-brand-subtle` belgi, yorliq va qiymat. */
function DetailRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const ds = useDs();
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
        <Icon name={icon} size={20} color={ds.c.brand} />
      </View>
      <View style={styles.grow}>
        <DsText v="caption" c="ink-secondary" numberOfLines={1}>
          {label}
        </DsText>
        <DsText v="body-sm" w="600">
          {value}
        </DsText>
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  outline = false,
  tone,
  disabled = false,
  height = 44,
  onPress,
}: {
  icon: IconName;
  label: string;
  outline?: boolean;
  tone?: "brand" | "danger";
  disabled?: boolean;
  height?: number;
  onPress: () => void;
}) {
  const ds = useDs();
  const colors =
    tone === "danger"
      ? { bg: ds.c["danger-bg"], fg: "danger" as const }
      : tone === "brand"
        ? { bg: ds.c["brand-subtle"], fg: "brand" as const }
        : { bg: ds.c.surface, fg: "ink" as const };
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { height, backgroundColor: pressed && outline ? ds.c.subtle : colors.bg },
        outline && { borderWidth: 1, borderColor: ds.c["line-strong"] },
        disabled && styles.dim,
      ]}
    >
      <Icon name={icon} size={18} color={ds.c[colors.fg]} />
      <DsText v={height === 42 ? "body-sm" : "button"} w="600" c={colors.fg} numberOfLines={1}>
        {label}
      </DsText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.5 },
  body: { marginTop: -2, gap: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  chipsSpaced: { marginBottom: 8 },
  chip: { height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  pair: { flexDirection: "row", gap: 10 },
  actionsTop: { marginTop: 4 },
  actionsTeacher: { marginTop: 8, gap: 12 },
  action: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 22 },
});
