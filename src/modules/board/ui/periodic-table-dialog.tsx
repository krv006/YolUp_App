import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { bodyFont, DsText, dsRadius, dsType, Icon, MobileButton, Sheet, useDs, type Ds } from "@/shared/ui";
import type { PeriodicElement, StrokeDto, StrokeInput } from "../api/board.dto";
import { nextFlowPoint } from "../lib/board-flow";
import { bohrDiagramSize, buildBohrStrokes, buildElementCardStrokes, elementCardHeight } from "../lib/periodic-board";
import { useAddStrokes, usePeriodicTable } from "../model/board.queries";

export interface PeriodicTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dars doskasi uchun: chiziqlar serverga shu dars orqali yoziladi. Uy vazifasi doskasida `onPlace` beriladi. */
  lessonId?: string;
  /** Berilsa — chiziqlar serverga yozilmaydi, shu funksiyaga uzatiladi (uy vazifasi doskasi). */
  onPlace?: (strokes: StrokeInput[]) => void;
  sheet: number;
  canDraw: boolean;
  color: string;
  boardWidth: number;
  boardHeight: number;
  strokes: StrokeDto[];
}

const LANTHANIDE_RANGE = [57, 71] as const;
const ACTINIDE_RANGE = [89, 103] as const;
const COLUMNS = 18;
/** Katak — `h-[22px] gap-px`. */
const CELL_HEIGHT = 22;
const CELL_GAP = 1;
/** 1–7 davrlar, bo'sh 8-qator (CSS grid'da balandligi 0, faqat oraliq qoladi), 9–10 lantanoid va aktinoidlar. */
const GRID_HEIGHT = 9 * CELL_HEIGHT + 9 * CELL_GAP;

function isInRange(z: number, range: readonly [number, number]): boolean {
  return z >= range[0] && z <= range[1];
}

function cellPosition(element: PeriodicElement): { column: number; row: number } | null {
  if (isInRange(element.z, LANTHANIDE_RANGE)) return { column: element.z - LANTHANIDE_RANGE[0] + 3, row: 9 };
  if (isInRange(element.z, ACTINIDE_RANGE)) return { column: element.z - ACTINIDE_RANGE[0] + 3, row: 10 };
  if (!element.group || !element.period) return null;
  return { column: element.group, row: element.period };
}

/** Veb `form-skin.css` dagi `.periodic-chip--*` fonlari. */
function chipColor(category: string, ds: Ds): string {
  const colors: Record<string, string> = {
    alkali: "#ffe5e0",
    alkaline_earth: "#fdefcf",
    transition: "#fdeeee",
    post_transition: "#e8ebf0",
    metalloid: ds.c["accent-teal-bg"],
    nonmetal: "#dbf2e0",
    halogen: "#eef2ff",
    noble_gas: "#e8e0ff",
    lanthanide: "#ffe6f6",
    actinide: "#ffe3e0",
  };
  return colors[category] ?? ds.c.subtle;
}

/** 8-qator bo'sh — undan keyingilar bir katak yuqoriga suriladi. */
function rowTop(row: number): number {
  const index = row > 8 ? row - 2 : row - 1;
  return index * (CELL_HEIGHT + CELL_GAP) + (row > 8 ? CELL_GAP : 0);
}

/**
 * Davriy jadval — veb `periodic-table-dialog.tsx` (tor ekran): qidiruv,
 * 18 ustunli panjara (mos kelmaganlari xiralashadi), tanlangan element
 * kartasi; pastda "Bor modeli" va "Kartani qo'yish".
 */
