import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import type { Point, StrokeDto, StrokeInput } from "../api/board.dto";
import { Button, Input, MIN_TOUCH_SIZE, radius, Sheet, Text, useTheme } from "@/shared/ui";
import { nextFlowPoint } from "../lib/board-flow";
import {
  bohrDiagramSize,
  buildBohrStrokes,
  buildElementCardStrokes,
  elementCardHeight,
} from "../lib/periodic-board";
import { usePeriodicTable } from "../model/board.queries";

/**
 * Davriy jadval — element kartasini yoki Bor modelini doskaga qo'yadi.
 *
 * CHIZISH MANTIQI KO'CHIRILGAN: `lib/periodic-board.ts` element kartasini
 * ham, Bor modelini ham tayyor chizmalar (`StrokeInput[]`) ko'rinishida
 * qaytaradi, `lib/board-flow.ts` esa ularni doskada bo'sh joyga joylaydi.
 * Shuning uchun mobil va veb AYNAN BIR XIL rasm chizadi.
 *
 * 🟡 VEB'DAN FARQ — KO'RINISH.
 *
 * Veb elementlarni haqiqiy davriy jadval panjarasida (18 ustun) ko'rsatadi.
 * Telefon ekranida 18 ustun o'qilmaydi: har katak ~20px bo'lib, belgi ham
 * sig'maydi. Shuning uchun mobilda QIDIRUVLI RO'YXAT — o'qituvchi element
 * nomini yoki belgisini yozadi. Tanlangach tafsilotlar va ikkita tugma
 * chiqadi.
 */
export interface PeriodicTableSheetProps {
  open: boolean;
  onClose: () => void;
  /** Doskadagi mavjud chizmalar — bo'sh joyni topish uchun. */
  strokes: readonly StrokeDto[];
  boardWidth: number;
  boardHeight: number;
  color: string;
  onPlace: (strokes: StrokeInput[]) => void;
}

export function PeriodicTableSheet({
  open,
  onClose,
  strokes,
  boardWidth,
  boardHeight,
  color,
  onPlace,
}: PeriodicTableSheetProps) {
  const { palette } = useTheme();
  const elements = usePeriodicTable(open);
  const [query, setQuery] = useState("");
  const [selectedZ, setSelectedZ] = useState<number | null>(null);

  const list = useMemo(() => {
    const all = elements.data ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(
      (element) =>
        element.name.toLowerCase().includes(needle) ||
        element.symbol.toLowerCase().includes(needle) ||
        String(element.z) === needle
    );
  }, [elements.data, query]);

  const selected = (elements.data ?? []).find((element) => element.z === selectedZ) ?? null;
  const placement = { color, boardWidth, boardHeight, electronLabel: "e" };

  function place(build: (origin: Point) => StrokeInput[], blockHeight: number) {
    const origin = nextFlowPoint([...strokes], { boardWidth, boardHeight, blockHeight });
    const next = build(origin);
    if (!next.length) return;
    onPlace(next);
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Davriy jadval"
      description="Elementni tanlang — tuzilishi va Bor modeli ko'rinadi."
    >
      <Input
        placeholder="Element, belgi yoki raqam"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      {elements.isLoading ? (
        <Text variant="caption" tone="muted">
          Jadval yuklanmoqda…
        </Text>
      ) : null}

      {elements.isError ? (
        <Text variant="caption" style={{ color: palette["destructive-strong"] }}>
          Davriy jadvalni yuklab bo'lmadi
        </Text>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {list.slice(0, 40).map((element) => (
          <Pressable
            key={element.z}
            accessibilityRole="button"
            accessibilityState={{ selected: element.z === selectedZ }}
            onPress={() => setSelectedZ(element.z)}
            style={[
              styles.cell,
              {
                borderColor: element.z === selectedZ ? palette.primary : palette.border,
                backgroundColor:
                  element.z === selectedZ ? palette["primary-tint"] : palette.surface,
              },
            ]}
          >
            <Text variant="caption" tone="muted">
              {element.z}
            </Text>
            <Text variant="label">{element.symbol}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {selected ? (
        <View style={[styles.detail, { borderColor: palette.border }]}>
          <Text variant="subheading">
            {selected.name} ({selected.symbol})
          </Text>
          <Text variant="caption" tone="muted">
            Atom raqami: {selected.z} · Massa: {selected.mass}
          </Text>
          <Text variant="caption" tone="muted">
            Davr: {selected.period} · Guruh: {selected.group}
          </Text>
          <Text variant="caption" tone="muted">
            {selected.shells.length
              ? `Elektron qatlamlari: ${selected.shells.join(", ")}`
              : "Bu element uchun elektron qatlamlari ma'lumoti yo'q."}
          </Text>

          <Button
            title="Doskaga qo'yish"
            onPress={() =>
              place(
                (origin) => buildElementCardStrokes(selected, placement, origin),
                elementCardHeight(selected)
              )
            }
          />
          {selected.shells.length ? (
            <Button
              title="Bor modelini chizish"
              variant="secondary"
              onPress={() =>
                place(
                  (origin) => buildBohrStrokes(selected, placement, origin),
                  bohrDiagramSize(selected, placement)
                )
              }
            />
          ) : null}
        </View>
      ) : (
        <Text variant="caption" tone="muted">
          Batafsil ma'lumot uchun elementni tanlang.
        </Text>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  cell: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  detail: {
    gap: 6,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
});
