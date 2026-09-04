import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Circle,
  Highlighter,
  MousePointer2,
  MoveRight,
  Pencil,
  Slash,
  Square,
  Sigma,
  Type,
} from "lucide-react-native";
import { MIN_TOUCH_SIZE, radius, Text, useTheme } from "@/shared/ui";
import { BOARD_COLORS, BOARD_WIDTHS } from "../constants/board.constants";
import type { DrawKind } from "../lib/board.geometry";

/** Veb `board-toolbar.tsx` bilan bir xil tur — `use-board-drawing` shunga tayanadi. */
export type BoardTool = DrawKind | "text" | "math" | "select";

interface ToolDefinition {
  id: BoardTool;
  label: string;
  icon: typeof Pencil;
  /** Faqat matematika kurslarida (`math_enabled`). */
  mathOnly?: boolean;
}

const TOOLS: readonly ToolDefinition[] = [
  { id: "pen", label: "Qalam", icon: Pencil },
  { id: "marker", label: "Marker", icon: Highlighter },
  { id: "line", label: "Chiziq", icon: Slash },
  { id: "arrow", label: "Strelka", icon: MoveRight },
  { id: "rect", label: "To'rtburchak", icon: Square },
  { id: "ellipse", label: "Ellips", icon: Circle },
  { id: "text", label: "Matn", icon: Type },
  { id: "math", label: "Formula", icon: Sigma, mathOnly: true },
  { id: "select", label: "Tanlash", icon: MousePointer2 },
];

export interface BoardToolbarProps {
  tool: BoardTool;
  onToolChange: (tool: BoardTool) => void;
  color: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  /** Formula vositasi faqat matematika kurslarida ko'rinadi (docs/PROJECT.md §5.3). */
  mathEnabled: boolean;
  disabled?: boolean;
}

/**
 * Asboblar paneli. Veb'da u doskaning yon tomonida edi; mobilda pastda,
 * gorizontal skroll bilan — bosh barmoq yetadigan joyda.
 */
export function BoardToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  mathEnabled,
  disabled = false,
}: BoardToolbarProps) {
  const { palette } = useTheme();
  const tools = TOOLS.filter((item) => !item.mathOnly || mathEnabled);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: palette.surface, borderTopColor: palette.border },
        disabled && styles.disabled,
      ]}
      pointerEvents={disabled ? "none" : "auto"}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tools.map(({ id, label, icon: Icon }) => {
          const active = tool === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              onPress={() => onToolChange(id)}
              style={[
                styles.tool,
                { backgroundColor: active ? palette.primary : palette.secondary },
              ]}
            >
              <Icon
                size={20}
                color={active ? palette["primary-foreground"] : palette["muted-foreground"]}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.optionsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {BOARD_COLORS.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`Rang ${item}`}
              accessibilityState={{ selected: color === item }}
              onPress={() => onColorChange(item)}
              style={styles.colorHit}
            >
              <View
                style={[
                  styles.color,
                  {
                    backgroundColor: item,
                    borderColor: color === item ? palette.foreground : palette.border,
                    borderWidth: color === item ? 2.5 : 1,
                  },
                ]}
              />
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.widths}>
          {BOARD_WIDTHS.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`Qalinlik ${item}`}
              accessibilityState={{ selected: strokeWidth === item }}
              onPress={() => onStrokeWidthChange(item)}
              style={styles.widthHit}
            >
              <View
                style={[
                  styles.widthDot,
                  {
                    width: item * 2 + 4,
                    height: item * 2 + 4,
                    borderRadius: item + 2,
                    backgroundColor:
                      strokeWidth === item ? palette["primary-text"] : palette["muted-foreground"],
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {disabled ? (
        <Text variant="caption" tone="muted" style={styles.notice}>
          Chizish uchun o'qituvchidan ruxsat so'rang.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 6, gap: 4 },
  disabled: { opacity: 0.5 },
  row: { gap: 8, paddingHorizontal: 12 },
  tool: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  colorHit: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  color: { width: 24, height: 24, borderRadius: 12 },
  widths: { flexDirection: "row", paddingRight: 12, gap: 2 },
  widthHit: { width: 34, height: 36, alignItems: "center", justifyContent: "center" },
  widthDot: {},
  notice: { textAlign: "center", paddingBottom: 4 },
});
