import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { parentHomework, type HomeworkFilter, type HomeworkState } from "@/modules/parent";
import { formatLocalized } from "@/shared/lib";
import type { Assignment } from "@/shared/types";
import { DsText, dsRadius, Icon, useDs, type DsColor } from "@/shared/ui";
import { STATE_CHIP, STATE_TILE } from "./homework-styles";

const FILTERS: HomeworkFilter[] = ["all", "waiting", "submitted"];

/** Vazifa holati chipi — veb `homework-list.tsx` `StateChip` (baholangan bo'lsa ball). */
export function StateChip({ assignment, state, now }: { assignment: Assignment; state: HomeworkState; now: number }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const chip = STATE_CHIP[state];
  if (state === "graded") {
    const submission = assignment.mySubmission;
    return (
      <View style={[styles.grade, { backgroundColor: ds.c[chip.bg] }]}>
        <DsText v="title-lg" heading c={chip.fg}>
          {submission?.gradeValue}
        </DsText>
        <DsText v="caption-strong" c={chip.fg}>
          /{assignment.maxScore}
        </DsText>
      </View>
    );
  }
  let label = t(`homeworkView.state.${state}`);
  if (state === "pending") {
    const left = assignment.dueAt ? parentHomework.countdown(assignment.dueAt, now) : null;
    label = !left ? t("homeworkView.noDue") : left.days ? t("homeworkView.daysLeft", { count: left.days }) : t("homeworkView.hoursLeft", { count: Math.max(1, left.hours) });
  }
  return (
    <View style={[styles.chip, { backgroundColor: ds.c[chip.bg] }]}>
      {chip.icon ? <Icon name={chip.icon} size={14} color={ds.c[chip.fg]} /> : null}
      <DsText v="caption-strong" c={chip.fg} numberOfLines={1}>
        {label}
      </DsText>
    </View>
  );
}

function rowMeta(assignment: Assignment, state: HomeworkState, t: (key: string, options?: Record<string, unknown>) => string): string {
  const pattern = t("homeworkView.shortPattern");
  const course = assignment.courseTitle;
  const submission = assignment.mySubmission;
  if (state === "graded" && submission)
    return `${course} · ${t("homeworkView.gradedOn", { date: formatLocalized(submission.checkedAt ?? submission.createdAt, pattern).toLowerCase() })}`;
  if (submission) return `${course} · ${t("homeworkView.submittedOn", { date: formatLocalized(submission.createdAt, pattern).toLowerCase() })}`;
  if (!assignment.dueAt) return `${course} · ${t("homeworkView.noDue")}`;
  if (state === "overdue") return `${course} · ${t("homeworkView.dueWas", { date: formatLocalized(assignment.dueAt, pattern).toLowerCase() })}`;
  return `${course} · ${formatLocalized(assignment.dueAt, `${pattern}, HH:mm`).toLowerCase()}`;
}

function Row({ assignment, now, last, onSelect }: { assignment: Assignment; now: number; last: boolean; onSelect: () => void }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const state = parentHomework.homeworkState(assignment, now);
  const tile = STATE_TILE[state];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onSelect}
      style={({ pressed }) => [styles.row, !last && { borderBottomWidth: 1, borderBottomColor: ds.c.line }, pressed && { backgroundColor: ds.c.subtle }]}
    >
      <View style={[styles.tile, { backgroundColor: ds.c[tile.bg] }]}>
        <Icon name={tile.icon} size={22} color={ds.c[tile.fg]} />
      </View>
      <View style={styles.text}>
        <DsText v="title-sm" numberOfLines={1}>
          {assignment.title}
        </DsText>
        <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
          {rowMeta(assignment, state, t)}
        </DsText>
      </View>
      <StateChip assignment={assignment} state={state} now={now} />
    </Pressable>
  );
}

