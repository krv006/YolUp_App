import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import type { LessonOutcome } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized } from "@/shared/lib";
import type { Lesson } from "@/shared/types";
import { DsText, dsRadius, Icon, useDs, type DsColor } from "@/shared/ui";
import { clock, hoursMinutes, lessonEnd } from "./home-format";

const TILE: Record<string, { bg: DsColor; fg: DsColor }> = {
  upcoming: { bg: "accent-teal-bg", fg: "accent-teal-fg" },
  live: { bg: "danger-bg", fg: "error-text" },
  attended: { bg: "accent-green-bg", fg: "accent-green-fg" },
  late: { bg: "accent-saffron-bg", fg: "accent-saffron-fg" },
  missed: { bg: "danger-bg", fg: "error-text" },
};

/**
 * So'nggi darslar — veb `home-recent.tsx`: sana katagi, kurs nomi, kirish /
 * chiqish vaqti va holat chipi (kutilmoqda, jonli, keldi, kechikdi, kelmadi).
 */
export function HomeRecent({ items, now }: { items: Array<{ lesson: Lesson; outcome: LessonOutcome }>; now: number }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <DsText v="title" style={styles.grow}>
          {t("home.recent.title")}
        </DsText>
        <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.navigate(ROUTES.parent.attendance as never)}>
          <DsText v="body-sm" w="500" c="brand">
            {t("home.recent.all")}
          </DsText>
        </Pressable>
      </View>
      <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
        {items.length ? (
          items.map(({ lesson, outcome }, index) => {
            const key = outcome.kind === "attended" ? (outcome.lateMinutes ? "late" : "attended") : outcome.kind;
            const tile = TILE[key] ?? TILE.upcoming;
            const date = new Date(lesson.startsAt);
            const from = clock(lesson.startsAt);
            const to = clock(lessonEnd(lesson));
            let meta: string;
            let chip: ReactNode;
            if (outcome.kind === "upcoming") {
              meta = t("home.recent.today", { from, to });
              chip = <Chip bg="accent-teal-bg" fg="accent-teal-fg" icon="schedule" label={from} />;
            } else if (outcome.kind === "live") {
              meta = outcome.row?.joinedAt
                ? t("home.recent.liveSince", {
                    time: clock(outcome.row.joinedAt),
                    minutes: Math.max(0, Math.floor((now - Date.parse(outcome.row.joinedAt)) / 60_000)),
                  })
                : t("home.recent.liveNotJoined");
              chip = <Chip bg="danger-bg" fg="error-text" dot label={t("home.recent.chipLive")} />;
            } else if (outcome.kind === "attended") {
              meta = t("home.recent.stay", {
                from: clock(outcome.row.joinedAt ?? lesson.startsAt),
                to: clock(outcome.row.leftAt ?? lessonEnd(lesson)),
                duration: hoursMinutes(outcome.row.minutes ?? 0, t, "home.recent"),
              });
              chip = outcome.lateMinutes ? (
                <Chip bg="warning-bg" fg="warning-fg" icon="schedule" label={t("home.recent.chipLate", { count: outcome.lateMinutes })} />
              ) : (
                <Chip bg="success-bg" fg="success-fg" icon="check-circle" label={t("home.recent.chipAttended")} />
              );
            } else {
              meta = t("home.recent.missed", { from, to });
              chip = <Chip bg="danger-bg" fg="error-text" label={t("home.recent.chipMissed")} />;
            }
            return (
              <View key={lesson.id} style={[styles.row, index < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
                <View style={[styles.tile, { backgroundColor: ds.c[tile.bg] }]}>
                  <DsText v="title" heading c={tile.fg} style={styles.tileDay}>
                    {date.getDate()}
                  </DsText>
                  <DsText v="micro" c={tile.fg} style={styles.tileMonth}>
                    {formatLocalized(date, "LLL").replace(".", "")}
                  </DsText>
                </View>
                <View style={styles.text}>
                  <DsText v="body" w="600" numberOfLines={1}>
                    {lesson.courseTitle}
                  </DsText>
                  <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                    {meta}
                  </DsText>
                </View>
                {chip}
              </View>
            );
          })
        ) : (
          <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
            {t("home.recent.empty")}
          </DsText>
        )}
      </View>
    </View>
  );
}

/** Holat chipi — `rounded-full px-2.5 py-1 text-caption-strong`, belgi yoki nuqta bilan. */
function Chip({ bg, fg, label, icon, dot = false }: { bg: DsColor; fg: DsColor; label: string; icon?: "schedule" | "check-circle"; dot?: boolean }) {
  const ds = useDs();
  return (
    <View style={[styles.chip, { backgroundColor: ds.c[bg] }]}>
      {icon ? <Icon name={icon} size={14} color={ds.c[fg]} /> : null}
      {dot ? <View style={[styles.dot, { backgroundColor: ds.c.danger }]} /> : null}
      <DsText v="caption-strong" c={fg} numberOfLines={1}>
        {label}
      </DsText>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  section: { gap: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  list: { overflow: "hidden", borderRadius: 20 },
  /* `flex items-center gap-4 px-4 py-3.5` */
  row: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, paddingVertical: 14 },
  /* `size-12 rounded-xl`, kun `font-heading text-title leading-5`, oy `text-[11px] leading-3 font-semibold` */
  tile: { width: 48, height: 48, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  tileDay: { lineHeight: 20 },
  tileMonth: { fontSize: 11, lineHeight: 12, letterSpacing: 0 },
  text: { flex: 1, minWidth: 0, gap: 2 },
  chip: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { paddingHorizontal: 16, paddingVertical: 32, textAlign: "center" },
});
