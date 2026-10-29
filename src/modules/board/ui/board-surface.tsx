import { useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useKeepAwake } from "expo-keep-awake";
import { Eye, Pencil, Users, Wifi } from "lucide-react-native";
import { useCourseStudents } from "@/modules/course";
import { DsText, dsRadius, dsShadowHidden, Icon, ThemeScope, toast, useDs } from "@/shared/ui";
import type { BoardSource, FormulaSolutionDto, Point, StrokeShapeDto, TextLineDto } from "../api/board.dto";
import { BOARD_TEXT_SIZE, MOBILE_BOARD_COLORS, MOBILE_BOARD_WIDTHS } from "../constants/board.constants";
import { FLOW_MARGIN, nextTextPoint, strokeSpan } from "../lib/board-flow";
import { hasRichFormatting, linesToPlainText } from "../lib/rich-text";
import { useAddSheet, useAddStroke, useBoard, useEraseStrokes, useRenameSheet, useSetBoardPermissions, useSolveFormula } from "../model/board.queries";
import { useBoardRealtime } from "../model/use-board-realtime";
import { BoardCanvas } from "./board-canvas";
import { MobileBoardFooter, MobileBoardHeader, MobileBoardPill, MobileBoardToolbar, type BoardTool } from "./board-mobile";
import { BoardPagesSheet } from "./board-pages-sheet";
import { BoardPermissionDialog } from "./board-permission-dialog";
import { EraseReasonDialog } from "./erase-reason-dialog";
import { FormulaSolverDialog } from "./formula-solver-dialog";
import { MathFieldInput } from "./math-field-input";
import { PeriodicTableDialog } from "./periodic-table-dialog";
import { RichTextInput } from "./rich-text-input";

export interface BoardMobileChrome {
  title?: string;
  subtitle: ReactNode;
  live?: boolean;
  backLabel: string;
  onBack: () => void;
  action?: ReactNode;
  footer?: ReactNode;
}

export interface BoardSurfaceProps {
  lessonId: string;
  courseId: string | null;
  currentUserId?: string | null;
  /** Berilsa - doska dars o'rniga shu manbadan ishlaydi (uy vazifasi doskasi): realtime va ruxsatlarsiz. */
  source?: BoardSource;
  /** Sahifa tashqaridan boshqarilsa (arxiv sahifasi). */
  sheetIndex?: number;
  onSheetChange?: (index: number) => void;
  mobile: BoardMobileChrome;
}

/** Joylashtirish oynasi nuqtadan shuncha yuqorida turadi (`-translate-y-[34px]`). */
const FORM_LIFT = 34;

function strokeKey(stroke: StrokeShapeDto): string {
  return JSON.stringify(stroke, (key, value) => (key === "id" ? undefined : typeof value === "number" ? Math.round(value * 10) / 10 : value));
}

/**
 * Dars doskasi — veb `board-panel.tsx` ning tor ekran shoxi (`mobile` berilganda):
 * sarlavha (holat belgisi, ruxsat), nuqtali kanvas kartasi, asboblar va
 * pastki qator (bekor qilish/qaytarish, sahifalar, "+ Sahifa").
 *
 * Kanvas Skia'da (vebda SVG); eni bo'yicha sig'adi va matn oqimi bilan
 * pastga o'sadi. Matn/formula kartasi kanvas ustida, keyingi bo'sh joy
 * balandligida ochiladi.
 */
