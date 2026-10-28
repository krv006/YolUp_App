import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useMyAnalytics } from "@/modules/analytics";
import { useAuth, useMyRatings } from "@/modules/auth";
import { formatDayTime } from "@/shared/lib";
import { Avatar, DsText, dsRadius, Icon, MobileEmptyCard, MobileListSkeleton, useDs } from "@/shared/ui";
import { ProfileSubPage } from "./profile-shell";

function Stars({ value, size }: { value: number; size: number }) {
  const ds = useDs();
  const filled = Math.round(value);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon key={star} name="star" size={size} color={star <= filled ? ds.c["accent-saffron-fg"] : ds.c["line-strong"]} />
      ))}
    </View>
  );
}

function relativeDay(value: string, labels: { today: string; yesterday: string }): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (date >= start) return labels.today;
  if (date.getTime() >= start.getTime() - 86_400_000) return labels.yesterday;
  return formatDayTime(value);
}

/**
 * Baholarim (o'qituvchi) — veb `my-ratings-page.tsx` dagi `TeacherRatings`
 * (tor ekran): o'rtacha baho, yulduzlar va baholar soni, yulduzlar bo'yicha
 * taqsimot; so'nggi izohlar. O'quvchining baholari (`student-ratings.tsx`)
 * 6-bosqichda.
 */
export function MyRatingsPage() {
  const { t } = useTranslation("account");
  const ds = useDs();
  const { user } = useAuth();
  const ratings = useMyRatings(true);
  const analytics = useMyAnalytics();
  const rows = ratings.data?.items ?? [];

  const breakdown = analytics.data?.kind === "teacher" ? analytics.data.overall.ratingBreakdown : {};
  const bars = [5, 4, 3, 2, 1]
    .map((stars) => ({ stars, count: Number(breakdown[String(stars)] ?? 0) || rows.filter((row) => Math.round(row.stars) === stars).length }))
    .filter((bar) => bar.count > 0);
  const total = user?.ratingCount ?? rows.length;
  const top = Math.max(1, ...bars.map((bar) => bar.count));
  const empty = !ratings.isLoading && !rows.length && !total;

  return (
    <ProfileSubPage title={t("page.ratingsTitle")}>
      {empty ? (
        <MobileEmptyCard icon="star" title={t("page.mobile.noRatingsTitle")} description={t("page.mobile.noRatingsHint")} />
      ) : (
        <>
          <View style={[styles.summary, { backgroundColor: ds.c.surface }]}>
            <View style={styles.summaryHead}>
              <DsText heading w="600" style={styles.average}>
                {user?.avgRating == null ? "—" : user.avgRating.toFixed(1).replace(".", ",")}
              </DsText>
              <View style={styles.summaryMeta}>
                <Stars value={user?.avgRating ?? 0} size={22} />
                <DsText v="caption" w="400" c="ink-secondary">
                  {t("page.ratingsCount", { count: total })}
                </DsText>
              </View>
            </View>
            <View style={styles.bars}>
              {bars.map((bar) => (
                <View key={bar.stars} style={styles.barRow}>
                  <DsText v="caption-strong" style={styles.barLabel}>
                    {bar.stars}
                  </DsText>
                  <View style={[styles.barTrack, { backgroundColor: ds.c.subtle }]}>
                    <View style={[styles.barFill, { width: `${(bar.count / Math.max(total, top)) * 100}%`, backgroundColor: ds.c["accent-saffron-fg"] }]} />
                  </View>
                  <DsText v="caption" w="400" c="ink-secondary" style={styles.barCount}>
                    {bar.count}
                  </DsText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.comments}>
            <DsText v="title" w="400" style={styles.commentsLabel}>
              {t("page.recentCommentsTitle")}
            </DsText>
            {ratings.isLoading ? (
              <MobileListSkeleton card rows={2} />
            ) : (
              <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
                {rows.map((row, index) => (
                  <View key={row.id} style={[styles.comment, index > 0 && { borderTopWidth: 1, borderTopColor: ds.c.line }]}>
                    <View style={styles.commentHead}>
                      <Avatar variant="legacy" name={row.studentName} size="sm" box={32} />
                      <View style={styles.grow}>
                        <DsText v="title-sm" numberOfLines={1}>
                          {row.studentName}
                        </DsText>
                        <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1}>
                          {row.createdAt ? relativeDay(row.createdAt, { today: t("page.mobile.today"), yesterday: t("page.mobile.yesterday") }) : ""}
                        </DsText>
                      </View>
                      <Stars value={row.stars} size={14} />
                    </View>
                    {row.description ? (
                      <DsText v="body-xs" style={styles.commentText}>
                        {row.description}
                      </DsText>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  stars: { flexDirection: "row", alignItems: "center", gap: 1 },
  summary: { padding: 16, borderRadius: dsRadius.xl },
  summaryHead: { flexDirection: "row", alignItems: "center", gap: 16 },
  average: { fontSize: 40, lineHeight: 40 },
  summaryMeta: { gap: 4 },
  bars: { marginTop: 14, gap: 8 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  barLabel: { width: 8 },
  barTrack: { flex: 1, minWidth: 0, height: 8, overflow: "hidden", borderRadius: 4 },
  barFill: { height: "100%", borderRadius: 4 },
  barCount: { width: 24, textAlign: "right" },
  comments: { gap: 13 },
  commentsLabel: { lineHeight: 20 },
  list: { overflow: "hidden", paddingVertical: 4, borderRadius: dsRadius.xl },
  comment: { paddingHorizontal: 16, paddingVertical: 12 },
  commentHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  commentText: { marginTop: 8 },
});
