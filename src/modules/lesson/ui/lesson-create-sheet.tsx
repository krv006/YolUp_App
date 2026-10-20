import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Hourglass } from "lucide-react-native";
import { useCourses } from "@/modules/course";
import type { Lesson } from "@/shared/types";
import {
  DateField,
  Input,
  radius,
  SelectField,
  Sheet,
  Text,
  TimeField,
  toast,
  useTheme,
} from "@/shared/ui";
import { useCreateLesson, useCreateLessonSchedule, useUpdateLesson } from "../model/lesson.queries";

export interface LessonCreateSheetProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  lesson?: Lesson | null;
}

/** Veb `DurationPicker` ning standart variantlari. */
const DURATIONS = [30, 45, 60, 90] as const;

function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Dars qo'shish / tahrirlash — veb `modules/lesson/ui/lesson-create-dialog.tsx`
 * porti. Maydonlar, standart qiymatlar va saqlash mantiqi bir xil; vebdagi
 * `AppDialog` o'rniga `Sheet`.
 */
export function LessonCreateSheet({ open, onClose, date, lesson }: LessonCreateSheetProps) {
  const { t } = useTranslation("lesson");
  const { t: tc } = useTranslation("common");
  const { palette } = useTheme();
  const courses = useCourses();
  const create = useCreateLesson();
  const update = useUpdateLesson();
  const createSchedule = useCreateLessonSchedule();

  const [courseId, setCourseId] = useState("");
  const [day, setDay] = useState(() => toDateValue(date));
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(45);
  const [repeat, setRepeat] = useState<"once" | "weekly">("once");
  const [weeks, setWeeks] = useState(8);
  const [note, setNote] = useState("");

  // Oyna har ochilganda maydonlar qayta to'ldiriladi (vebdagi naqsh).
  const formKey = open ? `${lesson?.id ?? "new"}|${toDateValue(date)}` : "";
  const [syncedKey, setSyncedKey] = useState("");

  if (formKey && formKey !== syncedKey) {
    const start = lesson ? new Date(lesson.startsAt) : date;
    setSyncedKey(formKey);
    setCourseId(lesson?.courseId ?? "");
    setDay(toDateValue(start));
    setTime(
      lesson
        ? `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`
        : "10:00"
    );
    setDuration(lesson?.durationMinutes || 45);
    setNote(lesson?.topic ?? "");
    setRepeat("once");
  }
  if (!formKey && syncedKey) setSyncedKey("");

  const options = (courses.data ?? []).map((course) => ({
    value: course.id,
    label: course.title,
  }));
  const durationOptions = [...new Set<number>([...DURATIONS, duration])]
    .sort((a, b) => a - b)
    .map((value) => ({ value: String(value), label: String(value) }));
  const pending = create.isPending || update.isPending || createSchedule.isPending;

  async function save() {
    if (!courseId) {
      toast.error(t("schedule.selectGroup"));
      return;
    }
    try {
      if (lesson) {
        await update.mutateAsync({
          id: lesson.id,
          form: { courseId, topic: note, date: day, time, duration },
        });
      } else if (repeat === "weekly") {
        const start = new Date(`${day}T${time}`);
        const dates = Array.from({ length: weeks }, (_, index) => {
          const next = new Date(start);
          next.setDate(next.getDate() + index * 7);
          return toDateValue(next);
        });
        await createSchedule.mutateAsync({
          courseId,
          title: note || t("schedule.newLesson"),
          time,
          durationMinutes: duration,
          weekdays: [start.getDay()],
          startsOn: day,
          endsOn: dates[dates.length - 1],
          dates,
        });
      } else {
        await create.mutateAsync({ courseId, topic: note, date: day, time, duration });
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("schedule.cancel"));
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={lesson ? t("schedule.edit") : t("schedule.newLesson")}>
      <View style={styles.body}>
        <SelectField label={t("schedule.group")} value={courseId} onChange={setCourseId} options={options} />
        <DateField label={t("schedule.date")} value={day} onChange={setDay} />
        <TimeField label={t("schedule.time")} value={time} onChange={setTime} />
        <SelectField
          label={t("schedule.durationLabel")}
          value={String(duration)}
          onChange={(value) => setDuration(Number(value) || 45)}
          options={durationOptions}
          icon={<Hourglass size={17} color={palette["subtle-foreground"]} />}
          suffix={tc("formPickers.minuteUnit")}
        />
        {lesson ? null : (
          <SelectField
            label={t("schedule.repeat")}
            value={repeat}
            onChange={(value) => setRepeat(value as "once" | "weekly")}
            options={[
              { value: "once", label: t("schedule.repeatOnce") },
              { value: "weekly", label: t("schedule.repeatWeekly") },
            ]}
          />
        )}
        {repeat === "weekly" && !lesson ? (
          <Input
            label={t("schedule.weeksLabel")}
            keyboardType="number-pad"
            value={String(weeks)}
            onChangeText={(value) => setWeeks(Math.min(52, Math.max(1, Number(value) || 1)))}
          />
        ) : null}
        <Input
          label={t("schedule.note")}
          value={note}
          onChangeText={setNote}
          placeholder={t("schedule.notePlaceholder")}
          multiline
          numberOfLines={2}
        />

        {/* Veb `dialog-actions`: yuqorida chiziq, `px-5 py-4 gap-3`, tugmalar h-12. */}
        <View style={[styles.footer, { borderTopColor: palette.border }]}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.footerButton,
              {
                backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
                borderColor: palette.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text variant="label">{t("schedule.cancel")}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: pending }}
            disabled={pending}
            onPress={() => void save()}
            style={({ pressed }) => [
              styles.footerButton,
              {
                backgroundColor: pressed ? palette["primary-hover"] : palette.primary,
                opacity: pending ? 0.6 : 1,
              },
            ]}
          >
            <Text variant="label" style={{ color: palette["primary-foreground"] }}>
              {t("schedule.save")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  /* `flex flex-col gap-4` */
  body: { gap: 16 },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: radius.full,
  },
});