/**
 * Vazifalar ro'yxati — veb `homework-list.tsx`: uchta ko'rsatkich (kutilmoqda,
 * tekshirilmoqda, o'rtacha), filtr tugmalari va "Kutilayotgan" /
 * "Topshirilgan" bo'limlari.
 */
export function HomeworkList({
  assignments,
  now,
  filter,
  onFilter,
  onSelect,
}: {
  assignments: Assignment[];
  now: number;
  filter: HomeworkFilter;
  onFilter: (filter: HomeworkFilter) => void;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const stats = parentHomework.homeworkStats(assignments, now);
  const { waiting, submitted } = parentHomework.splitHomework(assignments, filter, now);
  const sections = [
    { key: "waiting", items: waiting },
    { key: "submitted", items: submitted },
  ].filter((section) => section.items.length);
  const tiles: Array<{ key: string; value: string; bg: DsColor; fg: DsColor }> = [
    { key: "waiting", value: String(stats.waiting), bg: "accent-saffron-bg", fg: "accent-saffron-fg" },
    { key: "checking", value: String(stats.checking), bg: "accent-teal-bg", fg: "accent-teal-fg" },
    { key: "average", value: stats.average === null ? "—" : String(stats.average), bg: "accent-green-bg", fg: "accent-green-fg" },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.tiles}>
        {tiles.map((tile) => (
          <View key={tile.key} style={[styles.stat, { backgroundColor: ds.c[tile.bg] }]}>
            <DsText v="h2" heading w="600" c={tile.fg} style={styles.statValue}>
              {tile.value}
            </DsText>
            <DsText v="caption" c={tile.fg} numberOfLines={1}>
              {t(`homeworkView.stats.${tile.key}`)}
            </DsText>
          </View>
        ))}
      </View>
      <View style={styles.filters}>
        {FILTERS.map((item) => {
          const active = filter === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onFilter(item)}
              style={[styles.filter, active ? { borderColor: ds.c.brand, backgroundColor: ds.c.brand } : { borderColor: ds.c["line-strong"], backgroundColor: ds.c.surface }]}
            >
              <DsText v="button" c={active ? "on-action" : "ink"}>
                {t(`homeworkView.filters.${item}`)}
              </DsText>
            </Pressable>
          );
        })}
      </View>
      {sections.length ? (
        sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <DsText v="caption-strong" c="ink-tertiary" style={styles.sectionTitle}>
              {t(`homeworkView.sections.${section.key}`).toUpperCase()}
            </DsText>
            <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
              {section.items.map((assignment, index) => (
                <Row key={assignment.id} assignment={assignment} now={now} last={index === section.items.length - 1} onSelect={() => onSelect(assignment.id)} />
              ))}
            </View>
          </View>
        ))
      ) : (
        <DsText v="body-sm" c="ink-tertiary" style={[styles.empty, { backgroundColor: ds.c.surface }]}>
          {t("homeworkView.filteredEmpty")}
        </DsText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  tiles: { flexDirection: "row", gap: 12 },
  /* `flex flex-col rounded-2xl px-3.5 py-2.5` */
  stat: { flex: 1, minWidth: 0, paddingHorizontal: 14, paddingVertical: 10, borderRadius: dsRadius["2xl"] },
  /* `font-heading text-[22px]/7 font-semibold` */
  statValue: { fontSize: 22, lineHeight: 28 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: { height: 44, justifyContent: "center", paddingHorizontal: 20, borderWidth: 1, borderRadius: dsRadius.full },
  section: { gap: 8 },
  /* `px-1 text-caption-strong tracking-wide uppercase` */
  sectionTitle: { paddingHorizontal: 4, letterSpacing: 0.4 },
  list: { overflow: "hidden", borderRadius: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  tile: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0, gap: 2 },
  chip: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  grade: { flexShrink: 0, flexDirection: "row", alignItems: "baseline", gap: 2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.xl },
  empty: { paddingHorizontal: 20, paddingVertical: 40, textAlign: "center", borderRadius: 20, overflow: "hidden" },
});
