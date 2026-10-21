import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/shared/ui";
import { ChartTooltip } from "./chart-tooltip";

export interface TrendLineSeries {
  key: string;
  name: string;
  color: string;
  values: Array<number | null>;
  area?: boolean;
}

export interface TrendLineChartProps {
  series: TrendLineSeries[];
  labels: string[];
  zeroBase?: boolean;
  unit?: string;
}

/*
 * Chizma maydonining ichki koordinatalari — veb bilan AYNAN bir xil
 * (`trend-line-chart.tsx:18-25`). SVG viewBox shu o'lchamda qoladi va
 * ekran kengligiga cho'ziladi, ya'ni hisob-kitob o'zgarmaydi.
 */
const W = 600;
const H = 210;
const PAD_L = 32;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 26;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

/**
 * Trend grafigi — veb `trend-line-chart.tsx` ning mobil varianti.
 *
 * 🟡 MOSLASH. Hisob-kitobning HAMMASI — o'q chegaralari, nuqta
 * koordinatalari, panjara va belgi qadamlari — vebdan o'zgarishsiz
 * ko'chirilgan. Faqat chizish usuli boshqacha: `<svg>` o'rniga
 * `react-native-svg`, CSS klasslari o'rniga to'g'ridan-to'g'ri ranglar.
 *
 * Skia ISHLATILMADI: grafik oddiy chiziq va matndan iborat,
 * `react-native-svg` esa loyihada allaqachon bor (logotip ham shundan
 * chiziladi). Skia bu yerda foyda bermay, yana bitta chizish quvurini
 * qo'shardi.
 *
 * SICHQONCHA O'RNIGA BOSISH. Vebda qiymatlar sichqoncha tepasiga
 * kelganda ko'rinadi. Telefonda "tepasiga kelish" yo'q, shuning uchun
 * ustun BOSILADI (qayta bosilsa yopiladi) va vebdagi yozuv grafik
 * tepasida chiqadi. Legenda grafik ichida YO'Q — vebdagidek panel
 * sarlavhasida turadi.
 */
export function TrendLineChart({ series, labels, zeroBase = true, unit = "" }: TrendLineChartProps) {
  const { palette } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const [width, setWidth] = useState(0);

  const n = labels.length;

  const allValues = series.flatMap((item) => item.values.filter((value): value is number => value != null));
  const rawMax = allValues.length ? Math.max(...allValues) : 1;
  const rawMin = allValues.length ? Math.min(...allValues) : 0;
  const padding = (rawMax - rawMin || Math.abs(rawMax) || 1) * 0.15;

  const niceMin = zeroBase ? 0 : rawMin - padding;
  const niceMax = zeroBase ? Math.ceil((rawMax * 1.15) / 10) * 10 || 10 : rawMax + padding;

  const xFor = (index: number) => PAD_L + (n <= 1 ? 0 : (index / (n - 1)) * PLOT_W);
  const yFor = (value: number) =>
    PAD_T + PLOT_H - ((value - niceMin) / (niceMax - niceMin || 1)) * PLOT_H;

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((fraction) => niceMin + (niceMax - niceMin) * fraction);

  /*
   * O'q belgisining ANIQLIGI oraliqqa qarab tanlanadi.
   *
   * Veb har doim `Math.round` qiladi. Oraliq kichik bo'lsa (masalan test
   * o'rtachasi hali yig'ilmagan va hammasi 0 atrofida), beshta belgi bir
   * xil songa yaxlitlanib "1 1 0 0 0" bo'lib chiqadi — telefonda buzuq
   * ko'rinadi. Hisob-kitob o'zgarmaydi, faqat YOZILISHI.
   */
  const span = Math.abs(niceMax - niceMin);
  const axisLabel = (value: number) =>
    span < 5 ? String(Number(value.toFixed(1))) : String(Math.round(value));
  const xStep = n <= 8 ? 1 : Math.ceil(n / 7);

  // SVG ekran kengligiga cho'ziladi — balandlik nisbatni saqlaydi.
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
              fontSize={9.5}
              fill={palette["muted-foreground"]}
            >
              {`${axisLabel(value)}${unit}`}
            </SvgText>
          ))}

          {series.map((item) => {
            const points = item.values
              .map((value, index) =>
                value == null ? null : `${xFor(index).toFixed(1)},${yFor(value).toFixed(1)}`
              )
              .filter((point): point is string => point !== null);
            if (!points.length) return null;

            const path = `M${points.join(" L")}`;
            const lastIndex = item.values.length - 1;
            const lastValue = item.values[lastIndex];

            return (
              <G key={item.key}>
                {item.area ? (
                  <Path
                    d={`${path} L${xFor(n - 1).toFixed(1)},${PAD_T + PLOT_H} L${xFor(0).toFixed(1)},${PAD_T + PLOT_H} Z`}
                    fill={item.color}
                    opacity={0.12}
                  />
                ) : null}
                <Path
                  d={path}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={2.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {lastValue != null ? (
                  <>
                    <Circle
                      cx={xFor(lastIndex)}
                      cy={yFor(lastValue)}
                      r={3.4}
                      fill={item.color}
                      stroke={palette.card}
                      strokeWidth={1.6}
                    />
                    {/* `.trend-chart-endlabel` — oxirgi qiymat nuqta ustida. */}
                    <SvgText
                      x={xFor(lastIndex)}
                      y={yFor(lastValue) - 9}
                      textAnchor="end"
                      fontSize={10.5}
                      fontWeight="700"
                      fill={item.color}
                    >
                      {`${lastValue}${unit}`}
                    </SvgText>
                  </>
                ) : null}
              </G>
            );
          })}

          {labels.map((label, index) => {
            const isLast = index === n - 1;
            if (!(index % xStep === 0 || isLast)) return null;
            const previousTick = Math.floor((n - 1) / xStep) * xStep;
            if (isLast && index !== previousTick && index - previousTick < xStep / 2) return null;
            return (
              <SvgText
                key={`label-${index}`}
                x={xFor(index)}
                y={H - 6}
                textAnchor={isLast ? "end" : index === 0 ? "start" : "middle"}
                fontSize={9.5}
                fill={palette["muted-foreground"]}
              >
                {label}
              </SvgText>
            );
          })}

          {selected != null ? (
            <Line
              x1={xFor(selected)}
              y1={PAD_T}
              x2={xFor(selected)}
              y2={PAD_T + PLOT_H}
              stroke={palette["border-strong"]}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ) : null}

          {/*
            * Bosish maydonlari — ular oxirida chiziladi, aks holda
            * grafikning o'zi ularni bosib qo'yardi va bosish ishlamasdi.
            */}
          {labels.map((_, index) => (
            <Rect
              key={`hit-${index}`}
              x={PAD_L + (index / n) * PLOT_W}
              y={PAD_T}
              width={PLOT_W / n}
              height={PLOT_H}
              fill="transparent"
              onPress={() => setSelected((current) => (current === index ? null : index))}
            />
          ))}
        </Svg>
      ) : null}

      {selected != null && width > 0 ? (
        <ChartTooltip
          ratio={xFor(selected) / W}
          chartWidth={width}
          title={labels[selected] ?? ""}
          rows={series.map((item) => {
            const value = item.values[selected];
            return { key: item.key, name: item.name, color: item.color, value: value == null ? "—" : `${value}${unit}` };
          })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /* `.trend-chart` — margin-top 8 */
  wrap: { position: "relative", width: "100%", marginTop: 8 },
});
