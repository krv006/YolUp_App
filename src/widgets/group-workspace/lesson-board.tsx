import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { Lesson, LessonStatus } from "@/shared/types";
import { DsText, dsRadius, Icon, MobileEmptyCard, toneColors, useDs, type IconName } from "@/shared/ui";

export interface LessonBoardProps {
  lessons: Lesson[];
  studentCount: number;
  joinedCount?: number | null;
  onAdd: () => void;
  onJoin: (lesson: Lesson) => void;
  onEdit: (lesson: Lesson) => void;
  onCancel: (lesson: Lesson) => void;
  onRecording: (lesson: Lesson) => void;
  onRatings: (lesson: Lesson) => void;
}

const BLOCK_TONE: Record<LessonStatus, string> = {
  live: "bg-error-text text-ink-inverse",
  scheduled: "bg-ink-tertiary text-ink-inverse",
  finished: "bg-line-strong text-ink-inverse",
  cancelled: "bg-line-strong text-ink-inverse",
};

const PILL_TONE: Record<LessonStatus, string> = {
  live: "bg-danger-bg text-danger",
  scheduled: "text-ink-tertiary",
  finished: "bg-subtle text-ink-secondary",
  cancelled: "bg-subtle text-ink-tertiary",
};

const PILL_ICON: Record<LessonStatus, IconName> = {
  live: "videocam-fill",
  scheduled: "schedule",
  finished: "check-circle",
  cancelled: "cancel",
};

function hhmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Guruh darslari — veb `widgets/group-workspace/lesson-board.tsx` ning tor
 * ekran varianti: kunlar bo'yicha (yangisi tepada), har darsda vaqt bloki,
 * holat yorlig'i va holatga qarab tugmalar (qo'shilish, yozuv va baholar,
 * tahrirlash va bekor qilish).
 */
