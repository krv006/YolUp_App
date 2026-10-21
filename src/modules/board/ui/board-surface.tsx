import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useKeepAwake } from "expo-keep-awake";
import { Atom, Calculator, Eye, FilePlus2, Pencil, UserCheck } from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { useCourseStudents } from "@/modules/course";
import type { FormulaSolutionDto, Point, StrokeShapeDto, TextLineDto } from "../api/board.dto";
import { BOARD_COLORS, BOARD_TEXT_SIZE, BOARD_WIDTHS } from "../constants/board.constants";
import { hasRichFormatting } from "../lib/rich-text";
import {
  useAddSheet,
  useAddStroke,
  useBoard,
  useEraseStrokes,
  useGrantDraw,
  useSolveFormula,
} from "../model/board.queries";
import { useBoardRealtime } from "../model/use-board-realtime";
import { BoardCanvas } from "./board-canvas";
import { BoardPagesSheet, BoardPermissionSheet, EraseReasonSheet } from "./board-dialogs";
import { MathFieldSheet } from "./math-field-sheet";
import { RichTextSheet } from "./rich-text-sheet";
import { PeriodicTableSheet } from "./periodic-table-sheet";
import { BoardToolbar, type BoardTool } from "./board-toolbar";
import { Button, Input, radius, Sheet, Text, ThemeScope, toast, useTheme } from "@/shared/ui";

export interface BoardSurfaceProps {
  lessonId: string;
  /** Kurs — "chizishga ruxsat" ro'yxati uchun (veb `BoardPanel` ham shunday). */
  courseId?: string | null;
  /** Holat yonidagi izoh, masalan "Dars tugagan" (veb `statusNote`). */
  statusNote?: string;
  /** Doska ustida, o'ng pastdagi amallar — arxiv sahifasi (veb `footerActions`). */
  footerActions?: ReactNode;
}

/** Veb qorong'i `--success` (`bg-success`) — "Jonli" nuqtasi. */
const LIVE_DOT = "#35c493";
/** Veb `legacy.css` `.board-panel`: `--surface` va `--border` (qorong'i). */
const PANEL_BG = "#161c23";
const PANEL_BORDER = "#26313d";

/**
 * Dars doskasi — veb `modules/board/ui/board-panel.tsx` ning mobil porti.
 *
 * Tuzilishi vebdagidek: tepada holat qatori ("Chizish mumkin", "Jonli",
 * sahifa, yechuvchi, davriy jadval, ruxsat), ostida oq kanvas kartasi va
 * uning pastida suzib turgan asboblar. Chizish Skia'da (vebda SVG).
 *
 * Real-time (`useBoardRealtime`) 🟢 veb'dan: kelgan hodisalar react-query
 * keshiga qo'llanadi; kanal ulanmasa `useBoard` pollingga qaytadi.
 */
