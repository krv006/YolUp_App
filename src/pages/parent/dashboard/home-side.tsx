import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import { useRouter } from "expo-router";
import type { AttentionItem } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatDayTime } from "@/shared/lib";
import { DsText, dsRadius, Icon, useDs, type DsColor, type IconName } from "@/shared/ui";

const DAY_MS = 86_400_000;
/* `ScoreCard` chizmasi: balandlik va chetlar. */
const H = 120;
const PAD = 8;

/**
 * "E'tibor talab qiladi" — veb `home-side.tsx` `AttentionCard`: yaqin
 * muddatli vazifa, notanish qurilmadan kirish va yangi imtihon natijasi;
 * har biri o'z bo'limini ochadi.
 */
export function AttentionCard({ items, childId, now }: { items: AttentionItem[]; childId: string; now: number }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const today = new Date(now).toDateString();
  const tomorrow = new Date(now + DAY_MS).toDateString();
  const go = (href: string) => router.push(href as never, { withAnchor: true });

  return (
    <View style={styles.section}>
      <DsText v="title">{t("home.attention.title")}</DsText>
      <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
        {items.length ? (
          items.map((item, index) => {
            let icon: IconName;
            let tone: { bg: DsColor; fg: DsColor };
            let title: string;
            let meta: string;
            let open: () => void;
            if (item.kind === "homework") {
              const due = item.assignment.dueAt ?? "";
              const dueDay = new Date(due).toDateString();
              icon = "hourglass-empty";
              tone = { bg: "accent-saffron-bg", fg: "accent-saffron-fg" };
              title =
                dueDay === today
                  ? t("home.attention.homeworkToday")
                  : dueDay === tomorrow
                    ? t("home.attention.homeworkTomorrow")
                    : t("home.attention.homeworkSoon");
              meta = `${item.assignment.title} · ${formatDayTime(due)}`;
              open = () => router.navigate(ROUTES.parent.homework as never);
            } else if (item.kind === "login") {
              icon = "shield";
              tone = { bg: "danger-bg", fg: "error-text" };
              title = t("home.attention.login");
              meta = `${item.device} · ${formatDayTime(item.at)}`;
              open = () => go(ROUTES.parent.childLogins(childId));
            } else {
              icon = "emoji-events";
              tone = { bg: "accent-blue-bg", fg: "accent-blue-fg" };
              title = t("home.attention.exam");
              meta = t("home.attention.examMeta", { title: item.exam.title });
              open = () => router.navigate(ROUTES.parent.exams as never);
            }
            return (
              <Pressable
                key={`${item.kind}-${index}`}
                accessibilityRole="button"
                onPress={open}
                style={({ pressed }) => [styles.row, index < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }, pressed && { backgroundColor: ds.c.subtle }]}
              >
                <View style={[styles.icon, { backgroundColor: ds.c[tone.bg] }]}>
                  <Icon name={icon} size={20} color={ds.c[tone.fg]} />
                </View>
                <View style={styles.text}>
                  <DsText v="body" w="600" numberOfLines={1}>
                    {title}
                  </DsText>
                  <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                    {meta}
                  </DsText>
                </View>
                <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
              </Pressable>
            );
          })
        ) : (
          <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
            {t("home.attention.empty")}
          </DsText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  /* `flex flex-col overflow-hidden rounded-[20px] bg-surface` */
  list: { overflow: "hidden", borderRadius: 20 },
  /* `flex items-center gap-3 px-4 py-3.5` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  icon: { width: 40, height: 40, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0, gap: 2 },
  empty: { paddingHorizontal: 16, paddingVertical: 28, textAlign: "center" },
  grow: { flex: 1, minWidth: 0 },
  /* `flex flex-col gap-4 rounded-[20px] bg-surface p-5` */
  score: { gap: 16, padding: 20, borderRadius: 20 },
  scoreHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  delta: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: dsRadius.full },
  chart: { gap: 8 },
  plot: { height: H },
  weeks: { flexDirection: "row", justifyContent: "space-between" },
  scoreEmpty: { paddingVertical: 24, textAlign: "center" },
});