export function PeriodicTableDialog({ open, onOpenChange, lessonId, onPlace, sheet, canDraw, color, boardWidth, boardHeight, strokes }: PeriodicTableDialogProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  const table = usePeriodicTable(open);
  const addStrokes = useAddStrokes(lessonId ?? "");
  const [selectedZ, setSelectedZ] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [gridWidth, setGridWidth] = useState(0);
  const cellWidth = gridWidth ? (gridWidth - (COLUMNS - 1) * CELL_GAP) / COLUMNS : 0;

  const elements = useMemo(() => table.data ?? [], [table.data]);
  const selected = useMemo(() => elements.find((element) => element.z === selectedZ) ?? null, [elements, selectedZ]);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return null;
    return new Set(
      elements
        .filter(
          (element) =>
            element.symbol.toLowerCase() === term ||
            element.symbol.toLowerCase().startsWith(term) ||
            element.name.toLowerCase().includes(term) ||
            element.latinName.toLowerCase().includes(term) ||
            String(element.z) === term
        )
        .map((element) => element.z)
    );
  }, [elements, query]);

  const placement = { color, boardWidth, boardHeight, electronLabel: t("periodic.electronSuffix") };

  function place(build: (origin: [number, number]) => StrokeInput[], blockHeight: number) {
    const origin = nextFlowPoint(strokes, { boardWidth, boardHeight, blockHeight });
    const next = build(origin);
    if (!next.length) return;
    if (onPlace) {
      onPlace(next);
      onOpenChange(false);
      return;
    }
    addStrokes.mutate({ sheet, strokes: next }, { onSuccess: () => onOpenChange(false) });
  }

  const placeCard = () => selected && place((origin) => buildElementCardStrokes(selected, placement, origin), elementCardHeight(selected));
  const placeBohr = () => selected && place((origin) => buildBohrStrokes(selected, placement, origin), bohrDiagramSize(selected, placement));

  const mass = selected?.mass.replace(".", ",") ?? "";

  return (
    <Sheet
      variant="app"
      compact
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("periodic.title")}
      description={t("periodic.description")}
      footer={
        <>
          <MobileButton
            variant="secondary"
            label={t("periodic.placeBohr")}
            disabled={!selected || !canDraw || !selected.shells.length || addStrokes.isPending}
            onPress={placeBohr}
          />
          <MobileButton label={t("periodic.placeCard")} disabled={!selected || !canDraw || addStrokes.isPending} onPress={placeCard} />
        </>
      }
    >
      {table.isLoading ? (
        <DsText v="body-sm" c="ink-tertiary" style={styles.loading}>
          {t("periodic.loading")}
        </DsText>
      ) : null}
      {table.isError ? (
        <DsText v="body-sm" c="error-text" style={[styles.error, { backgroundColor: ds.c["error-bg"] }]}>
          {t("periodic.loadError")}
        </DsText>
      ) : null}

      {elements.length ? (
        <>
          <View style={[styles.search, { backgroundColor: ds.c.subtle }]}>
            <Icon name="search" size={20} color={ds.c["ink-secondary"]} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("periodic.searchMobile")}
              placeholderTextColor={ds.c["ink-secondary"]}
              accessibilityLabel={t("periodic.searchMobile")}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.searchInput, { color: ds.c.ink }]}
            />
          </View>

          <View accessibilityLabel={t("periodic.title")} style={styles.grid} onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
            {cellWidth
              ? elements.map((element) => {
                  const position = cellPosition(element);
                  if (!position) return null;
                  const active = element.z === selectedZ;
                  const dimmed = matches ? !matches.has(element.z) : false;
                  return (
                    <Pressable
                      key={element.z}
                      accessibilityRole="button"
                      accessibilityLabel={element.name}
                      accessibilityState={{ selected: active }}
                      onPress={() => setSelectedZ(element.z)}
                      style={[
                        styles.cell,
                        {
                          left: (position.column - 1) * (cellWidth + CELL_GAP),
                          top: rowTop(position.row),
                          width: cellWidth,
                          backgroundColor: active ? ds.c.brand : chipColor(element.category, ds),
                        },
                        dimmed && styles.dimmed,
                      ]}
                    >
                      <DsText v="caption-strong" c={active ? "on-action" : "ink"} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {element.symbol}
                      </DsText>
                    </Pressable>
                  );
                })
              : null}
          </View>

          <DsText v="body-xs" c="ink-secondary" style={styles.note}>
            {t("periodic.tableNote", { count: elements.length })}
          </DsText>

          {selected ? (
            <View style={[styles.detail, { backgroundColor: ds.c.canvas }]}>
              <View style={[styles.symbol, { backgroundColor: chipColor(selected.category, ds) }]}>
                <DsText v="caption" w="400" c="ink-secondary">
                  {selected.z}
                </DsText>
                <DsText v="h1" heading w="700" style={styles.symbolText}>
                  {selected.symbol}
                </DsText>
              </View>
              <View style={styles.grow}>
                <DsText v="title">
                  {selected.name}
                  {selected.appearance ? ` · ${selected.appearance}` : ""}
                </DsText>
                <DsText v="body-sm" c="ink-secondary" style={styles.detailLine}>
                  {[
                    selected.latinName,
                    t(`periodic.categories.${selected.category}`, { defaultValue: "" }),
                    [
                      selected.period ? t("periodic.periodShort", { value: selected.period }) : "",
                      selected.group ? t("periodic.groupShort", { value: selected.group }) : "",
                    ]
                      .filter(Boolean)
                      .join(", "),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </DsText>
                <DsText v="caption" w="400" c="ink-secondary" style={styles.detailLine}>
                  {[mass ? t("periodic.massMobile", { value: mass }) : "", selected.shells.length ? `${t("periodic.shells")} ${selected.shells.join(" · ")}` : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </DsText>
              </View>
            </View>
          ) : (
            <DsText v="body-sm" c="ink-tertiary">
              {t("periodic.pickHint")}
            </DsText>
          )}
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  loading: { paddingVertical: 24, textAlign: "center" },
  error: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl, overflow: "hidden" },
  /* `-mt-[3px] h-11 rounded-xl px-5 gap-2.5` */
  search: { marginTop: -3, height: 44, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, borderRadius: dsRadius.xl },
  searchInput: { flex: 1, minWidth: 0, height: "100%", padding: 0, fontFamily: bodyFont("400"), fontSize: dsType["label-lg"].fontSize },
  grid: { marginTop: -4, height: GRID_HEIGHT },
  cell: { position: "absolute", height: CELL_HEIGHT, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  dimmed: { opacity: 0.3 },
  note: { marginTop: -4 },
  /* `-mt-1.5 gap-3 rounded-xl px-4 py-[15px]`, belgi `size-16 rounded-xl` */
  detail: { marginTop: -6, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 15, borderRadius: dsRadius.xl },
  symbol: { width: 64, height: 64, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  symbolText: { lineHeight: 28 },
  detailLine: { marginTop: 3 },
});
