import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Star } from "lucide-react-native";
import { Text, useLegacyColors, useTheme } from "@/shared/ui";

export interface TableColumn {
  key: string;
  header: string;
  /** Qator katakchasi; matn bo'lsa avtomatik o'raladi. */
  cell: (row: number) => ReactNode;
  /** `.cell-primary` / `td:first-child` — qalinroq matn. */
  strong?: boolean;
}

export interface AdminTableProps {
  columns: TableColumn[];
  rows: number;
  /** `dash` — `.dash-table`, `analytics` — `.analytics-table` o'lchamlari. */
  variant?: "dash" | "analytics";
  empty?: string;
}

const SIZES = {
  dash: { head: 26, row: 45, padX: 10, headPadBottom: 9, headWeight: "700", headSpacing: 0.55 },
  analytics: { head: 35, row: 42, padX: 12, headPadBottom: 9, headWeight: "700", headSpacing: 0.66 },
} as const;

/**
 * Admin jadvali — veb `.dash-table` / `.analytics-table`: katakchalar
 * bir qatorda (`nowrap`), sig'masa gorizontal aylanadi.
 *
 * Jadval USTUNLAB chiziladi: har ustun eng uzun katagiga qarab kengayadi
 * (HTML jadvalidagi kabi), qatorlar esa bir xil balandlikda bo'lgani
 * uchun tekis turadi. Jami kenglik ekrandan kichik bo'lsa ustunlar
 * cho'ziladi (`width: 100%`).
 */
export function AdminTable({ columns, rows, variant = "dash", empty }: AdminTableProps) {
  const colors = useLegacyColors();
  const [width, setWidth] = useState(0);
  const size = SIZES[variant];

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View onLayout={onLayout}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.table, { minWidth: width }]}>
          {columns.map((column) => (
            <View key={column.key} style={styles.column}>
              <View
                style={[
                  styles.head,
                  {
                    height: size.head,
                    paddingHorizontal: size.padX,
                    paddingBottom: size.headPadBottom,
                    paddingTop: variant === "analytics" ? 9 : 0,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  numberOfLines={1}
                  style={[styles.headText, { color: colors.muted, fontWeight: size.headWeight, letterSpacing: size.headSpacing }]}
                >
                  {column.header}
                </Text>
              </View>
              {Array.from({ length: rows }, (_, row) => {
                const content = column.cell(row);
                return (
                  <View
                    key={row}
                    style={[
                      styles.cell,
                      { height: size.row, paddingHorizontal: size.padX, borderColor: colors.border },
                      row === rows - 1 && styles.last,
                    ]}
                  >
                    {typeof content === "string" || typeof content === "number" ? (
                      <Text variant="label" numberOfLines={1} style={[styles.cellText, column.strong && styles.strong]}>
                        {content}
                      </Text>
                    ) : (
                      content
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      {!rows && empty ? (
        <Text variant="label" style={[styles.empty, { color: colors.muted }]}>
          {empty}
        </Text>
      ) : null}
    </View>
  );
}

/** `.dash-rank` — 20px kulrang doira. */
export function Rank({ value }: { value: number }) {
  const colors = useLegacyColors();
  return (
    <View style={[styles.rank, { backgroundColor: colors.mutedBg }]}>
      <Text variant="caption" style={[styles.rankText, { color: colors.muted }]}>
        {value}
      </Text>
    </View>
  );
}

/** `.dash-stars` — sariq yulduzcha va baho. */
export function Stars({ value }: { value: number | null }) {
  const { palette } = useTheme();
  return (
    <View style={styles.stars}>
      <Star size={12} color={palette.warning} fill={palette.warning} />
      <Text variant="label" style={styles.cellText}>
        {value != null ? value.toFixed(1) : "—"}
      </Text>
    </View>
  );
}

/** `.dash-pill` — chegaradan yuqori yashil, past sariq. */
export function Pill({ value, threshold, suffix }: { value: number | null; threshold: number; suffix: string }) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const tone =
    value == null
      ? { fg: colors.foreground, bg: "transparent" }
      : value >= threshold
        ? { fg: palette["success-strong"], bg: palette["success-soft"] }
        : { fg: palette["warning-strong"], bg: palette["warning-soft"] };
  return (
    <Text variant="caption" style={[styles.pill, { color: tone.fg, backgroundColor: tone.bg }]}>
      {value == null ? "—" : `${value}${suffix}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  table: { flexDirection: "row" },
  column: { flexGrow: 1 },
  head: { justifyContent: "flex-end", borderBottomWidth: 1 },
  headText: { fontSize: 11, lineHeight: 16.5, textTransform: "uppercase" },
  cell: { justifyContent: "center", borderBottomWidth: 1 },
  last: { borderBottomWidth: 0 },
  cellText: { fontSize: 13, lineHeight: 19.5, fontWeight: "400" },
  strong: { fontWeight: "600" },
  empty: { paddingVertical: 11, paddingHorizontal: 10, fontWeight: "400" },
  rank: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 11, lineHeight: 14, fontWeight: "700" },
  stars: { flexDirection: "row", alignItems: "center", gap: 3 },
  pill: { alignSelf: "flex-start", overflow: "hidden", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, fontSize: 11, lineHeight: 16.5, fontWeight: "700" },
});