/**
 * Ball dinamikasi — veb `home-side.tsx` `ScoreCard`: haftalik o'rtacha ball
 * chizig'i (ostida ko'k gradient), oxirgi nuqtada qora yorliq, pastda hafta
 * raqamlari. Kenglik vebda `viewBox` bilan cho'zilardi; mobilda karta eni
 * o'lchanadi va chizma shunga quriladi.
 */
export function ScoreCard({
  trend,
  delta,
  title,
  deltaLabel,
  gradientId = "parent-score-fill",
}: {
  trend: Array<number | null>;
  delta: number | null;
  title?: string;
  deltaLabel?: string;
  gradientId?: string;
}) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const [W, setW] = useState(0);
  const points = trend.map((value, index) => ({ value, index })).filter((point): point is { value: number; index: number } => point.value !== null);
  const values = points.map((point) => point.value);
  const min = values.length ? Math.max(0, Math.min(...values) - 1) : 0;
  const max = values.length ? Math.min(10, Math.max(...values) + 1) : 10;
  const x = (index: number) => PAD + (index * (W - PAD * 2)) / Math.max(1, trend.length - 1);
  const y = (value: number) => H - PAD - ((value - min) / Math.max(0.1, max - min)) * (H - PAD * 2);
  const line = points.map((point, i) => `${i ? "L" : "M"}${x(point.index)},${y(point.value)}`).join(" ");
  const area = points.length ? `${line} L${x(points[points.length - 1].index)},${H} L${x(points[0].index)},${H} Z` : "";
  const last = points[points.length - 1];
  const up = (delta ?? 0) > 0;

  return (
    <View style={[styles.score, { backgroundColor: ds.c.surface }]}>
      <View style={styles.scoreHead}>
        <DsText v="title" style={styles.grow}>
          {title ?? t("home.score.title")}
        </DsText>
        {delta !== null && delta !== 0 ? (
          <View style={[styles.delta, { backgroundColor: ds.c[up ? "success-bg" : "danger-bg"] }]}>
            <Icon name="trending-up" size={14} color={ds.c[up ? "success-fg" : "error-text"]} />
            <DsText v="caption-strong" c={up ? "success-fg" : "error-text"}>
              {up ? "+" : ""}
              {delta}
              {deltaLabel ? ` ${deltaLabel}` : ""}
            </DsText>
          </View>
        ) : null}
      </View>
      {points.length ? (
        <View style={styles.chart}>
          <View style={styles.plot} onLayout={(event) => setW(Math.round(event.nativeEvent.layout.width))} accessibilityLabel={title ?? t("home.score.title")}>
            {W ? (
              <Svg width={W} height={H}>
                <Defs>
                  <LinearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <Stop offset="0%" stopColor={ds.c.brand} stopOpacity={0.22} />
                    <Stop offset="100%" stopColor={ds.c.brand} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                {[0.25, 0.5, 0.75].map((ratio) => (
                  <Line key={ratio} x1={PAD} x2={W - PAD} y1={H * ratio} y2={H * ratio} stroke={ds.c.line} strokeWidth={1} />
                ))}
                {points.length > 1 ? <Path d={area} fill={`url(#${gradientId})`} /> : null}
                <Path d={line} fill="none" stroke={ds.c.brand} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                {points.map((point) => (
                  <Circle key={point.index} cx={x(point.index)} cy={y(point.value)} r={point === last ? 5 : 3.5} fill={ds.c.brand} stroke={ds.c.surface} strokeWidth={2} />
                ))}
                {last ? (
                  <G transform={`translate(${Math.min(W - 40, x(last.index) - 18)}, ${Math.max(0, y(last.value) - 34)})`}>
                    <Rect width={36} height={22} rx={6} fill={ds.c.ink} />
                    <SvgText x={18} y={15} textAnchor="middle" fontSize={11} fontWeight="600" fill={ds.c.surface}>
                      {String(last.value)}
                    </SvgText>
                  </G>
                ) : null}
              </Svg>
            ) : null}
          </View>
          <View style={styles.weeks}>
            {trend.map((_, index) => (
              <DsText key={index} v="caption" c="ink-tertiary">
                {t("home.score.week", { n: index + 1 })}
              </DsText>
            ))}
          </View>
        </View>
      ) : (
        <DsText v="body-sm" c="ink-secondary" style={styles.scoreEmpty}>
          {t("home.score.empty")}
        </DsText>
      )}
    </View>
  );
}
