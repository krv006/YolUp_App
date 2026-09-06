import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { TriangleAlert } from "lucide-react-native";
import {
  buildScheduleDates,
  findScheduleConflicts,
  findScheduleConflictsForDates,
  ODD_WEEKDAYS,
  useCreateLesson,
  useCreateLessonSchedule,
  useUpdateLesson,
  WEEKDAYS,
} from "@/modules/lesson";
import type { Lesson } from "@/shared/types";
import {
  Button,
  Checkbox,
  Chip,
  DateField,
  Input,
  radius,
  Sheet,
  Text,
  TimeField,
  toast,
  useTheme,
} from "@/shared/ui";

export interface AddLessonSheetProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  /** Mavjud darslar — vaqt to'qnashuvini tekshirish uchun. */
  existingLessons: Lesson[];
  /**
   * Berilsa — oyna TAHRIR rejimida ochiladi: maydonlar to'ldirilgan,
   * takrorlash bo'limi yashiringan (mavjud darsni jadvalga aylantirish
   * ma'nosiz) va saqlash `update` ga ketadi. Veb ham xuddi shu dialogni
   * `initialValues` bilan qayta ishlatadi.
   */
  editing?: Lesson | null;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthLaterString(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

/**
 * Dars yaratish — veb `AddLessonDialog` ning mobil varianti.
 *
 * Ikki rejim: bitta dars yoki HAFTALIK JADVAL (masalan har dushanba,
 * chorshanba, juma — bir oy davomida). Jadval mantiqi (`buildScheduleDates`,
 * to'qnashuv tekshiruvi) 🟢 veb'dan ko'chirilgan, shuning uchun ikkala
 * platformada aynan bir xil sanalar hosil bo'ladi.
 *
 * To'qnashuv OGOHLANTIRISH, taqiq emas — veb'dagi kabi: o'qituvchi ataylab
 * ustma-ust dars qo'yishi mumkin (masalan guruh bo'linadi).
 */
export function AddLessonSheet({
  open,
  onClose,
  courseId,
  existingLessons,
  editing = null,
}: AddLessonSheetProps) {
  const { palette } = useTheme();
  const create = useCreateLesson();
  const update = useUpdateLesson();
  const createSchedule = useCreateLessonSchedule();

  // Tahrir rejimida boshlang'ich qiymatlar darsdan olinadi. Chaqiruvchi
  // oynani `key={editing?.id ?? "new"}` bilan qayta yaratadi, shuning uchun
  // effekt kerak emas — state bir marta shu yerdan boshlanadi.
  const [topic, setTopic] = useState(editing?.title ?? editing?.topic ?? "");
  const [date, setDate] = useState(editing?.date ?? "");
  const [time, setTime] = useState(editing?.time ?? "18:30");
  const [duration, setDuration] = useState(String(editing?.durationMinutes ?? 45));
  const [repeat, setRepeat] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([...ODD_WEEKDAYS]);
  const [from, setFrom] = useState(todayString);
  const [to, setTo] = useState(monthLaterString);

  const durationMinutes = Number(duration) || 45;

  const dates = useMemo(
    () => (repeat ? buildScheduleDates({ startsOn: from, endsOn: to, weekdays }) : []),
    [repeat, from, to, weekdays]
  );

  const singleConflicts = useMemo(() => {
    if (repeat || !date) return [];
    return findScheduleConflicts(existingLessons, {
      date,
      time,
      durationMinutes,
      // Tahrirlanayotgan dars o'zi bilan to'qnashmasin.
      excludeLessonId: editing?.id ?? null,
    });
  }, [repeat, existingLessons, date, time, durationMinutes, editing]);

  const scheduleConflicts = useMemo(
    () =>
      repeat ? findScheduleConflictsForDates(existingLessons, dates, time, durationMinutes) : [],
    [repeat, existingLessons, dates, time, durationMinutes]
  );

  function reset() {
    setTopic(editing?.title ?? editing?.topic ?? "");
    setDate(editing?.date ?? "");
    setTime(editing?.time ?? "18:30");
    setDuration(String(editing?.durationMinutes ?? 45));
    setRepeat(false);
    setWeekdays([...ODD_WEEKDAYS]);
    setFrom(todayString());
    setTo(monthLaterString());
  }

  function close() {
    reset();
    onClose();
  }

  function toggleWeekday(value: number) {
    setWeekdays((current) =>
      current.includes(value)
        ? current.filter((day) => day !== value)
        : [...current, value].sort((a, b) => a - b)
    );
  }

  async function submit() {
    if (!topic.trim() || !time) return;
    try {
      if (editing) {
        if (!date) {
          toast.error("Sanani tanlang");
          return;
        }
        await update.mutateAsync({
          id: editing.id,
          form: { topic: topic.trim(), date, time, duration: durationMinutes },
        });
        close();
        return;
      }

      if (repeat) {
        if (dates.length === 0) {
          toast.error("Tanlangan oraliqda birorta ham kun topilmadi");
          return;
        }
        await createSchedule.mutateAsync({
          courseId,
          title: topic.trim(),
          time,
          durationMinutes,
          weekdays,
          startsOn: from,
          endsOn: to,
          // Server endpointi 404 bersa, zaxira usul shu sanalardan foydalanadi.
          dates,
        });
      } else {
        if (!date) {
          toast.error("Sanani tanlang");
          return;
        }
        await create.mutateAsync({
          courseId,
          topic: topic.trim(),
          date,
          time,
          duration: durationMinutes,
        });
      }
      close();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editing
            ? "Darsni saqlab bo'lmadi"
            : "Darsni yaratib bo'lmadi"
      );
    }
  }

  const conflicts = repeat ? scheduleConflicts : singleConflicts;
  const pending = create.isPending || createSchedule.isPending || update.isPending;

  return (
    <Sheet
      open={open}
      onClose={close}
      title={editing ? "Darsni tahrirlash" : "Yangi dars"}
      description={
        editing
          ? "Mavzu, sana va vaqtni o'zgartirish mumkin."
          : "Bitta dars yoki takrorlanuvchi haftalik jadval."
      }
    >
      <Input
        label="Mavzu"
        placeholder="Masalan: Kvadrat tenglamalar"
        value={topic}
        onChangeText={setTopic}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <TimeField label="Vaqt" value={time} onChange={setTime} />
        </View>
        <View style={styles.half}>
          <Input
            label="Davomiyligi (daq)"
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
          />
        </View>
      </View>

      {/* Mavjud darsni haftalik jadvalga aylantirib bo'lmaydi. */}
      {editing ? null : (
        <Checkbox checked={repeat} onChange={setRepeat} label="Har hafta takrorlansin" />
      )}

      {repeat ? (
        <>
          <Text variant="label">Hafta kunlari</Text>
          <View style={styles.weekdays}>
            {WEEKDAYS.map((day) => (
              <Chip
                key={day.value}
                label={day.short}
                selected={weekdays.includes(day.value)}
                onPress={() => toggleWeekday(day.value)}
              />
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <DateField label="Boshlanish" value={from} onChange={setFrom} />
            </View>
            <View style={styles.half}>
              <DateField label="Tugash" value={to} onChange={setTo} />
            </View>
          </View>

          <Text variant="caption" tone="muted">
            {dates.length} ta dars yaratiladi.
          </Text>
        </>
      ) : (
        <DateField label="Sana" value={date} onChange={setDate} />
      )}

      {conflicts.length > 0 ? (
        <View style={[styles.warning, { backgroundColor: palette["warning-soft"] }]}>
          <TriangleAlert size={16} color={palette["warning-strong"]} />
          <Text variant="caption" style={{ flex: 1, color: palette["warning-strong"] }}>
            {conflicts.length} ta dars shu vaqtga to'g'ri keladi. Baribir yaratish mumkin.
          </Text>
        </View>
      ) : null}

      <Button
        title={editing ? "Saqlash" : repeat ? `${dates.length} ta dars yaratish` : "Dars yaratish"}
        size="lg"
        loading={pending}
        disabled={!topic.trim() || (repeat ? dates.length === 0 : !date)}
        onPress={() => void submit()}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  weekdays: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  warning: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radius.sm },
});
