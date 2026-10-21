import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useCourses } from "@/modules/course";
import type { Lesson } from "@/shared/types";
import { ConfirmSheet, Icon, radius, Sheet, Text, toast, useTheme, type IconName } from "@/shared/ui";
import { useCancelLesson } from "../model/lesson.queries";
import { endTime } from "./schedule-grid";

export interface LessonDetailSheetProps {
  lesson: Lesson | null;
  onClose: () => void;
  canManage: boolean;
  onAttendance: (lesson: Lesson) => void;
  onHomework: (lesson: Lesson) => void;
  onEdit: (lesson: Lesson) => void;
  onRate?: (lesson: Lesson) => void;
}

/**
 * Dars tafsilotlari — veb `modules/lesson/ui/lesson-detail-dialog.tsx` porti.
 * Vebdagi `AppDialog` o'rniga pastdan chiquvchi `Sheet`; tarkib va
 * tugmalar tartibi bir xil.
 */
export function LessonDetailSheet({
  lesson,
  onClose,
  canManage,
  onAttendance,
  onHomework,
  onEdit,
  onRate,
}: LessonDetailSheetProps) {
  const { t } = useTranslation("lesson");
  const { palette } = useTheme();
  const months = t("list.months", { returnObjects: true }) as string[];
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scope, setScope] = useState<"one" | "series">("one");
  const cancelLesson = useCancelLesson();
  const courses = useCourses();

  if (!lesson) return null;

  const start = new Date(lesson.startsAt);
  const weekdayIndex = (start.getDay() + 6) % 7;
  const course = (courses.data ?? []).find((item) => item.id === lesson.courseId);

  return (
    <>
      <Sheet
        open={!confirmOpen}
        onClose={onClose}
        title={lesson.courseTitle}
        description={t("schedule.detailTitle")}
      >
        <View style={styles.body}>
          <DetailRow icon="nav-calendar">
            {`${weekdaysLong?.[weekdayIndex] ?? ""}, ${start.getDate()}-${(
              months[start.getMonth()] ?? ""
            ).toLowerCase()}`}
          </DetailRow>
          <DetailRow icon="clock">{`${lesson.time} – ${endTime(lesson)}`}</DetailRow>
          <DetailRow icon="groups">
            {lesson.courseTitle +
              (course?.studentCount
                ? ` · ${t("schedule.memberCount", { count: course.studentCount })}`
                : "")}
          </DetailRow>
          {lesson.topic ? <DetailRow icon="assign">{lesson.topic}</DetailRow> : null}

          <View style={styles.actions}>
            <DetailAction
              primary
              icon="check-circle"
              label={t("schedule.attendance")}
              onPress={() => onAttendance(lesson)}
            />
            <DetailAction icon="assign" label={t("schedule.homework")} onPress={() => onHomework(lesson)} />
            {canManage ? (
              <DetailAction icon="edit" label={t("schedule.edit")} onPress={() => onEdit(lesson)} />
            ) : null}
            {!canManage && onRate && lesson.status === "finished" ? (
              <DetailAction icon="check-circle" label={t("rateDialog.title")} onPress={() => onRate(lesson)} />
            ) : null}
          </View>

          {canManage ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmOpen(true)}
              style={({ pressed }) => [
                styles.cancel,
                pressed && { backgroundColor: palette["destructive-soft"] },
              ]}
            >
              <Icon name="trash" size={18} color={palette["destructive-strong"]} />
              <Text variant="label" style={{ color: palette["destructive-strong"] }}>
                {t("schedule.cancelLesson")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Sheet>

      <ConfirmSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("schedule.cancelTitle")}
        description={t("schedule.cancelDescription")}
        cancelLabel={t("schedule.keep")}
        confirmLabel={t("schedule.cancelConfirm")}
        loading={cancelLesson.isPending}
        onConfirm={() =>
          cancelLesson.mutate(
            { id: lesson.id, scope },
            {
              onSuccess: (count) => {
                toast.success(t("schedule.cancelled", { count }));
                setConfirmOpen(false);
                onClose();
              },
            }
          )
        }
      >
        {/* Takrorlanuvchi dars: faqat shu darsmi yoki butun seriya. */}
        {lesson.recurrenceId ? (
          <View accessibilityRole="radiogroup" style={styles.scopes}>
            {(["one", "series"] as const).map((item) => {
              const active = scope === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => setScope(item)}
                  style={[
                    styles.scope,
                    {
                      borderColor: active ? palette.primary : palette.border,
                      backgroundColor: active ? palette["primary-soft"] : palette.surface,
                    },
                  ]}
                >
                  <View style={[styles.radio, { borderColor: active ? palette.primary : palette.border }]}>
                    {active ? <View style={[styles.radioDot, { backgroundColor: palette.primary }]} /> : null}
                  </View>
                  <Text variant="label">{t(`schedule.cancelScope.${item}`)}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </ConfirmSheet>
    </>
  );
}

function DetailRow({ icon, children }: { icon: IconName; children: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.row}>
      <Icon name={icon} size={18} color={palette["muted-foreground"]} />
      <Text variant="label" style={[styles.bodySm, styles.grow]}>
        {children}
      </Text>
    </View>
  );
}

function DetailAction({
  icon,
  label,
  onPress,
  primary = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const { palette } = useTheme();
  const fg = primary ? palette["primary-foreground"] : palette.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        primary
          ? { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }
          : {
              backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
              borderColor: palette.border,
              borderWidth: 1,
            },
      ]}
    >
      <Icon name={icon} size={18} color={fg} />
      <Text variant="label" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /* `flex-col gap-3` */
  body: { gap: 12 },
  /* `flex flex-col gap-2`; variant — `rounded-xl border px-3.5 py-3 gap-3` */
  scopes: { gap: 8, marginBottom: 16 },
  scope: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: radius.xl },
  /* `size-5 border-2 rounded-full`, ichida `size-2.5` */
  radio: { width: 20, height: 20, borderWidth: 2, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: radius.full },
  grow: { flex: 1 },
  bodySm: { fontWeight: "400" },
  /* `flex items-center gap-2.5 text-body-sm` */
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  /* `mt-2 flex flex-wrap gap-2` */
  actions: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  /* `h-12 rounded-full px-4 gap-2` */
  action: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: radius.full,
  },
  /* `mt-1 h-11 rounded-full` — matnli xavfli tugma */
  cancel: {
    marginTop: 4,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.full,
  },
});
