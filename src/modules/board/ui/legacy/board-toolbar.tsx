import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Circle,
  Eraser,
  Highlighter,
  Minus,
  MoveRight,
  PenLine,
  Sigma,
  Square,
  Type,
} from "lucide-react-native";
import { radius, useTheme } from "@/shared/ui";
import { BOARD_COLORS, BOARD_WIDTHS } from "../../constants/board.constants";
import type { BoardTool } from "../board-mobile";

export type { BoardTool };

const TOOLS: ReadonlyArray<{ id: BoardTool; labelKey: string; icon: typeof PenLine }> = [
  { id: "erase", labelKey: "tools.erase", icon: Eraser },
  { id: "pen", labelKey: "tools.pen", icon: PenLine },
  { id: "marker", labelKey: "tools.marker", icon: Highlighter },
  { id: "line", labelKey: "tools.line", icon: Minus },
  { id: "arrow", labelKey: "tools.arrow", icon: MoveRight },
  { id: "rect", labelKey: "tools.rect", icon: Square },
  { id: "ellipse", labelKey: "tools.ellipse", icon: Circle },
  { id: "text", labelKey: "tools.text", icon: Type },
  { id: "math", labelKey: "tools.math", icon: Sigma },
];

export interface BoardToolbarProps {
  tool: BoardTool;
  color: string;
  width: number;
  canDraw: boolean;
  onToolChange: (tool: BoardTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
}

/**
 * Doska asboblari — veb `board-toolbar.tsx`: oq karta, tepada asboblar,
 * pastda ranglar va qalinliklar. Tor ekranda gorizontal aylantiriladi
 * (vebda `overflow-x-auto`).
 */
export function BoardToolbar({ tool, color, width, canDraw, onToolChange, onColorChange, onWidthChange }: BoardToolbarProps) {
  const { t } = useTranslation("board");
  const { palette } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View accessibilityRole="toolbar" accessibilityLabel={t("tools.toolbarAria")} style={[styles.card, { backgroundColor: palette.surface }]}>
        <View style={styles.row}>
          {TOOLS.map(({ id, labelKey, icon: ToolIcon }) => {
            const active = tool === id;
            const erase = id === "erase";
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={t(labelKey)}
                accessibilityState={{ selected: active, disabled: !canDraw }}
                disabled={!canDraw}
                onPress={() => onToolChange(id)}
                style={({ pressed }) => [
                  styles.tool,
                  active
                    ? { backgroundColor: erase ? palette["destructive-soft"] : palette.primary }
                    : pressed && { backgroundColor: palette["surface-subtle"] },
                  !canDraw && styles.dim,
                ]}
              >
                <ToolIcon
                  size={17}
                  color={active ? (erase ? palette["destructive-strong"] : palette["primary-foreground"]) : palette["muted-foreground"]}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.bottom}>
          <View style={styles.colors}>
            {BOARD_COLORS.map((value) => {
              const on = color === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={t("tools.colorLabel", { value })}
                  accessibilityState={{ selected: on }}
                  disabled={!canDraw}
                  onPress={() => onColorChange(value)}
                  style={[styles.swatchRing, on && { borderColor: palette.primary }, !canDraw && styles.dim]}
                >
                  <View style={[styles.swatch, { backgroundColor: value }]} />
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.divider, { backgroundColor: palette.border }]} />

          <View style={styles.widths}>
            {BOARD_WIDTHS.map((value) => {
              const on = width === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={t("tools.widthLabel", { value })}
                  accessibilityState={{ selected: on }}
                  disabled={!canDraw}
                  onPress={() => onWidthChange(value)}
                  style={[styles.width, on && { backgroundColor: palette["primary-soft"] }, !canDraw && styles.dim]}
                >
                  <View style={[styles.widthBar, { height: Math.min(value, 10), backgroundColor: palette.foreground }]} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, maxWidth: "100%", borderRadius: radius["2xl"] },
  scrollContent: { flexGrow: 1 },
  /* `flex-col gap-2 rounded-2xl bg-surface p-2 shadow-xl` */
  card: {
    gap: 8,
    padding: 8,
    borderRadius: radius["2xl"],
    shadowColor: "#24264d",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  tool: { width: 36, height: 36, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.4 },
  bottom: { flexDirection: "row", alignItems: "center", gap: 12 },
  // O'ram 32px (halqa uchun), doiralar markazlari orasi vebdagidek 30px.
  colors: { flexDirection: "row", alignItems: "center", gap: -2 },
  /* `size-6` + `ring-2 ring-offset-2` */
  swatchRing: { width: 32, height: 32, borderRadius: radius.full, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  swatch: { width: 24, height: 24, borderRadius: radius.full },
  divider: { width: 1, height: 24 },
  widths: { flexDirection: "row", alignItems: "center", gap: 4 },
  width: { width: 40, height: 36, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  widthBar: { width: 20, borderRadius: radius.full },
});
