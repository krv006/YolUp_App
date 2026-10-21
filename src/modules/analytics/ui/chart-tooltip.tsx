import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Text, useTheme } from "@/shared/ui";

export interface ChartTooltipRow {
  key: string;
  name: string;
  color: string;
  value: string;
}

export interface ChartTooltipProps {
  /** Nuqtaning grafik kengligiga nisbatan o'rni (0..1). */
  ratio: number;
  /** Grafikning ekrandagi kengligi, px. */
  chartWidth: number;
  title: string;
  rows: ChartTooltipRow[];
}

/**
 * Grafik ustidagi qalqib chiquvchi yozuv — veb `.trend-chart-tooltip`:
 * nuqta ro'parasida markazlashadi (`translateX(-50%)`), tepadan 4px.
 * Telefonda chetga chiqib ketmasligi uchun grafik ichida ushlab turiladi.
 */
export function ChartTooltip({ ratio, chartWidth, title, rows }: ChartTooltipProps) {
  const { palette } = useTheme();
  const [ownWidth, setOwnWidth] = useState(0);

  function onLayout(event: LayoutChangeEvent) {
    setOwnWidth(event.nativeEvent.layout.width);
  }

  const center = ratio * chartWidth;
  const left = Math.min(Math.max(center - ownWidth / 2, 0), Math.max(chartWidth - ownWidth, 0));

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[
        styles.tooltip,
        { left, opacity: ownWidth ? 1 : 0, borderColor: palette["border-strong"], backgroundColor: palette.popover },
      ]}
    >
      <Text variant="caption" style={[styles.title, { color: palette["popover-foreground"] }]}>
        {title}
      </Text>
      {rows.map((row) => (
        <View key={row.key} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: row.color }]} />
          <Text variant="caption" style={[styles.text, { color: palette["popover-foreground"] }]}>
            {row.name}:
          </Text>
          <Text variant="caption" style={[styles.text, styles.value, { color: palette["popover-foreground"] }]}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  /* 7 10 bo'shliq, radius 10, 11px matn, soya */
  tooltip: {
    position: "absolute",
    top: 4,
    zIndex: 2,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { marginBottom: 3, fontSize: 11, lineHeight: 15, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 2 },
  text: { fontSize: 11, lineHeight: 15 },
  value: { marginLeft: "auto", paddingLeft: 8, fontWeight: "700" },
});
