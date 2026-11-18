import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { HomeworkFocus } from "@/shared/types";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";

const VISIBLE_ROWS = 5;

function clock(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function useDuration() {
  const { t } = useTranslation("homework");
  return (total: number) => {
    const seconds = Math.max(0, Math.round(total));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;
    if (hours) return t("reviewFocus.hours", { hours, minutes });
    if (minutes) return rest ? t("reviewFocus.minutesSeconds", { minutes, seconds: rest }) : t("reviewFocus.minutes", { minutes });
    return t("reviewFocus.seconds", { seconds: rest });
  };
}

/**
 * "Sahifadan chiqish" — veb `homework-focus-card.tsx`
 * (`gap-2.5 rounded-xl bg-subtle/60 p-4`): chiqishlar soni, tashqarida
 * jami va eng uzun vaqt, 5 tagacha vaqtlar ro'yxati.
 */
export function HomeworkFocusCard({ focus }: { focus: HomeworkFocus }) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const duration = useDuration();
  const left = focus.exits > 0;
  const rows = focus.timeline.slice(0, VISIBLE_ROWS);
  const hidden = focus.timeline.length - rows.length;

  return (
    <View style={[styles.card, { backgroundColor: ds.c.subtle }]}>
      <View style={styles.head}>
        <Icon name="visibility" size={18} color={ds.c["ink-secondary"]} />
        <DsText v="body-sm" w="600" style={styles.grow}>
          {t("reviewFocus.title")}
        </DsText>
        <View style={[styles.badge, { backgroundColor: left ? ds.c["warning-bg"] : ds.c["success-bg"] }]}>
          <DsText v="caption-strong" c={left ? "warning-fg" : "success-fg"}>
            {left ? t("reviewFocus.exits", { count: focus.exits }) : t("reviewFocus.stayed")}
          </DsText>
        </View>
      </View>
      <DsText v="caption" c="ink-secondary">
        {left ? t("reviewFocus.away", { total: duration(focus.awaySeconds), longest: duration(focus.longestSeconds) }) : t("reviewFocus.stayedHint")}
      </DsText>
      {rows.length ? (
        <View style={styles.rows}>
          {rows.map((row) => (
            <View key={row.leftAt} style={styles.row}>
              <DsText v="caption" numeric>
                {clock(row.leftAt)} → {row.returnedAt ? clock(row.returnedAt) : t("reviewFocus.notReturned")}
              </DsText>
              <DsText v="caption" c="ink-secondary" numeric>
                {duration(row.seconds)}
              </DsText>
            </View>
          ))}
          {hidden > 0 ? (
            <DsText v="caption" c="ink-tertiary">
              {t("reviewFocus.more", { count: hidden })}
            </DsText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, padding: 16, borderRadius: dsRadius.xl },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  /* `h-6 rounded-full px-2.5` */
  badge: { height: 24, justifyContent: "center", paddingHorizontal: 10, borderRadius: dsRadius.full },
  rows: { gap: 4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
});
