import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { Lesson } from "@/shared/types";
import {
  DsText,
  dsAlpha,
  dsRadius,
  Icon,
  MobileInput,
  MobilePickerField,
  useDs,
} from "@/shared/ui";
import {
  findBulkOverlaps,
  isBulkRowInPast,
  MAX_BULK_LESSONS,
  nextBulkRow,
  type BulkLessonRow,
} from "../lib/bulk-lessons";
import { addMinutesToTime, findScheduleConflicts } from "../lib/lesson-schedule";

const DURATIONS = [45, 60, 90, 120] as const;

export interface BulkLessonRowsProps {
  rows: BulkLessonRow[];
  onChange: (rows: BulkLessonRow[]) => void;
  /** Server rad etgan qatorlar — `bulkRowErrors` natijasi (qator `id` -> xabar). */
  errors?: Readonly<Record<string, string>>;
  /** Berilsa — har qator mavjud darslar bilan to'qnashuvga tekshiriladi. */
  existingLessons?: readonly Lesson[];
}

function todayValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * "Bir nechta dars" qatorlari — veb `modules/lesson/ui/bulk-lesson-rows.tsx`
 * ning `compact` (tor ekran) varianti: har qatorda mavzu, sana va vaqt
 * (soat oynasida davomiylik ham), qatorni olib tashlash va "Yana dars
 * qo'shish" (50 tagacha). O'tib ketgan vaqt yoki server xatosi — qizil,
 * ro'yxat ichidagi yoki mavjud dars bilan to'qnashuv — sariq ogohlantirish.
 */
export function BulkLessonRows({
  rows,
  onChange,
  errors = {},
  existingLessons = [],
}: BulkLessonRowsProps) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const overlapping = useMemo(() => findBulkOverlaps(rows), [rows]);
  const today = todayValue();
  const full = rows.length >= MAX_BULK_LESSONS;

  function update(id: string, patch: Partial<BulkLessonRow>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function issueOf(row: BulkLessonRow): { text: string; danger: boolean } | null {
    const serverError = errors[row.id];
    if (serverError) return { text: serverError, danger: true };
    if (isBulkRowInPast(row)) return { text: t("bulk.past"), danger: true };
    if (overlapping.has(row.id)) return { text: t("bulk.overlap"), danger: false };
    const busy = findScheduleConflicts(existingLessons, {
      date: row.date,
      time: row.time,
      durationMinutes: row.duration,
    })[0];
    return busy ? { text: t("bulk.busy", { title: busy.title }), danger: false } : null;
  }

  function dateLabel(value: string) {
    const date = new Date(`${value}T00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return `${weekdays[(date.getDay() + 6) % 7] ?? ""}, ${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.list}>
        {rows.map((row, index) => {
          const issue = issueOf(row);
          const number = index + 1;
          return (
            // `rounded-xl bg-subtle p-3 gap-2.5`, xatoda `ring-1 ring-danger/40`
            <View
              key={row.id}
              style={[
                styles.row,
                {
                  backgroundColor: ds.c.subtle,
                  borderColor: issue?.danger ? dsAlpha(ds.c.danger, 0.4) : "transparent",
                },
              ]}
            >
              <View style={styles.head}>
                <View style={[styles.number, { backgroundColor: ds.c.surface }]}>
                  <DsText v="caption-strong" c="brand">
                    {number}
                  </DsText>
                </View>
                <MobileInput
                  surface
                  value={row.topic}
                  placeholder={t("bulk.topicPlaceholder")}
                  accessibilityLabel={t("bulk.topicAria", { number })}
                  onChangeText={(value) => update(row.id, { topic: value })}
                  style={styles.topic}
                />
                {rows.length > 1 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("bulk.remove", { number })}
                    onPress={() => onChange(rows.filter((item) => item.id !== row.id))}
                    style={({ pressed }) => [
                      styles.remove,
                      pressed && { backgroundColor: ds.c["danger-bg"] },
                    ]}
                  >
                    {({ pressed }) => (
                      <Icon
                        name="trash"
                        size={18}
                        color={pressed ? ds.c.danger : ds.c["ink-secondary"]}
                      />
                    )}
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.pair}>
                <View style={styles.grow}>
                  <MobilePickerField
                    type="date"
                    surface
                    value={row.date}
                    min={today}
                    display={dateLabel(row.date)}
                    ariaLabel={t("bulk.dateAria", { number })}
                    onChange={(value) => update(row.id, { date: value })}
                  />
                </View>
                <View style={styles.grow}>
                  <MobilePickerField
                    type="time"
                    surface
                    value={row.time}
                    display={`${row.time}–${addMinutesToTime(row.time, row.duration)}`}
                    ariaLabel={t("bulk.timeAria", { number })}
                    duration={{
                      value: row.duration,
                      options: DURATIONS,
                      onChange: (value) => update(row.id, { duration: value }),
                    }}
                    onChange={(value) => update(row.id, { time: value })}
                  />
                </View>
              </View>

              {issue ? (
                <View style={styles.issue}>
                  <Icon
                    name="warning"
                    size={14}
                    color={issue.danger ? ds.c.danger : ds.c["warning-fg"]}
                  />
                  <DsText
                    v="body-xs"
                    c={issue.danger ? "danger" : "warning-fg"}
                    style={styles.grow}
                  >
                    {issue.text}
                  </DsText>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* `h-12 rounded-xl border border-dashed border-line-strong text-brand` */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: full }}
        disabled={full}
        onPress={() => {
          const last = rows[rows.length - 1];
          if (last) onChange([...rows, nextBulkRow(last)]);
        }}
        style={({ pressed }) => [
          styles.add,
          { borderColor: ds.c["line-strong"] },
          pressed && { backgroundColor: ds.c["brand-subtle"] },
          full && styles.dim,
        ]}
      >
        <Icon name="add" size={18} color={ds.c.brand} />
        <DsText v="button" c="brand">
          {t("bulk.addRow")}
        </DsText>
      </Pressable>
      <DsText v="caption" c="ink-tertiary" style={styles.center}>
        {t("bulk.limit", { count: rows.length, max: MAX_BULK_LESSONS })}
      </DsText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  list: { gap: 12 },
  row: { gap: 10, padding: 12, borderWidth: 1, borderRadius: dsRadius.xl },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  number: {
    width: 28,
    height: 28,
    flexShrink: 0,
    borderRadius: dsRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  /* `h-12 px-3.5` */
  topic: { flex: 1, minWidth: 0, height: 48, paddingHorizontal: 14 },
  remove: {
    width: 36,
    height: 36,
    flexShrink: 0,
    borderRadius: dsRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pair: { flexDirection: "row", gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  issue: { flexDirection: "row", alignItems: "center", gap: 6 },
  add: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: dsRadius.xl,
  },
  dim: { opacity: 0.5 },
  center: { textAlign: "center" },
});
