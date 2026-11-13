import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { ChartTooltip } from "@/modules/analytics";
import {
  isConsentRequired,
  SCORE_KINDS,
  scoreSeries,
  useChildScores,
  type ScoreKind,
  type ScoreRange,
} from "@/modules/parent";
import { AppError } from "@/shared/api";
import { DsText, dsRadius, dsShadowHidden, useDs } from "@/shared/ui";

const RANGES: ScoreRange[] = ["8w", "6m", "all"];
const SIZE = {
  wide: { width: 640, height: 220 },
  compact: { width: 300, height: 150 },
} as const;
const PAD = { top: 14, right: 12, bottom: 10, left: 26 };
const GRID = [0, 2.5, 5, 7.5, 10];
/* Davr yozuvi kengligi — vebdagi `-translate-x-1/2` uchun markazlash. */
const LABEL_WIDTH = 56;

function periodLabel(start: string, monthly: boolean, months: string[]): string {
  const date = new Date(start);
  if (Number.isNaN(date.getTime())) return "";
  if (monthly) return months[date.getMonth()] ?? "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export interface ChildScoreChartProps {
  childId: string | null;
  variant?: "wide" | "compact";
  title?: string;
}

/**
 * Ball dinamikasi — veb `widgets/child-score-chart`: uy vazifasi, test va
 * mock ballari (10 ballik) bo'yicha umumiy chiziq, tur filtri va davr
 * (8 hafta / 6 oy / hammasi). O'quvchi tahlilga ruxsat bermagan bo'lsa
 * (`consent_required` yoki 403) shu haqida yozuv chiqadi.
 *
 * Hisob-kitob vebdagidek (`viewBox` o'lchami, chetlar, panjara). Vebda
 * nuqta qiymati sichqoncha bilan (`<title>`) ko'rinardi; telefonda nuqta
 * ustuni bosiladi va qiymat grafik tepasida chiqadi (`TrendLineChart`
 * kabi), qayta bosilsa yopiladi.
 */