export function BoardSurface({ lessonId, courseId, currentUserId, source, sheetIndex, onSheetChange, mobile }: BoardSurfaceProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  // Doskada ishlayotganda ekran o'chib qolmasin.
  useKeepAwake();

  const realtime = useBoardRealtime(lessonId, !source, currentUserId);
  const board = useBoard(lessonId, { live: realtime.connected, enabled: !source });
  const addStroke = useAddStroke(lessonId);
  const addSheet = useAddSheet(lessonId);
  const erase = useEraseStrokes(lessonId);
  const permissions = useSetBoardPermissions(lessonId);
  const renameSheet = useRenameSheet(lessonId);
  const solve = useSolveFormula(lessonId);
  const members = useCourseStudents(board.data?.isTeacher ? courseId : null, { page_size: 100 });

  const [localSheet, setLocalSheet] = useState(0);
  const sheet = sheetIndex ?? localSheet;
  const setSheet = onSheetChange ?? setLocalSheet;
  const [tool, setTool] = useState<BoardTool>("pen");
  const [color, setColor] = useState<string>(MOBILE_BOARD_COLORS[1]);
  const [strokeWidth, setStrokeWidth] = useState<number>(MOBILE_BOARD_WIDTHS[1]);
  const [history, setHistory] = useState<Array<{ sheet: number; shape: StrokeShapeDto }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{ sheet: number; shape: StrokeShapeDto }>>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);

  const [placement, setPlacement] = useState<{ tool: "text" | "math"; point: Point } | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftLines, setDraftLines] = useState<TextLineDto[]>([]);
  const [card, setCard] = useState({ width: 0, height: 0 });
  const [formHeight, setFormHeight] = useState(0);

  const rootRef = useRef<View>(null);
  const [bottomGap, setBottomGap] = useState(0);
  const { height: windowHeight } = useWindowDimensions();
  const keyboard = useReanimatedKeyboardAnimation();
  const placing = placement !== null;
  /**
   * Matn kartasi ochiq bo'lganda pastdan klaviatura balandligicha joy
   * bo'shatiladi (kanvas kichrayadi, karta va tugmalar ko'rinadi). Yopiq
   * bo'lsa aniq 0: oyna ustida turganda klaviatura yopilsa, hodisa bu
   * yerga yetmay qolishi mumkin (`KeyboardAvoidingView` shunda qotib qolardi).
   */
  const keyboardSpace = useAnimatedStyle(() => ({ height: placing ? Math.max(0, -keyboard.height.get() - bottomGap) : 0 }), [placing, bottomGap]);

  const [formulaOpen, setFormulaOpen] = useState(false);
  const [periodicOpen, setPeriodicOpen] = useState(false);
  const [formula, setFormula] = useState("");
  const [solution, setSolution] = useState<FormulaSolutionDto | null>(null);

  const state = source ? source.state : board.data;
  const active = state?.sheets.find((item) => item.index === sheet) ?? state?.sheets[0];
  const canDraw = Boolean(state?.canDraw);

  const boardHeight = state?.height ?? 900;
  const canvasHeight = useMemo(() => {
    const bottom = (active?.strokes ?? []).reduce((max, stroke) => {
      const span = strokeSpan(stroke);
      return span ? Math.max(max, span.bottom) : max;
    }, 0);
    return Math.max(boardHeight, Math.ceil(bottom + FLOW_MARGIN));
  }, [active?.strokes, boardHeight]);

  function flowPointFor(lines: number): Point {
    return nextTextPoint(active?.strokes ?? [], { boardWidth: state?.width ?? 1200, boardHeight: canvasHeight, size: BOARD_TEXT_SIZE, lines });
  }

  function sendStroke(stroke: StrokeShapeDto) {
    if (source) return source.addStroke(sheet, stroke);
    if (!realtime.sendStroke(sheet, stroke)) addStroke.mutate({ sheet, stroke });
  }

  function commitStroke(stroke: StrokeShapeDto) {
    setHistory((current) => [...current, { sheet, shape: stroke }]);
    setRedoStack([]);
    sendStroke(stroke);
  }

  const lastOwn = history.filter((entry) => entry.sheet === sheet).at(-1) ?? null;
  const undoTarget = lastOwn ? ([...(active?.strokes ?? [])].reverse().find((stroke) => strokeKey(stroke) === strokeKey(lastOwn.shape)) ?? null) : null;

  function undo() {
    if (!lastOwn || !undoTarget) return;
    setHistory((current) => {
      const index = current.lastIndexOf(lastOwn);
      return current.filter((_, position) => position !== index);
    });
    setRedoStack((current) => [...current, lastOwn]);
    if (source) source.eraseStroke(sheet, undoTarget.id);
    else erase.mutate({ sheet, strokeIds: [undoTarget.id], reason: t("mobile.undoReason") });
  }

  function redo() {
    const entry = redoStack.at(-1);
    if (!entry) return;
    setRedoStack((current) => current.slice(0, -1));
    setHistory((current) => [...current, entry]);
    if (entry.sheet !== sheet) setSheet(entry.sheet);
    if (source) source.addStroke(entry.sheet, entry.shape);
    else if (!realtime.sendStroke(entry.sheet, entry.shape)) addStroke.mutate({ sheet: entry.sheet, stroke: entry.shape });
  }

  const draftPlainText = placement?.tool === "text" ? linesToPlainText(draftLines) : draftText;
  const adding = !source && addStroke.isPending;
  const canPlaceBlock = Boolean(draftPlainText.trim()) && !adding;

  function openPlacement() {
    if (tool !== "text" && tool !== "math") return;
    setDraftText("");
    setDraftLines([]);
    setPlacement({ tool, point: flowPointFor(1) });
  }

  function closePlacement() {
    // Maydon fokusda turib yo'qolsa klaviatura ochiq qoladi.
    Keyboard.dismiss();
    setPlacement(null);
    setDraftText("");
    setDraftLines([]);
  }

  /**
   * Matn va formula HTTP orqali (veb ham `addStroke.mutate`): soket faqat
   * chizma strokelarini saqlaydi.
   */
  function placeBlock() {
    if (!placement || !canPlaceBlock) return;
    let stroke: StrokeShapeDto;
    if (placement.tool === "math") {
      const [x, y] = flowPointFor(1);
      stroke = { type: "math", latex: draftText.trim(), x, y, size: BOARD_TEXT_SIZE, color };
    } else {
      const [x, y] = flowPointFor(Math.max(1, draftLines.length));
      stroke = { type: "text", text: draftPlainText, x, y, size: BOARD_TEXT_SIZE, color, ...(hasRichFormatting(draftLines) ? { lines: draftLines } : {}) };
    }
    if (source) {
      source.addStroke(sheet, stroke);
      closePlacement();
      return;
    }
    addStroke.mutate({ sheet, stroke }, { onSuccess: closePlacement, onError: (error) => toast.error(error.message) });
  }

  function handleStrokeClick(id: string | null) {
    if (!id || tool !== "erase" || !canDraw) return;
    if (source) return source.eraseStroke(sheet, id); // shaxsiy doska: o'chirishga sabab so'ralmaydi
    setSelected(id);
    setReason(t("eraseDialog.reasons.wrongAnswer"));
    setReasonOpen(true);
  }

  function closeReasonDialog() {
    setReasonOpen(false);
    setSelected(null);
    setReason("");
  }

  async function removeSelected() {
    if (!selected || !reason.trim()) return;
    try {
      await erase.mutateAsync({ sheet, strokeIds: [selected], reason: reason.trim() });
      closeReasonDialog();
      toast.success(t("eraseDialog.deleted"));
    } catch (error) {
      void error;
    }
  }

  async function solveFormula() {
    try {
      setSolution(await (source ? source.solve!(formula) : solve.mutateAsync(formula)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("formulaDialog.solveError"));
    }
  }

  function placeSolution() {
    if (!solution) return;
    const steps = solution.steps?.length ? `\n${solution.steps.join("\n")}` : "";
    const text = `${solution.pretty}\n${solution.result}${steps}`;
    const [x, y] = flowPointFor(text.split("\n").length);
    const stroke: StrokeShapeDto = { type: "text", text, x, y, size: BOARD_TEXT_SIZE, color };
    const done = () => {
      setFormulaOpen(false);
      setFormula("");
      setSolution(null);
    };
    if (source) {
      source.addStroke(sheet, stroke);
      done();
      return;
    }
    addStroke.mutate({ sheet, stroke }, { onSuccess: done });
  }

  if (!source && board.isLoading)
    return (
      <View style={styles.center}>
        <DsText v="body-sm" c="ink-tertiary">
          {t("status.loading")}
        </DsText>
      </View>
    );
  if ((!source && board.isError) || !state)
    return (
      <View style={[styles.center, styles.errorGap]}>
        <DsText v="body-sm" c="ink-secondary" style={styles.centerText}>
          {board.error?.message}
        </DsText>
        <Pressable accessibilityRole="button" onPress={() => void board.refetch()} style={[styles.retry, { backgroundColor: ds.c.action }]}>
          <DsText v="label-strong" c="on-action">
            {t("status.retry")}
          </DsText>
        </Pressable>
      </View>
    );

  const page = (active?.index ?? sheet) + 1;
  const total = state.sheets.length;
  const scale = card.width ? card.width / state.width : 0;
  const formTop = placement ? Math.max(0, Math.min(placement.point[1] * scale - FORM_LIFT, card.height - formHeight)) : 0;

  const pill = !canDraw ? (
    <MobileBoardPill icon={(fg) => <Eye size={14} color={fg} />} tone="neutral">
      {t("status.viewOnly")}
    </MobileBoardPill>
  ) : !source && !realtime.connected ? (
    <MobileBoardPill icon={(fg) => <Wifi size={14} color={fg} />} tone="warning">
      {t("status.slowMode")}
    </MobileBoardPill>
  ) : state.isTeacher ? (
    <MobileBoardPill icon={(fg) => <Pencil size={14} color={fg} />} tone="success" onPress={() => setGrantOpen(true)}>
      {t(`mobile.modes.${state.permissionMode}`)}
    </MobileBoardPill>
  ) : (
    <MobileBoardPill icon={(fg) => <Pencil size={14} color={fg} />} tone="success">
      {t("status.canDraw")}
    </MobileBoardPill>
  );

  return (
    <View
      ref={rootRef}
      style={styles.root}
      onLayout={() => rootRef.current?.measureInWindow((_x, y, _width, height) => setBottomGap(Math.max(0, windowHeight - y - height)))}
    >
      <MobileBoardHeader
        title={mobile.title ?? t("mobile.title", { page, total })}
        subtitle={mobile.subtitle}
        live={mobile.live}
        backLabel={mobile.backLabel}
        onBack={mobile.onBack}
        pill={pill}
        action={
          mobile.action ??
          (state.isTeacher ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t("permissionDialog.title")} onPress={() => setGrantOpen(true)} style={[styles.round, { backgroundColor: ds.c.surface }]}>
              <Users size={20} color={ds.c.ink} />
            </Pressable>
          ) : null)
        }
      />

      <View style={styles.stage}>
        <View
          style={[styles.card, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.sm }]}
          onLayout={(event) => setCard({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
        >
          <BoardCanvas
            strokes={active?.strokes ?? []}
            width={state.width}
            height={canvasHeight}
            fit="width"
            dotColor={ds.c.line}
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            enabled={canDraw}
            onCommit={commitStroke}
            onPlacePoint={openPlacement}
            onSelectStroke={handleStrokeClick}
            selectedStrokeId={selected}
          />
        </View>

        {/* Karta kanvas tashqarisida: klaviatura ochilib kanvas kichraysa ham tugmalari kesilmaydi. */}
        {placement ? (
          <View
            onLayout={(event) => setFormHeight(event.nativeEvent.layout.height)}
            style={[styles.form, { top: formTop, borderColor: ds.c.line, backgroundColor: ds.c.surface, boxShadow: ds.shadow.lg }]}
          >
            <View accessibilityRole="tablist" style={[styles.tabs, { backgroundColor: ds.c.subtle }]}>
              {(["text", "math"] as const).map((kind) => {
                const on = placement.tool === kind;
                return (
                  <Pressable
                    key={kind}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    onPress={() => {
                      setDraftText("");
                      setDraftLines([]);
                      setPlacement({ ...placement, tool: kind });
                    }}
                    style={[styles.tab, { backgroundColor: on ? ds.c.surface : "transparent", boxShadow: on ? ds.shadow.sm : dsShadowHidden(ds.shadow.sm) }]}
                  >
                    <DsText v="body-sm" w={on ? "600" : "500"} c={on ? "ink" : "ink-secondary"}>
                      {kind === "math" ? t("inline.formula") : t("inline.text")}
                    </DsText>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.formBody}>
              {placement.tool === "math" ? <MathFieldInput value={draftText} onChange={setDraftText} /> : <RichTextInput onChange={setDraftLines} />}
            </View>
            <View style={styles.formActions}>
              <Pressable
                accessibilityRole="button"
                onPress={closePlacement}
                style={({ pressed }) => [styles.formButton, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
              >
                <DsText v="button">{t("inline.cancel")}</DsText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!canPlaceBlock}
                onPress={placeBlock}
                style={({ pressed }) => [styles.formButton, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }, !canPlaceBlock && styles.faded]}
              >
                <DsText v="button" c="on-action">
                  {t("inline.add")}
                </DsText>
              </Pressable>
            </View>
          </View>
        ) : null}

        {!source && !realtime.connected ? (
          <View accessibilityRole="alert" style={[styles.slowNote, { backgroundColor: ds.c["warning-bg"] }]}>
            <Icon name="warning-fill" size={18} color={ds.c["accent-saffron-fg"]} />
            <DsText v="body-xs" w="500" c="warning-fg" style={styles.grow}>
              {t("status.slowSyncNote")}
            </DsText>
          </View>
        ) : null}
      </View>

      {canDraw ? (
        <View style={styles.toolbarSlot}>
          <MobileBoardToolbar
            tool={tool}
            color={color}
            width={strokeWidth}
            onToolChange={(next) => {
              setSelected(null);
              if (next === "math") setFormulaOpen(true);
              else setTool(next);
            }}
            onColorChange={setColor}
            onWidthChange={setStrokeWidth}
            onPeriodic={state.chemistryEnabled ? () => setPeriodicOpen(true) : undefined}
          />
        </View>
      ) : null}

      <View style={styles.footer}>
        {mobile.footer ?? (
          <MobileBoardFooter
            page={page}
            total={total}
            showHistory={canDraw}
            canUndo={Boolean(undoTarget)}
            canRedo={redoStack.length > 0}
            onUndo={undo}
            onRedo={redo}
            onPrev={() => setSheet(Math.max(0, sheet - 1))}
            onNext={() => setSheet(Math.min(total - 1, sheet + 1))}
            onPages={() => setPagesOpen(true)}
            onAdd={state.isTeacher || source ? () => (source ? source.addSheet() : addSheet.mutate()) : undefined}
          />
        )}
      </View>

      <Animated.View style={keyboardSpace} />

      {/* Oynalar ilova mavzusida (vebda portal orqali, `data-theme="light"` dan tashqarida). */}
      <ThemeScope scheme={null}>
        <EraseReasonDialog open={reasonOpen} pending={erase.isPending} reason={reason} onReasonChange={setReason} onCancel={closeReasonDialog} onConfirm={() => void removeSelected()} />

        <BoardPagesSheet
          open={pagesOpen}
          onOpenChange={setPagesOpen}
          sheets={state.sheets}
          active={sheet}
          boardWidth={state.width}
          boardHeight={state.height}
          canAdd={state.isTeacher || Boolean(source)}
          onSelect={(index) => {
            setSheet(index);
            setSelected(null);
            setPagesOpen(false);
          }}
          onAdd={() => (source ? source.addSheet() : addSheet.mutate())}
          canRename={state.isTeacher && !source}
          onRename={(index, title) => renameSheet.mutate({ index, title })}
        />

        <BoardPermissionDialog
          open={grantOpen}
          onOpenChange={setGrantOpen}
          pending={permissions.isPending}
          students={(members.data?.items ?? []).map(({ student }) => ({ id: student.id, name: student.name, username: student.username }))}
          onSubmit={(input) =>
            permissions.mutate(input, {
              onSuccess: (result) => {
                toast.success(
                  "mode" in input && input.mode === "none"
                    ? t("permissionDialog.revoked", { count: result.revoked ?? 0 })
                    : t("permissionDialog.saved", { count: result.granted ?? 0 })
                );
                setGrantOpen(false);
              },
            })
          }
        />

        <FormulaSolverDialog
          open={formulaOpen}
          onOpenChange={(next) => {
            setFormulaOpen(next);
            if (!next) {
              setFormula("");
              setSolution(null);
            }
          }}
          formula={formula}
          onFormulaChange={setFormula}
          solution={solution}
          solving={solve.isPending}
          placing={adding}
          canPlace={canDraw}
          onSolve={() => void solveFormula()}
          onPlace={placeSolution}
        />

        <PeriodicTableDialog
          open={periodicOpen}
          onOpenChange={setPeriodicOpen}
          lessonId={source ? undefined : lessonId}
          onPlace={source ? (strokes) => source.addStrokes(sheet, strokes) : undefined}
          sheet={sheet}
          canDraw={canDraw}
          color={color}
          boardWidth={state.width}
          boardHeight={canvasHeight}
          strokes={active?.strokes ?? []}
        />
      </ThemeScope>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.4 },
  center: { flex: 1, minHeight: 320, alignItems: "center", justifyContent: "center" },
  centerText: { textAlign: "center" },
  errorGap: { gap: 12 },
  retry: { height: 44, justifyContent: "center", paddingHorizontal: 20, borderRadius: 22 },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  /* `relative mt-1 flex-1`, karta `rounded-2xl bg-surface shadow-sm` */
  /* `zIndex` — ochiq matn kartasi pastdagi asboblar ustida tursin */
  stage: { flex: 1, minHeight: 0, marginTop: 4, zIndex: 1 },
  card: { flex: 1, overflow: "hidden", borderRadius: dsRadius["2xl"] },
  /* `absolute inset-x-6 rounded-lg border p-3 shadow-lg` */
  form: { position: "absolute", left: 24, right: 24, padding: 12, borderWidth: 1, borderRadius: dsRadius.lg },
  tabs: { height: 38, flexDirection: "row", padding: 3, borderRadius: 19 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  formBody: { marginTop: 11 },
  formActions: { marginTop: 10, flexDirection: "row", gap: 8 },
  formButton: { flex: 1, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  /* `absolute inset-x-1 -bottom-[13px] min-h-[60px] rounded-lg px-3 py-3 gap-2.5` */
  slowNote: { position: "absolute", left: 4, right: 4, bottom: -13, minHeight: 60, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: dsRadius.lg },
  /* `mx-1 mt-1.5 h-[94px] justify-end` */
  toolbarSlot: { height: 94, marginTop: 6, marginHorizontal: 4, justifyContent: "flex-end" },
  footer: { marginTop: 2, marginHorizontal: 4 },
});
