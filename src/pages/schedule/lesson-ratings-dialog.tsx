import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useLessonRatings } from "@/modules/lesson";
import type { Lesson } from "@/shared/types";
import { Avatar, DsText, dsRadius, Icon, MobileButton, Sheet, useDs } from "@/shared/ui";

export interface LessonRatingsDialogProps {
  lesson: Lesson | null;
  onOpenChange: (open: boolean) => void;
}

function clock(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Dars baholari — veb `pages/schedule/lesson-ratings-dialog.tsx` ning tor
 * ekran varianti: o'rtacha ball va yulduzlar, o'quvchilarning baho va izohlari.
 */
export function LessonRatingsDialog({ lesson, onOpenChange }: LessonRatingsDialogProps) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const ratings = useLessonRatings(lesson?.id ?? null, Boolean(lesson));
  const rows = ratings.data ?? [];
  const average = lesson?.avgRating ?? (rows.length ? rows.reduce((sum, row) => sum + row.stars, 0) / rows.length : null);

  return (
    <Sheet
      variant="app"
      open={Boolean(lesson)}
      onClose={() => onOpenChange(false)}
      title={t("ratingsDialog.title")}
      description={t("ratingsDialog.description", { title: lesson?.courseTitle ?? "" })}
      footer={<MobileButton label={t("schedule.close")} onPress={() => onOpenChange(false)} />}
    >
      <View style={styles.body}>
        {/* `h-20 rounded-lg bg-subtle px-4 gap-4` */}
        <View style={[styles.average, { backgroundColor: ds.c.subtle }]}>
          <DsText heading w="500" style={styles.averageValue}>
            {average === null ? "—" : average.toFixed(1).replace(".", ",")}
          </DsText>
          <View style={styles.averageMeta}>
            <Stars value={average === null ? 0 : Math.round(average)} size={20} />
            <DsText v="caption" c="ink-secondary" numberOfLines={1}>
              {t("ratingsDialog.count", { count: lesson?.ratingCount || rows.length })}
            </DsText>
          </View>
        </View>

        <View style={styles.list}>
          {rows.map((row) => (
            <View key={row.id}>
              <View style={styles.rowHead}>
                <Avatar variant="legacy" name={row.studentName} size="sm" box={32} />
                <DsText v="body-sm" w="600" numberOfLines={1} style={styles.grow}>
                  {row.studentName}
                </DsText>
                <Stars value={row.stars} size={14} />
              </View>
              {row.description ? (
                <DsText v="body-sm" style={styles.rowGap}>
                  {row.description}
                </DsText>
              ) : null}
              <DsText v="caption" c="ink-secondary" style={styles.rowGap}>
                {clock(row.createdAt)}
              </DsText>
            </View>
          ))}
          {!ratings.isLoading && !rows.length ? (
            <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
              {t("ratingsDialog.empty")}
            </DsText>
          ) : null}
        </View>
      </View>
    </Sheet>
  );
}

function Stars({ value, size }: { value: number; size: number }) {
  const ds = useDs();
  return (
    <View style={styles.stars}>
      {Array.from({ length: 5 }, (_, index) => (
        <Icon key={index} name="star" size={size} color={index < value ? ds.c["saffron-strong"] : ds.c["line-strong"]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  body: { gap: 18 },
  average: { height: 80, flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, borderRadius: dsRadius.lg },
  averageValue: { fontSize: 36, lineHeight: 44 },
  averageMeta: { flex: 1, minWidth: 0, gap: 4 },
  list: { gap: 32 },
  rowHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowGap: { marginTop: 6 },
  empty: { paddingVertical: 24, textAlign: "center" },
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
});
