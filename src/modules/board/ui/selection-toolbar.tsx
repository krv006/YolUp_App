import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react-native";
import { DsText, dsRadius, useDs } from "@/shared/ui";
import type { StrokeDto } from "../api/board.dto";
import { BOARD_COLORS, BOARD_SIZE_LIMITS, BOARD_WIDTHS } from "../constants/board.constants";
import { strokeSize } from "../lib/board-edit";

export interface SelectionToolbarProps {
  stroke: StrokeDto;
  onEdit?: () => void;
  onChange: (changes: Record<string, unknown>) => void;
  onDelete: () => void;
}

const SIZE_STEP = 2;

/**
 * Tanlangan element paneli — veb `selection-toolbar.tsx` ning `docked`
 * (telefon) ko'rinishi: pastki asboblar ustida, gorizontal aylanadigan
 * qator — tahrirlash, rang, shrift o'lchami (−/+) yoki chiziq qalinligi,
 * o'chirish. Suzuvchi (desktop) joylashuv mobilda yo'q.
 */
export function SelectionToolbar({ stroke, onEdit, onChange, onDelete }: SelectionToolbarProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  const size = strokeSize(stroke);
  const color = (stroke.color ?? "").toLowerCase();

  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel={t("edit.toolbar")}
      style={[styles.root, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.sm }]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.row}
      >
        {onEdit ? (
          <Pressable
            accessibilityRole="button"
            onPress={onEdit}
            style={({ pressed }) => [styles.edit, pressed && { backgroundColor: ds.c.subtle }]}
          >
            <Pencil size={15} color={ds.c.ink} />
            <DsText v="caption-strong">{t("edit.edit")}</DsText>
          </Pressable>
        ) : null}

        <View style={styles.group}>
          {BOARD_COLORS.map((value) => {
            const active = color === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={t("tools.colorLabel", { value })}
                accessibilityState={{ selected: active }}
                onPress={() => onChange({ color: value })}
                style={[styles.swatch, active && { borderColor: ds.c.brand }]}
              >
                <View style={[styles.dot, { backgroundColor: value }]} />
              </Pressable>
            );
          })}
        </View>

        {size !== null ? (
          <View style={[styles.group, styles.divided, { borderLeftColor: ds.c.line }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("edit.sizeDown")}
              disabled={size <= BOARD_SIZE_LIMITS.min}
              onPress={() => onChange({ size: Math.max(BOARD_SIZE_LIMITS.min, size - SIZE_STEP) })}
              style={({ pressed }) => [
                styles.button,
                pressed && { backgroundColor: ds.c.subtle },
                size <= BOARD_SIZE_LIMITS.min && styles.faded,
              ]}
            >
              <Minus size={15} color={ds.c["ink-secondary"]} />
            </Pressable>
            <DsText v="caption-strong" style={styles.value}>
              {size}
            </DsText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("edit.sizeUp")}
              disabled={size >= BOARD_SIZE_LIMITS.max}
              onPress={() => onChange({ size: Math.min(BOARD_SIZE_LIMITS.max, size + SIZE_STEP) })}
              style={({ pressed }) => [
                styles.button,
                pressed && { backgroundColor: ds.c.subtle },
                size >= BOARD_SIZE_LIMITS.max && styles.faded,
              ]}
            >
              <Plus size={15} color={ds.c["ink-secondary"]} />
            </Pressable>
          </View>
        ) : (
          <View style={[styles.group, styles.divided, { borderLeftColor: ds.c.line }]}>
            {BOARD_WIDTHS.map((value) => {
              const active = stroke.width === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={t("tools.widthLabel", { value })}
                  accessibilityState={{ selected: active }}
                  onPress={() => onChange({ width: value })}
                  style={[styles.button, active && { backgroundColor: ds.c["brand-subtle"] }]}
                >
                  <View
                    style={[
                      styles.widthBar,
                      { height: Math.min(value, 8), backgroundColor: ds.c.ink },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("edit.delete")}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.button,
            styles.divided,
            { borderLeftColor: ds.c.line },
            pressed && { backgroundColor: ds.c["danger-bg"] },
          ]}
        >
          <Trash2 size={15} color={ds.c["error-text"]} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  /* `w-full rounded-2xl bg-surface p-1 shadow-sm overflow-x-auto` */
  root: { borderRadius: dsRadius["2xl"], overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
  edit: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: dsRadius.md,
  },
  group: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 4 },
  divided: { borderLeftWidth: 1 },
  /* Rang — `size-7 rounded-full`, faol `ring-2 ring-brand` */
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 20, height: 20, borderRadius: 10 },
  button: {
    width: 32,
    height: 32,
    borderRadius: dsRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { minWidth: 32, textAlign: "center" },
  widthBar: { width: 16, borderRadius: 4 },
  faded: { opacity: 0.4 },
});