export function BoardSurface({ lessonId, courseId = null, statusNote, footerActions }: BoardSurfaceProps) {
  const { t } = useTranslation("board");
  const { t: tm } = useTranslation("mobile");
  const { palette } = useTheme();
  const { user } = useAuth();

  // Doskada ishlayotganda ekran o'chib qolmasin.
  useKeepAwake();

  const realtime = useBoardRealtime(lessonId ?? "", Boolean(lessonId), user?.id ?? null);
  const board = useBoard(lessonId ?? "", { enabled: Boolean(lessonId), live: realtime.connected });
  const addStroke = useAddStroke(lessonId ?? "");
  const addSheet = useAddSheet(lessonId ?? "");
  const erase = useEraseStrokes(lessonId ?? "");
  const grant = useGrantDraw(lessonId ?? "");
  const solve = useSolveFormula(lessonId ?? "");

  const [sheet, setSheet] = useState(0);
  const [tool, setTool] = useState<BoardTool>("pen");
  const [color, setColor] = useState<string>(BOARD_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState<number>(BOARD_WIDTHS[1]);
  const [selected, setSelected] = useState<string | null>(null);

  const [placement, setPlacement] = useState<{ tool: "text" | "math"; point: Point } | null>(null);
  const [periodicOpen, setPeriodicOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [formula, setFormula] = useState("");
  const [solution, setSolution] = useState<FormulaSolutionDto | null>(null);

  const state = board.data;
  const members = useCourseStudents(board.data?.isTeacher ? courseId : null, { page_size: 100 });
  const active = state?.sheets.find((item) => item.index === sheet) ?? state?.sheets[0];
  const canDraw = Boolean(state?.canDraw);

  /**
   * Chizmani real-time kanal orqali yuboramiz — server uni darhol hammaga
   * tarqatadi. Kanal yopiq bo'lsa REST ishlatiladi. 🟢 Veb bilan bir xil.
   */
  function commitStroke(stroke: StrokeShapeDto) {
    if (!realtime.sendStroke(sheet, stroke)) addStroke.mutate({ sheet, stroke });
  }

  /**
   * MATN va FORMULA — HTTP orqali, soket orqali EMAS: soket faqat chizma
   * strokelarini saqlaydi, matn yuborilsa jimgina yo'qolardi. Veb ham
   * matnni `addStroke.mutate` bilan yuboradi.
   */
  function commitTextStroke(stroke: StrokeShapeDto) {
    addStroke.mutate({ sheet, stroke }, { onError: (error: Error) => toast.error(error.message) });
  }

  function placeMath(latex: string) {
    if (!placement) return;
    commitTextStroke({ type: "math", latex, x: placement.point[0], y: placement.point[1], size: BOARD_TEXT_SIZE, color });
    setPlacement(null);
  }

  /** `lines` FAQAT haqiqiy format bo'lganda yuboriladi (veb ham shunday). */
  function placeRichText(lines: TextLineDto[], plainText: string) {
    if (!placement) return;
    commitTextStroke({
      type: "text",
      text: plainText,
      ...(hasRichFormatting(lines) ? { lines } : {}),
      x: placement.point[0],
      y: placement.point[1],
      size: BOARD_TEXT_SIZE,
      color,
    });
    setPlacement(null);
  }

  /** Formulani serverga yechtirish (SymPy). Xatoni mutatsiya o'zi ko'rsatadi. */
  async function solveFormula() {
    if (!formula.trim()) return;
    try {
      setSolution(await solve.mutateAsync(formula.trim()));
    } catch {
      /* `onError` toast chiqaradi — bu yerda ikkinchi marta emas. */
    }
  }

  function placeSolution() {
    if (!solution) return;
    const steps = solution.steps?.length ? `\n${solution.steps.join("\n")}` : "";
    commitTextStroke({ type: "text", text: `${solution.pretty}\n${solution.result}${steps}`, x: 60, y: 80, size: BOARD_TEXT_SIZE, color });
    setFormulaOpen(false);
    setFormula("");
    setSolution(null);
  }

  /** Veb `handleStrokeClick`: lastik bilan bosilgan element — sabab so'raladi. */
  function selectForErase(id: string | null) {
    if (!id || tool !== "erase" || !canDraw) return;
    setSelected(id);
    setReason("");
    setReasonOpen(true);
  }

  function closeReason() {
    setReasonOpen(false);
    setSelected(null);
    setReason("");
  }

  function submitErase() {
    if (!selected || !reason.trim()) return;
    erase.mutate(
      { sheet, strokeIds: [selected], reason: reason.trim() },
      {
        onSuccess: () => {
          closeReason();
          toast.success(t("eraseDialog.deleted"));
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  if (board.isLoading)
    return (
      <View style={styles.center}>
        <Text variant="label" style={[styles.regular, { color: palette["subtle-foreground"] }]}>
          {t("status.loading")}
        </Text>
      </View>
    );

  if (board.isError || !state)
    return (
      <View style={[styles.center, styles.gap]}>
        <Text variant="label" style={[styles.regular, { color: palette["muted-foreground"] }]}>
          {board.error?.message}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => void board.refetch()} style={[styles.retry, { backgroundColor: palette.primary }]}>
          <Text variant="label" style={{ color: palette["primary-foreground"] }}>
            {t("status.retry")}
          </Text>
        </Pressable>
      </View>
    );

  const chip = { backgroundColor: palette["surface-subtle"] };

  return (
    <View style={styles.root}>
      {/* `flex flex-wrap items-center gap-2` */}
      <View style={styles.status}>
        <View style={[styles.statusItem, styles.statusFirst]}>
          {canDraw ? <Pencil size={13} color={palette["success-strong"]} /> : <Eye size={13} color={palette["subtle-foreground"]} />}
          <Text variant="caption" style={[styles.strong, { color: canDraw ? palette["success-strong"] : palette["subtle-foreground"] }]}>
            {canDraw ? t("status.canDraw") : t("status.viewOnly")}
          </Text>
        </View>

        {statusNote ? (
          <View style={styles.statusItem}>
            <View style={[styles.dot, { backgroundColor: palette["subtle-foreground"] }]} />
            <Text variant="caption" style={[styles.strong, { color: palette["subtle-foreground"] }]}>
              {statusNote}
            </Text>
          </View>
        ) : (
          <View style={styles.statusItem}>
            <View style={[styles.dot, { backgroundColor: realtime.connected ? LIVE_DOT : palette["saffron-strong"] }]} />
            <Text variant="caption" style={[styles.strong, { color: palette["subtle-foreground"] }]}>
              {realtime.connected ? t("status.live") : t("status.slowMode")}
            </Text>
          </View>
        )}

        <View style={styles.grow} />

        <View style={styles.chips}>
          <Pressable accessibilityRole="button" onPress={() => setPagesOpen(true)} style={[styles.chip, chip]}>
            <FilePlus2 size={14} color={palette["muted-foreground"]} />
            <Text variant="caption" style={[styles.strong, { color: palette["muted-foreground"] }]}>
              #{(active?.index ?? sheet) + 1}
            </Text>
          </Pressable>
          {state.mathEnabled ? (
            <Pressable accessibilityRole="button" onPress={() => setFormulaOpen(true)} style={[styles.chip, chip]}>
              <Calculator size={14} color={palette["muted-foreground"]} />
              <Text variant="caption" style={[styles.strong, { color: palette["muted-foreground"] }]}>
                {t("solver.button")}
              </Text>
            </Pressable>
          ) : null}
          {state.chemistryEnabled ? (
            <Pressable accessibilityRole="button" onPress={() => setPeriodicOpen(true)} style={[styles.chip, chip]}>
              <Atom size={14} color={palette["muted-foreground"]} />
              <Text variant="caption" style={[styles.strong, { color: palette["muted-foreground"] }]}>
                {t("periodic.button")}
              </Text>
            </Pressable>
          ) : null}
          {state.isTeacher ? (
            <Pressable accessibilityRole="button" onPress={() => setGrantOpen(true)} style={[styles.chip, chip]}>
              <UserCheck size={14} color={palette["muted-foreground"]} />
              <Text variant="caption" style={[styles.strong, { color: palette["muted-foreground"] }]}>
                {t("permission.grantButton")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Kanvas vebda ham `data-theme="light"` — oq. */}
      <ThemeScope scheme="light">
        <CanvasCard>
          <BoardCanvas
            strokes={active?.strokes ?? []}
            width={state.width}
            height={state.height}
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            enabled={canDraw}
            onCommit={commitStroke}
            onPlacePoint={(point) => {
              if (tool !== "text" && tool !== "math") return;
              setPlacement({ tool, point });
            }}
            onSelectStroke={selectForErase}
            selectedStrokeId={selected}
          />

          {canDraw ? (
            <View style={styles.toolbar} pointerEvents="box-none">
              <BoardToolbar
                tool={tool}
                color={color}
                width={strokeWidth}
                canDraw={canDraw}
                onToolChange={(next) => {
                  setTool(next);
                  setSelected(null);
                }}
                onColorChange={setColor}
                onWidthChange={setStrokeWidth}
              />
            </View>
          ) : null}

          {footerActions ? <View style={styles.footerActions}>{footerActions}</View> : null}
        </CanvasCard>
      </ThemeScope>

      <ThemeScope scheme={null}>
        <EraseReasonSheet
          open={reasonOpen}
          pending={erase.isPending}
          reason={reason}
          onReasonChange={setReason}
          onCancel={closeReason}
          onConfirm={submitErase}
        />

        <BoardPagesSheet
          open={pagesOpen}
          onClose={() => setPagesOpen(false)}
          sheets={state.sheets}
          active={active?.index ?? sheet}
          boardWidth={state.width}
          boardHeight={state.height}
          canAdd={state.isTeacher}
          onSelect={(index) => {
            setSheet(index);
            setSelected(null);
            setPagesOpen(false);
          }}
          onAdd={() => addSheet.mutate()}
        />

        <BoardPermissionSheet
          open={grantOpen}
          onClose={() => setGrantOpen(false)}
          pending={grant.isPending}
          students={(members.data?.items ?? []).map(({ student }) => ({ id: student.id, name: student.name, username: student.username }))}
          onGrant={(studentIds) => {
            let done = 0;
            for (const studentId of studentIds)
              grant.mutate(studentId, {
                onSuccess: () => {
                  done += 1;
                  if (done === studentIds.length) {
                    toast.success(t("permissionDialog.saved", { count: studentIds.length }));
                    setGrantOpen(false);
                  }
                },
                onError: (error: Error) => toast.error(error.message),
              });
          }}
        />

        <RichTextSheet open={placement?.tool === "text"} onClose={() => setPlacement(null)} onSubmit={placeRichText} />
        <MathFieldSheet open={placement?.tool === "math"} onClose={() => setPlacement(null)} onSubmit={placeMath} />

        <PeriodicTableSheet
          open={periodicOpen}
          onClose={() => setPeriodicOpen(false)}
          strokes={active?.strokes ?? []}
          boardWidth={state.width}
          boardHeight={state.height}
          color={color}
          onPlace={(next) => next.forEach((stroke) => commitStroke(stroke))}
        />

        {/* Formula yechuvchi — server SymPy bilan yechadi, natija doskaga qo'yiladi. */}
        <Sheet
          open={formulaOpen}
          onClose={() => setFormulaOpen(false)}
          title={tm("board.formula_yordamchisi")}
          description={tm("board.masalan_2x_2_5x_3_0")}
        >
          <Input
            label={tm("board.formula")}
            value={formula}
            onChangeText={(value) => {
              setFormula(value);
              setSolution(null);
            }}
            placeholder={tm("board.2x_2_5x_3_0")}
            autoFocus
          />
          {solution ? (
            <View style={[styles.solution, { backgroundColor: palette.muted }]}>
              <Text variant="caption" tone="muted" style={styles.mono}>
                {solution.pretty}
              </Text>
              <Text variant="label">{solution.result}</Text>
              {solution.steps?.map((step) => (
                <Text key={step} variant="caption" tone="muted">
                  {step}
                </Text>
              ))}
            </View>
          ) : null}
          <Button
            title={tm("board.yechish")}
            variant="secondary"
            loading={solve.isPending}
            disabled={!formula.trim()}
            onPress={() => void solveFormula()}
          />
          {solution && canDraw ? <Button title={tm("board.doskaga_qoyish")} onPress={placeSolution} /> : null}
        </Sheet>
      </ThemeScope>
    </View>
  );
}

/** `relative flex-1 overflow-hidden rounded-2xl bg-surface` */
function CanvasCard({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  return <View style={[styles.card, { backgroundColor: palette.surface }]}>{children}</View>;
}

const styles = StyleSheet.create({
  /* `.board-panel`: chegarali qorong'i ramka, ichida holat qatori va kanvas. */
  root: { flex: 1, gap: 12, overflow: "hidden", borderWidth: 1, borderColor: PANEL_BORDER, borderRadius: 16, backgroundColor: PANEL_BG },
  grow: { flex: 1 },
  gap: { gap: 12 },
  regular: { fontWeight: "400" },
  strong: { fontWeight: "600" },
  center: { flex: 1, minHeight: 320, alignItems: "center", justifyContent: "center" },
  retry: { height: 44, justifyContent: "center", paddingHorizontal: 20, borderRadius: radius.full },
  status: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  statusItem: { height: 32, flexDirection: "row", alignItems: "center", gap: 6 },
  statusFirst: { paddingHorizontal: 12 },
  dot: { width: 6, height: 6, borderRadius: radius.full },
  chips: { flexDirection: "row", alignItems: "center", gap: 6 },
  /* `h-8 rounded-full bg-subtle px-3 gap-1.5` */
  chip: { height: 32, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: radius.full },
  card: { flex: 1, overflow: "hidden", borderRadius: radius["2xl"] },
  /* `absolute inset-x-0 bottom-4 px-4` */
  toolbar: { position: "absolute", left: 0, right: 0, bottom: 16, alignItems: "center", paddingHorizontal: 16 },
  footerActions: { position: "absolute", right: 16, bottom: 16, flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 },
  solution: { gap: 4, padding: 12, borderRadius: radius.sm },
  mono: { fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }) },
});
