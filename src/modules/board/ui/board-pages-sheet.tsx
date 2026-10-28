import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Canvas, Group } from "@shopify/react-native-skia";
import { Plus } from "lucide-react-native";
import { bodyFont, DsText, dsRadius, dsType, MobileButton, Sheet, useDs } from "@/shared/ui";
import type { BoardSheet } from "../api/board.dto";
import { BoardStroke, useBoardFont } from "./board-stroke";

/** Eskiz balandligi — `max-lg:h-28`. */
const THUMB_HEIGHT = 112;
const GAP = 12;

export interface BoardPagesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheets: BoardSheet[];
  active: number;
  boardWidth: number;
  boardHeight: number;
  canAdd: boolean;
  /** O'qituvchi sahifa nomini tahrirlashi mumkin. */
  canRename?: boolean;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRename?: (index: number, title: string) => void;
}

/**
 * Sahifalar — veb `board-pages-sheet.tsx` (tor ekran): ikki ustunli eskizlar
 * (`xMidYMin slice` — eni to'ladi, tepadan), raqam va nom (o'qituvchi
 * tahrirlaydi), pastda "Yangi sahifa".
 */
export function BoardPagesSheet({
  open,
  onOpenChange,
  sheets,
  active,
  boardWidth,
  boardHeight,
  canAdd,
  canRename = false,
  onSelect,
  onAdd,
  onRename,
}: BoardPagesSheetProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  const font = useBoardFont();
  const [gridWidth, setGridWidth] = useState(0);
  const cell = gridWidth ? (gridWidth - GAP) / 2 : 0;
  const scale = cell ? Math.max(cell / Math.max(1, boardWidth), THUMB_HEIGHT / Math.max(1, boardHeight)) : 0;
  const offsetX = (cell - boardWidth * scale) / 2;

  return (
    <Sheet
      variant="app"
      compact
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("pages.title")}
      description={t("pages.hint")}
      footer={canAdd ? <MobileButton label={t("pages.new")} onPress={onAdd} /> : undefined}
    >
      <View style={styles.grid} onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
        {sheets.map((item) => {
          const current = item.index === active;
          const fallback = item.strokes.length ? t("pages.pageLabel", { index: item.index + 1 }) : t("pages.emptyPage");
          return (
            <Pressable key={item.index} accessibilityRole="button" onPress={() => onSelect(item.index)} style={[styles.page, { width: cell || "48%" }]}>
              <View style={[styles.thumb, current ? { borderWidth: 2, borderColor: ds.c.brand } : { borderColor: ds.c.line }, { backgroundColor: ds.c.surface }]}>
                {!item.strokes.length ? (
                  <View style={styles.plus}>
                    <Plus size={22} strokeWidth={1.5} color={ds.c["icon-tertiary"]} />
                  </View>
                ) : scale ? (
                  <Canvas style={styles.fill}>
                    <Group transform={[{ translateX: offsetX }, { scale }]}>
                      {item.strokes.map((stroke) => (
                        <BoardStroke key={stroke.id} stroke={stroke} font={font} />
                      ))}
                    </Group>
                  </Canvas>
                ) : null}
              </View>
              <View style={styles.caption}>
                <View style={[styles.number, { backgroundColor: current ? ds.c.brand : ds.c.subtle }]}>
                  <DsText v="caption-strong" c={current ? "on-action" : "ink"}>
                    {item.index + 1}
                  </DsText>
                </View>
                {canRename && onRename ? (
                  <TextInput
                    defaultValue={item.title}
                    placeholder={fallback}
                    placeholderTextColor={ds.c["ink-tertiary"]}
                    accessibilityLabel={t("pages.renameAria", { index: item.index + 1 })}
                    returnKeyType="done"
                    onEndEditing={(event) => {
                      const next = event.nativeEvent.text.trim();
                      if (next !== item.title) onRename(item.index, next);
                    }}
                    style={[styles.rename, { color: ds.c.ink }]}
                  />
                ) : (
                  <DsText v="body-xs" w="500" numberOfLines={1} style={styles.grow}>
                    {item.title || fallback}
                  </DsText>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  fill: { flex: 1 },
  /* `grid-cols-2 gap-3 -mt-[3px]` */
  grid: { marginTop: -3, flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: GAP },
  page: { gap: 8 },
  thumb: { height: THUMB_HEIGHT, overflow: "hidden", borderWidth: 1, borderRadius: dsRadius.lg },
  plus: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  caption: { flexDirection: "row", alignItems: "center", gap: 6 },
  number: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rename: { flex: 1, minWidth: 0, padding: 0, fontFamily: bodyFont("500"), fontSize: dsType["body-xs"].fontSize },
});
