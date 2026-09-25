import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { Text, useTheme } from "@/shared/ui";

export interface TrendBarSeries {
  key: string;
  name: string;
  color: string;
  values: number[];
}

export interface TrendStackedBarChartProps {
  series: TrendBarSeries[];
  labels: string[];
}

/* Koordinatalar veb bilan aynan bir xil (`trend-stacked-bar-chart.tsx:15-23`). */
const W = 600;
const H = 210;
const PAD_L = 32;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 26;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const GAP = 1.5;

/** Ustunning faqat TEPA burchaklari yumaloq — veb bilan bir xil. */
function topRoundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0.5) return "";
  const radius = Math.min(r, w / 2, h);
  if (radius <= 0) return `M${x},${y + h} L${x},${y} L${x + w},${y} L${x + w},${y + h} Z`;
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

/**
 * Ustunli trend grafigi — veb `trend-stacked-bar-chart.tsx` ning mobil
 * varianti.
 *
 * 🟡 MOSLASH: hisob-kitob o'zgarishsiz, chizish `react-native-svg` bilan,
 * sichqoncha o'rniga bosish (izohi `trend-line-chart.tsx` da).
 */
export function TrendStackedBarChart({ series, labels }: TrendStackedBarChartProps) {
  const { palette } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const [width, setWidth] = useState(0);

  const n = labels.length;

  const totals = labels.map((_, index) =>
    series.reduce((sum, item) => sum + (item.values[index] ?? 0), 0)
  );
  const maxTotal = Math.max(...totals, 0);
  const niceMax = Math.ceil((maxTotal * 1.15) / 10) * 10 || 10;

  const yFor = (value: number) => PAD_T + PLOT_H - (value / niceMax) * PLOT_H;
  const slot = PLOT_W / (n || 1);
  const barWidth = slot * 0.56;
  const xFor = (index: number) => PAD_L + index * slot + (slot - barWidth) / 2;

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((fraction) => niceMax * fraction);
  const xStep = n <= 8 ? 1 : Math.ceil(n / 7);

  const height = width ? (width * H) / W : H;

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
          {gridValues.map((value) => (
            <Line
              key={`grid-${value}`}
              x1={PAD_L}
              y1={yFor(value)}
              x2={W - PAD_R}
              y2={yFor(value)}
              stroke={palette.border}
              strokeWidth={1}
            />
          ))}

          {gridValues.map((value) => (
            <SvgText
              key={`axis-${value}`}
              x={PAD_L - 6}
              y={yFor(value) + 3.5}
              textAnchor="end"
              fontSize={10}
              fill={palette["muted-foreground"]}
            >
              {String(Math.round(value))}
            </SvgText>
          ))}

          {labels.map((_, index) => {
            let cursor = PAD_T + PLOT_H;
            const x = xFor(index);
            return series.map((item, seriesIndex) => {
              const value = item.values[index] ?? 0;
              const segmentHeight = (value / niceMax) * PLOT_H;
              const y = cursor - segmentHeight;
              const isTop = seriesIndex === series.length - 1;
              const path = topRoundedRectPath(x, y, barWidth, Math.max(segmentHeight - GAP, 0), isTop ? 4 : 0);
              cursor = y - GAP;
              return path ? (
                <Path key={`${item.key}-${index}`} d={path} fill={item.color} />
              ) : null;
            });
          })}

          {labels.map((label, index) =>
            index % xStep === 0 || index === n - 1 ? (
              <SvgText
                key={`label-${index}`}
                x={xFor(index) + barWidth / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize={10}
                fill={palette["muted-foreground"]}
              >
                {label}
              </SvgText>
            ) : null
          )}

          {labels.map((_, index) => (
            <Rect
              key={`hit-${index}`}
              x={PAD_L + index * slot}
              y={PAD_T}
              width={slot}
              height={PLOT_H}
              fill="transparent"
              onPress={() => setSelected((current) => (current === index ? null : index))}
            />
          ))}
        </Svg>
      ) : null}

      {selected != null ? (
        <View style={[styles.readout, { borderColor: palette.border, backgroundColor: palette.muted }]}>
          <Text variant="caption" tone="muted">
            {labels[selected]}
          </Text>
          {series.map((item) => (
            <View key={item.key} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text variant="caption" style={styles.name}>
                {item.name}
              </Text>
              <Text variant="caption">{item.values[selected] ?? 0}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text variant="caption" tone="muted">
          Qiymatlarni ko&apos;rish uchun ustunni bosing.
        </Text>
      )}

      <View style={styles.legend}>
        {series.map((item) => (
          <View key={item.key} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text variant="caption" tone="muted">
              {item.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, width: "100%" },
  readout: {
    gap: 4,
    padding: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