export function ChildScoreChart({ childId, variant = "wide", title }: ChildScoreChartProps) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const [range, setRange] = useState<ScoreRange>("8w");
  const [kind, setKind] = useState<ScoreKind>("overall");
  const [selected, setSelected] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const scores = useChildScores(childId, range);
  const { width: W, height: H } = SIZE[variant];
  const months = t("scores.monthsShort", { returnObjects: true }) as string[];
  const data = scores.data;
  const series = data ? scoreSeries(data, kind) : [];
  const step = series.length > 1 ? (W - PAD.left - PAD.right) / (series.length - 1) : 0;
  const x = (index: number) =>
    series.length > 1 ? PAD.left + index * step : (W + PAD.left - PAD.right) / 2;
  const y = (value: number) => PAD.top + (1 - value / 10) * (H - PAD.top - PAD.bottom);
  const points = series
    .map((value, index) => (value === null ? null : { index, value }))
    .filter((point): point is { index: number; value: number } => point !== null);
  const line = points
    .map((point, i) => `${i ? "L" : "M"}${x(point.index)},${y(point.value)}`)
    .join(" ");
  const area =
    points.length > 1
      ? `${line} L${x(points[points.length - 1].index)},${H - PAD.bottom} L${x(points[0].index)},${H - PAD.bottom} Z`
      : "";
  const last = points[points.length - 1];
  const labelEvery = Math.max(1, Math.ceil(series.length / (variant === "wide" ? 12 : 6)));
  const locked =
    scores.isError &&
    (isConsentRequired(scores.error) ||
      (scores.error instanceof AppError && scores.error.status === 403));
  const average = data?.summary[kind] ?? null;
  const gradientId = `child-score-${variant}`;
  const monthly = data?.periodType === "month";
  // Farzand yoki davr almashganda tanlangan nuqta yo'qolgan bo'lishi mumkin.
  const picked = selected !== null && series[selected] != null ? selected : null;
  // Bitta nuqta ustunining kengligi — bosish maydoni.
  const slot = series.length > 1 ? step : W - PAD.left - PAD.right;
  const scale = chartWidth / W;

  function pickKind(item: ScoreKind) {
    setKind(item);
    setSelected(null);
  }

  function pickRange(item: ScoreRange) {
    setRange(item);
    setSelected(null);
  }

  return (
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <View style={styles.head}>
        <DsText v="title" style={styles.grow}>
          {title ?? t("scores.title")}
        </DsText>
        {average !== null ? (
          <View style={[styles.average, { backgroundColor: ds.c["brand-subtle"] }]}>
            <DsText v="caption-strong" c="brand">
              {t("scores.average", { value: average })}
            </DsText>
          </View>
        ) : null}
      </View>

      <View style={variant === "wide" ? styles.filtersWide : styles.filters}>
        <View
          accessibilityRole="tablist"
          accessibilityLabel={t("scores.kindLabel")}
          style={[
            styles.tabs,
            variant === "compact" && styles.tabsFull,
            { backgroundColor: ds.c.subtle },
          ]}
        >
          {SCORE_KINDS.map((item) => {
            const active = kind === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => pickKind(item)}
                style={[
                  styles.tab,
                  variant === "compact" && styles.tabFlex,
                  {
                    backgroundColor: active ? ds.c.surface : "transparent",
                    boxShadow: active ? ds.shadow.xs : dsShadowHidden(ds.shadow.xs),
                  },
                ]}
              >
                <DsText v="caption-strong" c={active ? "ink" : "ink-secondary"} numberOfLines={1}>
                  {variant === "compact"
                    ? t(`scores.kindsShort.${item}`)
                    : t(`scores.kinds.${item}`)}
                </DsText>
              </Pressable>
            );
          })}
        </View>
        <View
          accessibilityRole="tablist"
          accessibilityLabel={t("scores.rangeLabel")}
          style={[
            styles.tabs,
            variant === "compact" && styles.tabsFull,
            { backgroundColor: ds.c.subtle },
          ]}
        >
          {RANGES.map((item) => {
            const active = range === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => pickRange(item)}
                style={[
                  styles.tab,
                  variant === "compact" && styles.tabFlex,
                  active && { backgroundColor: ds.c.brand },
                ]}
              >
                <DsText
                  v="caption-strong"
                  c={active ? "on-action" : "ink-secondary"}
                  numberOfLines={1}
                >
                  {t(`scores.ranges.${item}`)}
                </DsText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {locked ? (
        <DsText v="body-sm" c="ink-secondary" style={styles.note}>
          {t("scores.locked")}
        </DsText>
      ) : scores.isLoading ? (
        <View
          style={[styles.skeleton, { aspectRatio: W / H, backgroundColor: ds.c.skeleton }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : points.length ? (
        <View style={styles.chart}>
          <View
            style={{ aspectRatio: W / H }}
            onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
          >
            {chartWidth ? (
              <Svg
                width={chartWidth}
                height={(chartWidth * H) / W}
                viewBox={`0 0 ${W} ${H}`}
                accessibilityLabel={t("scores.chartAria", { kind: t(`scores.kinds.${kind}`) })}
              >
                <Defs>
                  <LinearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <Stop offset="0%" stopColor={ds.c.brand} stopOpacity={0.2} />
                    <Stop offset="100%" stopColor={ds.c.brand} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                {GRID.map((value) => (
                  <G key={value}>
                    <Line
                      x1={PAD.left}
                      x2={W - PAD.right}
                      y1={y(value)}
                      y2={y(value)}
                      stroke={ds.c.line}
                      strokeWidth={1}
                    />
                    <SvgText
                      x={PAD.left - 6}
                      y={y(value) + 3.5}
                      textAnchor="end"
                      fontSize={10}
                      fill={ds.c["ink-tertiary"]}
                    >
                      {String(value)}
                    </SvgText>
                  </G>
                ))}
                {area ? <Path d={area} fill={`url(#${gradientId})`} /> : null}
                {picked !== null ? (
                  <Line
                    x1={x(picked)}
                    x2={x(picked)}
                    y1={PAD.top}
                    y2={H - PAD.bottom}
                    stroke={ds.c["line-strong"]}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                ) : null}
                <Path
                  d={line}
                  fill="none"
                  stroke={ds.c.brand}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {points.map((point) => (
                  <Circle
                    key={point.index}
                    cx={x(point.index)}
                    cy={y(point.value)}
                    r={point === last || point.index === picked ? 5 : 3.5}
                    fill={ds.c.brand}
                    stroke={ds.c.surface}
                    strokeWidth={2}
                  />
                ))}
                {last ? (
                  <G
                    transform={`translate(${Math.min(W - 40, Math.max(PAD.left, x(last.index) - 18))}, ${Math.max(0, y(last.value) - 32)})`}
                  >
                    <Rect width={36} height={22} rx={6} fill={ds.c.ink} />
                    <SvgText
                      x={18}
                      y={15}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight="600"
                      fill={ds.c.surface}
                    >
                      {String(last.value)}
                    </SvgText>
                  </G>
                ) : null}
                {/* Bosish maydonlari oxirida — aks holda chiziq va nuqtalar ularni to'sardi. */}
                {points.map((point) => (
                  <Rect
                    key={`hit-${point.index}`}
                    x={x(point.index) - slot / 2}
                    y={0}
                    width={slot}
                    height={H}
                    fill="transparent"
                    onPress={() =>
                      setSelected((current) => (current === point.index ? null : point.index))
                    }
                  />
                ))}
              </Svg>
            ) : null}
            {picked !== null && chartWidth ? (
              <ChartTooltip
                ratio={x(picked) / W}
                chartWidth={chartWidth}
                title={periodLabel(data?.periods[picked]?.start ?? "", monthly, months)}
                rows={[
                  {
                    key: kind,
                    name: t(`scores.kinds.${kind}`),
                    color: ds.c.brand,
                    value: String(series[picked]),
                  },
                ]}
              />
            ) : null}
          </View>
          <View
            style={styles.periods}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {chartWidth
              ? (data?.periods ?? []).map((period, index) =>
                  index % labelEvery === 0 || index === series.length - 1 ? (
                    <View
                      key={period.start}
                      style={[styles.period, { left: x(index) * scale - LABEL_WIDTH / 2 }]}
                    >
                      <DsText v="caption" c="ink-tertiary" numberOfLines={1}>
                        {periodLabel(period.start, monthly, months)}
                      </DsText>
                    </View>
                  ) : null
                )
              : null}
          </View>
        </View>
      ) : (
        <DsText v="body-sm" c="ink-secondary" style={styles.note}>
          {t("scores.empty")}
        </DsText>
      )}

      {variant === "wide" && data && !locked ? (
        <View style={styles.summary}>
          {SCORE_KINDS.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => pickKind(item)}
              style={[
                styles.summaryItem,
                { backgroundColor: ds.c[kind === item ? "brand-subtle" : "subtle"] },
              ]}
            >
              <DsText v="caption" c="ink-secondary">
                {t(`scores.kinds.${item}`)}
              </DsText>
              <DsText v="title" numeric>
                {data.summary[item] ?? "—"}
              </DsText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  /* `flex flex-col gap-4 rounded-[20px] bg-surface p-5` */
  card: { gap: 16, padding: 20, borderRadius: 20 },
  head: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  /* `rounded-full bg-brand-subtle px-2.5 py-0.5` */
  average: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: dsRadius.full },
  filters: { gap: 8 },
  filtersWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  /* `grid gap-1 rounded-full bg-subtle p-1` */
  tabs: { flexDirection: "row", gap: 4, padding: 4, borderRadius: dsRadius.full },
  tabsFull: { alignSelf: "stretch" },
  /* `h-8 rounded-full px-2.5 text-caption-strong` */
  tab: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: dsRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  tabFlex: { flex: 1, minWidth: 0 },
  note: { paddingVertical: 24, textAlign: "center" },
  skeleton: { width: "100%", borderRadius: dsRadius.xl },
  /* `flex flex-col gap-1.5` */
  chart: { gap: 6 },
  /* `relative h-4` — yozuvlar nuqta ro'parasida markazlashadi. */
  periods: { height: 16 },
  period: { position: "absolute", top: 0, width: LABEL_WIDTH, alignItems: "center" },
  /* `grid grid-cols-2 gap-2` */
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  /* `rounded-xl px-3 py-2.5` */
  summaryItem: {
    width: "47%",
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: dsRadius.xl,
  },
});