export function LessonBoard({ lessons, studentCount, joinedCount, onAdd, onJoin, onEdit, onCancel, onRecording, onRatings }: LessonBoardProps) {
  const { t } = useTranslation(["group", "lesson"]);
  const ds = useDs();
  const months = t("lesson:list.months", { returnObjects: true }) as string[];

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = new Map<string, Lesson[]>();
    for (const lesson of lessons) {
      const date = new Date(lesson.startsAt);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(lesson);
      else buckets.set(key, [lesson]);
    }
    return [...buckets.values()]
      .map((items) => {
        const sorted = [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        const date = new Date(sorted[0]?.startsAt ?? "");
        date.setHours(0, 0, 0, 0);
        const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);
        const short = `${date.getDate()}-${months[date.getMonth()] ?? ""}`;
        return {
          key: date.toISOString(),
          time: date.getTime(),
          label:
            diff === 0
              ? t("group:lessons.today", { date: short })
              : diff === -1
                ? t("group:lessons.yesterday", { date: short })
                : short,
          items: sorted,
        };
      })
      .sort((a, b) => b.time - a.time);
  }, [lessons, months, t]);

  if (!days.length) {
    return (
      <MobileEmptyCard
        icon="schedule"
        title={t("group:lessons.emptyTitle")}
        description={t("group:lessons.emptyHint")}
        action={{ label: t("group:lessons.addLesson"), icon: "add", onPress: onAdd }}
      />
    );
  }

  return (
    <View style={styles.days}>
      {days.map((day) => (
        <View key={day.key} style={styles.day}>
          <View style={styles.dayHead}>
            <DsText v="overline" c="ink-tertiary" numberOfLines={1} style={styles.dayLabel}>
              {day.label}
            </DsText>
            <DsText v="caption" c="ink-tertiary">
              {t("group:lessons.countShort", { count: day.items.length })}
            </DsText>
          </View>

          <View style={styles.cards}>
            {day.items.map((lesson) => {
              const starts = new Date(lesson.startsAt);
              const minutes = lesson.durationMinutes || 45;
              const ends = new Date(starts.getTime() + minutes * 60_000);
              const status = lesson.status;
              const block = toneColors(BLOCK_TONE[status], ds);
              const pill = toneColors(PILL_TONE[status], ds);
              const padded = status !== "scheduled";

              return (
                <View key={lesson.id} style={[styles.card, { backgroundColor: ds.c.surface }]}>
                  <View style={styles.cardHead}>
                    <View style={[styles.block, { backgroundColor: block.bg }]}>
                      <DsText v="title" style={[styles.blockTime, { color: block.fg }]}>
                        {hhmm(starts)}
                      </DsText>
                      <DsText v="caption" style={{ color: block.fg, opacity: 0.9 }}>
                        {t("group:lessons.minutesShort", { count: minutes })}
                      </DsText>
                    </View>

                    <View style={styles.body}>
                      <View style={[styles.pill, padded && styles.pillPadded, { backgroundColor: pill.bg }]}>
                        <Icon name={PILL_ICON[status]} size={14} color={pill.fg ?? ds.c["ink-tertiary"]} />
                        <DsText v="caption-strong" style={{ color: pill.fg }}>
                          {t(`lesson:status.${status}`)}
                        </DsText>
                      </View>
                      <DsText v="title" numberOfLines={1}>
                        {lesson.title || t("group:lessons.noTopic")}
                      </DsText>
                      <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                        {status === "live" && typeof joinedCount === "number"
                          ? t("group:lessons.joined", { joined: joinedCount, total: studentCount })
                          : status === "finished"
                            ? lesson.participantsCount != null
                              ? t("group:lessons.finishedStatsShort", {
                                  joined: lesson.participantsCount,
                                  total: lesson.studentCount ?? studentCount,
                                  rate: lesson.attendanceRate ?? 0,
                                })
                              : t("group:lessons.finishedMeta", { count: studentCount })
                            : `${hhmm(starts)} – ${hhmm(ends)}`}
                      </DsText>
                    </View>
                  </View>

                  {status === "live" ? (
                    <BrandButton icon="videocam-fill" label={t("group:lessons.join")} onPress={() => onJoin(lesson)} />
                  ) : status === "finished" ? (
                    <View style={styles.pair}>
                      <OutlineButton icon="play-circle-fill" label={t("group:lessons.recording")} onPress={() => onRecording(lesson)} />
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => onRatings(lesson)}
                        style={({ pressed }) => [styles.button, styles.grow, { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }]}
                      >
                        <Icon name="star" size={18} color={ds.c["brand-strong"]} />
                        <DsText v="button" c="brand-strong" numberOfLines={1}>
                          {lesson.avgRating
                            ? t("group:lessons.ratingsWith", { value: lesson.avgRating.toFixed(1).replace(".", ",") })
                            : t("group:lessons.ratings")}
                        </DsText>
                      </Pressable>
                    </View>
                  ) : status === "cancelled" ? null : (
                    <View style={styles.actions}>
                      <BrandButton icon="videocam-fill" label={t("group:lessons.join")} onPress={() => onJoin(lesson)} />
                      <View style={styles.pair}>
                        <OutlineButton icon="edit" label={t("group:lessons.edit")} onPress={() => onEdit(lesson)} />
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => onCancel(lesson)}
                          style={({ pressed }) => [styles.button, styles.grow, pressed && { backgroundColor: ds.c["danger-bg"] }]}
                        >
                          <Icon name="close" size={18} color={ds.c["error-text"]} />
                          <DsText v="button" c="error-text" numberOfLines={1}>
                            {t("group:lessons.cancelLessonLong")}
                          </DsText>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function BrandButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, { gap: 8, backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
    >
      <Icon name={icon} size={18} color={ds.c["ink-inverse"]} />
      <DsText v="button" c="ink-inverse">
        {label}
      </DsText>
    </Pressable>
  );
}

/** `h-11 rounded-full border border-line bg-surface text-button` */
function OutlineButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles.grow, { borderWidth: 1, borderColor: ds.c.line, backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
    >
      <Icon name={icon} size={18} color={ds.c.ink} />
      <DsText v="button" numberOfLines={1}>
        {label}
      </DsText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  /* `gap-3.5` */
  days: { gap: 14 },
  day: { gap: 12 },
  dayHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  dayLabel: { flex: 1, minWidth: 0, textTransform: "uppercase" },
  cards: { gap: 12 },
  /* `gap-4 rounded-xl bg-surface p-4` */
  card: { gap: 16, padding: 16, borderRadius: dsRadius.xl },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  /* `size-14 rounded-lg gap-0.5` */
  block: { width: 56, height: 56, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: dsRadius.lg },
  blockTime: { lineHeight: 20 },
  body: { flex: 1, minWidth: 0, gap: 4 },
  pill: { alignSelf: "flex-start", height: 24, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 12 },
  pillPadded: { paddingHorizontal: 10 },
  actions: { gap: 8 },
  pair: { flexDirection: "row", gap: 8 },
  button: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 22 },
});
