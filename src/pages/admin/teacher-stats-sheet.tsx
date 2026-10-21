import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTeacherRatings, useTeacherStats } from "@/modules/auth";
import type { AuthUser } from "@/shared/types";
import { Button, GradientFill, Sheet, Text, useLegacyColors, useTheme } from "@/shared/ui";

const STAR_LEVELS = ["5", "4", "3", "2", "1"];
/** Veb `--primary-bright` — palitrada yo'q, chiziq gradientining oxiri. */
const PRIMARY_BRIGHT = "#7c3aff";

export interface TeacherStatsSheetProps {
  teacher: AuthUser | null;
  onClose: () => void;
}

/**
 * O'qituvchi statistikasi — veb `teacher-stats-dialog.tsx`: sakkizta
 * ko'rsatkich, yulduzlar bo'yicha taqsimot va so'nggi beshta izoh.
 */
export function TeacherStatsSheet({ teacher, onClose }: TeacherStatsSheetProps) {
  const { t } = useTranslation("admin");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const open = Boolean(teacher);
  const stats = useTeacherStats(teacher?.id ?? null, open);
  const ratings = useTeacherRatings(teacher?.id ?? null, open);
  const data = stats.data;
  const maxCount = data ? Math.max(1, ...STAR_LEVELS.map((level) => Number(data.ratingBreakdown[level] ?? 0))) : 1;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("stats.title", { name: teacher?.name ?? "" })}
      description={t("stats.description")}
    >
      {stats.isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color={palette.primary} />
          <Text variant="label" style={{ color: colors.muted }}>
            {t("stats.loading")}
          </Text>
        </View>
      ) : null}

      {stats.isError ? (
        <View style={styles.state}>
          <Text variant="label">{t("stats.loadError")}</Text>
          <Button title={t("stats.retry")} variant="secondary" fullWidth={false} onPress={() => void stats.refetch()} />
        </View>
      ) : null}

      {data ? (
        <>
          {/* `.teacher-stats-grid` — ikki ustun, orasi 10 */}
          <View style={styles.grid}>
            <Stat value={data.avgRating === null ? "—" : data.avgRating.toFixed(1)} label={t("stats.avgRating")} />
            <Stat value={data.ratingCount} label={t("stats.ratingCount")} />
            <Stat value={data.courseCount} label={t("stats.courseCount")} />
            <Stat value={data.studentCount} label={t("stats.studentCount")} />
            <Stat value={data.lessonsFinished} label={t("stats.lessonsFinished")} />
            <Stat value={data.lessonsScheduled} label={t("stats.lessonsScheduled")} />
            <Stat value={data.lessonsCancelled} label={t("stats.lessonsCancelled")} />
            <Stat value={data.reliability === null ? "—" : `${data.reliability.toFixed(1)}%`} label={t("stats.reliability")} />
          </View>

          {/* `.teacher-stats-breakdown` */}
          <View style={styles.breakdown}>
            <Text variant="caption" style={[styles.sectionTitle, { color: colors.muted }]}>
              {t("stats.breakdown")}
            </Text>
            {STAR_LEVELS.map((level) => {
              const count = Number(data.ratingBreakdown[level] ?? 0);
              return (
                <View key={level} style={styles.bar}>
                  <Text variant="caption" style={[styles.barLevel, { color: colors.muted }]}>
                    {level}★
                  </Text>
                  <View style={[styles.track, { backgroundColor: palette["primary-tint-strong"] }]}>
                    <View style={[styles.fill, { width: `${(count / maxCount) * 100}%` }]}>
                      <GradientFill colors={[palette.primary, PRIMARY_BRIGHT]} direction="horizontal" />
                    </View>
                  </View>
                  <Text variant="caption" style={[styles.barCount, { color: colors.muted }]}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      {ratings.data?.items.length ? (
        <View style={styles.comments}>
          <Text variant="caption" style={[styles.sectionTitle, { color: colors.muted }]}>
            {t("stats.comments")}
          </Text>
          {ratings.data.items.slice(0, 5).map((item) => (
            <View key={item.id} style={[styles.comment, { borderColor: colors.border }]}>
              <View style={styles.commentHead}>
                <Text variant="label" style={styles.grow}>
                  {item.studentName}
                </Text>
                <Text variant="caption" style={[styles.commentStars, { color: palette.warning }]}>
                  {item.stars}★
                </Text>
              </View>
              {item.description ? (
                <Text variant="label" style={[styles.commentText, { color: colors.muted }]}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Sheet>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  return (
    <View style={[styles.stat, { borderColor: colors.border, backgroundColor: palette.surface }]}>
      <Text variant="body" style={styles.statValue}>
        {value}
      </Text>
      <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  state: { alignItems: "center", gap: 12, paddingVertical: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  /* `article` — 12 bo'shliq, radius 12 */
  stat: { flexGrow: 1, flexBasis: "40%", gap: 3, padding: 12, borderWidth: 1, borderRadius: 12 },
  statValue: { fontSize: 19, lineHeight: 21, fontWeight: "700" },
  small: { fontSize: 11, lineHeight: 16.5 },
  breakdown: { marginTop: 18, gap: 6 },
  sectionTitle: { marginBottom: 4, fontSize: 11, lineHeight: 16.5, fontWeight: "700", letterSpacing: 1.1, textTransform: "uppercase" },
  /* `.teacher-stats-bar` — 28 | 1fr | 32 */
  bar: { flexDirection: "row", alignItems: "center", gap: 10 },
  barLevel: { width: 28, fontSize: 11, fontWeight: "700" },
  track: { flex: 1, height: 8, overflow: "hidden", borderRadius: 999 },
  fill: { height: "100%", overflow: "hidden", borderRadius: 999 },
  barCount: { width: 32, fontSize: 11 },
  comments: { marginTop: 18, gap: 8 },
  comment: { gap: 4, paddingVertical: 10, borderTopWidth: 1 },
  commentHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentStars: { fontWeight: "700" },
  commentText: { fontWeight: "400" },
});
