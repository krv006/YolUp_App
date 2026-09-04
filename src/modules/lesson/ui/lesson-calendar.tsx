import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import type { Lesson } from "@/shared/types";
import { IconButton, radius, Text, useTheme } from "@/shared/ui";
import { buildMonthGrid, formatMonthTitle, WEEKDAY_LABELS } from "../lib/lesson-calendar";

export interface LessonCalendarProps {
  lessons: Lesson[];
  month: Date;
  onMonthChange: (month: Date) => void;
  selectedKey: string;
  onSelectDay: (key: string) => void;
}

/**
 * Oylik panjara. Veb versiyada har kun katakchasida darslar RO'YXATI
 * ko'rinardi — telefonda bunga joy yo'q, shuning uchun mobilda katakcha
 * faqat NUQTA ko'rsatadi va tanlangan kunning darslari panjara OSTIDA
 * to'liq kartochka bilan chiqadi.
 *
 * Panjara mantiqi (`buildMonthGrid`, `WEEKDAY_LABELS`) 🟢 veb'dan
 * ko'chirilgan — hafta dushanbadan boshlanishi ham shu yerdan keladi.
 */
export function LessonCalendar({
  lessons,
  month,
  onMonthChange,
  selectedKey,
  onSelectDay,
}: LessonCalendarProps) {
  const { palette } = useTheme();
  const days = useMemo(() => buildMonthGrid(month, lessons), [month, lessons]);

  return (
    <View style={[styles.wrapper, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.head}>
        <IconButton
          accessibilityLabel="Oldingi oy"
          onPress={() => onMonthChange(subMonths(month, 1))}
        >
          <ChevronLeft size={20} color={palette.foreground} />
        </IconButton>
        <Text variant="label" style={styles.monthTitle}>
          {formatMonthTitle(month)}
        </Text>
        <IconButton
          accessibilityLabel="Keyingi oy"
          onPress={() => onMonthChange(addMonths(month, 1))}
        >
          <ChevronRight size={20} color={palette.foreground} />
        </IconButton>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.cell}>
            <Text variant="caption" tone="muted">
              {label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const selected = day.key === selectedKey;
          const hasLessons = day.lessons.length > 0;
          const isLive = day.lessons.some((lesson) => lesson.status === "live");

          return (
            <Pressable
              key={day.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${day.dayOfMonth}-kun${
                hasLessons ? `, ${day.lessons.length} ta dars` : ", dars yo'q"
              }`}
              onPress={() => onSelectDay(day.key)}
              style={styles.cell}
            >
              <View
                style={[
                  styles.day,
                  selected && { backgroundColor: palette.primary },
                  !selected && day.isToday && { borderColor: palette.primary, borderWidth: 1.5 },
                ]}
              >
                <Text
                  variant="caption"
                  style={{
                    color: selected
                      ? palette["primary-foreground"]
                      : day.inCurrentMonth
                        ? palette.foreground
                        : palette["muted-foreground"],
                    fontWeight: day.isToday || selected ? "700" : "400",
                  }}
                >
                  {day.dayOfMonth}
                </Text>
              </View>

              {/* Nuqta — o'sha kunda dars borligi belgisi. Jonli dars qizil. */}
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: hasLessons
                      ? selected
                        ? palette["primary-foreground"]
                        : isLive
                          ? palette.destructive
                          : palette["primary-text"]
                      : "transparent",
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingBottom: 10,
  },
  head: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6 },
  monthTitle: { flex: 1, textAlign: "center", textTransform: "capitalize" },
  weekRow: { flexDirection: "row", paddingBottom: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  // 7 ustun: `100%/7` — foizni RN string sifatida qabul qiladi.
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 3 },
  day: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 3 },
});
