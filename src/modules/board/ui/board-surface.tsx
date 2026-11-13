import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useKeepAwake } from "expo-keep-awake";
import { Eye, Pencil, Users, Wifi } from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { useCourseStudents } from "@/modules/course";
import { DsText, dsRadius, dsShadowHidden, Icon, ThemeScope, toast, useDs } from "@/shared/ui";
import type { BoardSource, FormulaSolutionDto, Point, StrokeDto, StrokeShapeDto, StrokeUpdate, TextLineDto } from "../api/board.dto";
import {
  BOARD_TEXT_SIZE,
  CODE_TEXT_COLOR,
  CODE_TEXT_SIZE,
  ERASER_SIZES,
  MOBILE_BOARD_COLORS,
  MOBILE_BOARD_WIDTHS,
} from "../constants/board.constants";
import { canEditStroke } from "../lib/board-edit";
import { freeTextBaseline, nextTextPoint, type BoardObstacle } from "../lib/board-flow";
import { ownStroke, resolveOwnStrokes, type OwnStroke } from "../lib/board-history";
import { measureStroke, textWidth } from "../lib/board-measure";
import { CODE_PAD, detectCodeLanguage } from "../lib/code-highlight";
import { hasRichFormatting, linesToPlainText, plainTextToLines } from "../lib/rich-text";
import {
  useAddSheet,
  useAddStroke,
  useBoard,
  useEraseStrokes,
  useRenameSheet,
  useSetBoardPermissions,
  useSetCurrentSheet,
  useSolveFormula,
  useUpdateStroke,
} from "../model/board.queries";
import { useBoardRealtime } from "../model/use-board-realtime";
import { BoardCanvas, type BoardCanvasHandle } from "./board-canvas";
import { MobileBoardFooter, MobileBoardHeader, MobileBoardPill, MobileBoardToolbar, type BoardTool } from "./board-mobile";
import { BoardPagesSheet } from "./board-pages-sheet";
import { BoardPermissionDialog } from "./board-permission-dialog";
import { CodeEditor } from "./code-editor";
import { EraseReasonDialog } from "./erase-reason-dialog";
import { FormulaSolverDialog } from "./formula-solver-dialog";
import { MathFieldInput } from "./math-field-input";
import { PeriodicTableDialog } from "./periodic-table-dialog";
import { RichTextInput } from "./rich-text-input";
import { SelectionToolbar } from "./selection-toolbar";

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

type PlacedTool = "text" | "math" | "code";

interface Placement {
  tool: PlacedTool;
  point: Point;
  /** Nuqtaning kanvasdagi ekran balandligi (zoom va siljish hisobga olingan) — oyna shu yerda. */
  top: number;
  /** Mavjud elementni tahrirlash (tanlash panelidagi "Tahrirlash"). */
  editingId?: string;
}

/**
 * Dars doskasi — veb `board-panel.tsx` ning tor ekran shoxi (`mobile` berilganda):
 * sarlavha (holat belgisi, ruxsat), nuqtali kanvas kartasi, asboblar va
 * pastki qator (bekor qilish/qaytarish, sahifalar, "+ Sahifa").
 *
 * Kanvas Skia'da (vebda SVG), doska o'lchamida (16:9) va "− 100% +" zoom
 * bilan. Matn/formula/kod oynasi kanvas ustida, bosilgan nuqta balandligida
 * ochiladi (telefonda joyida yozish yo'q — veb #177 ham). "Tanlash"
 * vositasida element paneli pastki asboblar ustida (veb #176), o'chirg'ich
 * sudrab ishlaydi va sabab bir marta so'raladi (veb #190).
 */
export function BoardSurface({ lessonId, courseId, currentUserId, source, sheetIndex, onSheetChange, mobile }: BoardSurfaceProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  // Doskada ishlayotganda ekran o'chib qolmasin.
  useKeepAwake();
  const { user } = useAuth();
  const userId = currentUserId ?? user?.id ?? null;

  const realtime = useBoardRealtime(lessonId, !source, userId);
  const board = useBoard(lessonId, { live: realtime.connected, enabled: !source });
  const addStroke = useAddStroke(lessonId);
  const addSheet = useAddSheet(lessonId);
  const erase = useEraseStrokes(lessonId);
  const updateMutation = useUpdateStroke(lessonId);
  const permissions = useSetBoardPermissions(lessonId);
  const renameSheet = useRenameSheet(lessonId);
  const solve = useSolveFormula(lessonId);
  const currentSheet = useSetCurrentSheet(lessonId);
  const members = useCourseStudents(board.data?.isTeacher ? courseId : null, { page_size: 100 });

  const [localSheet, setLocalSheet] = useState(0);
  const sheet = sheetIndex ?? localSheet;
  const setSheet = onSheetChange ?? setLocalSheet;
  const [tool, setTool] = useState<BoardTool>("pen");
  const [color, setColor] = useState<string>(MOBILE_BOARD_COLORS[1]);
  const [strokeWidth, setStrokeWidth] = useState<number>(MOBILE_BOARD_WIDTHS[1]);
  const [textSize, setTextSize] = useState<number>(BOARD_TEXT_SIZE);
  const [eraserSize, setEraserSize] = useState<number>(ERASER_SIZES[1].value);
  const [history, setHistory] = useState<OwnStroke[]>([]);
  const [redoStack, setRedoStack] = useState<Array<{ sheet: number; shape: StrokeShapeDto }>>([]);
  /** "Tanlash" vositasida tanlangan element (pastki panel). */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  /** O'chirish kutilayotgan elementlar — sabab oynasi ochiq (o'chirg'ich yoki paneldagi "O'chirish"). */
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);

  const [placement, setPlacement] = useState<Placement | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftLines, setDraftLines] = useState<TextLineDto[]>([]);
  const [draftCode, setDraftCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("auto");
  const [initialLines, setInitialLines] = useState<TextLineDto[] | undefined>(undefined);
  const [card, setCard] = useState({ width: 0, height: 0 });
  const [formHeight, setFormHeight] = useState(0);

  const rootRef = useRef<View>(null);
  const canvasRef = useRef<BoardCanvasHandle>(null);
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

  /*
   * Bekor qilish tarixi: yangi strokelar kelganda o'z yozuvlarim server
   * id'siga bog'lanadi (`board-history.ts` — nega `strokeKey` ishlamagani).
   * "Oldingi render ma'lumotini saqlash" usuli: effekt emas, render vaqtida.
   */
  const sheets = state?.sheets;
  const [seenSheets, setSeenSheets] = useState(sheets);
  if (sheets !== seenSheets) {
    setSeenSheets(sheets);
    const resolved = sheets ? resolveOwnStrokes(history, sheets, userId) : history;
    if (resolved !== history) setHistory(resolved);
  }
  // Veb #161: o'quvchi o'qituvchi ochgan varaqqa ergashadi; o'qituvchi varaq almashtirsa, server xabar topadi.
  const followSheet = !source && board.data && !board.data.isTeacher ? board.data.currentSheet : null;
  const lastFollowed = useRef<number | null>(null);

  useEffect(() => {
    if (followSheet === null || followSheet === lastFollowed.current) return;
    lastFollowed.current = followSheet;
    setSheet(followSheet);
  }, [followSheet, setSheet]);

  const { mutate: announceSheet } = currentSheet;
  function changeSheet(next: number) {
    setSheet(next);
    if (!source && board.data?.isTeacher) announceSheet(next);
  }

  const boardHeight = state?.height ?? 900;
  /*
   * Kanvas = serverdagi doska (`state.width × state.height`, odatda 16:9).
   *
   * Avval kanvas vebdagidek karta nisbatiga cho'zilardi (telefonda
   * 1600×2254). Server esa nuqtalarni `state.height` bilan cheklaydi, shuning
   * uchun pastki qismda chizilgan chiziq 900-chiziqqa siqilib qolardi
   * ("ma'lum qismdan keyin chizib bo'lmayapti"). Endi karta doska nisbatida,
   * mayda yozish uchun ikki barmoq bilan kattalashtiriladi.
   */
  const canvasHeight = boardHeight;

  function flowPointFor(lines: number): Point {
    return nextTextPoint(active?.strokes ?? [], { boardWidth: state?.width ?? 1200, boardHeight: canvasHeight, size: BOARD_TEXT_SIZE, lines });
  }

  function sendStroke(stroke: StrokeShapeDto) {
    if (source) return source.addStroke(sheet, stroke);
    if (!realtime.sendStroke(sheet, stroke)) addStroke.mutate({ sheet, stroke });
  }

  function commitStroke(stroke: StrokeShapeDto) {
    setHistory((current) => [...current, ownStroke(sheet, stroke, state?.sheets ?? [])]);
    setRedoStack([]);
    sendStroke(stroke);
  }

  const lastOwn = history.filter((entry) => entry.sheet === sheet).at(-1) ?? null;
  const activeStrokes = active?.strokes;
  const undoTargetId = lastOwn?.id ?? null;
  const undoTarget = useMemo(
    () => (undoTargetId ? ((activeStrokes ?? []).find((stroke) => stroke.id === undoTargetId) ?? null) : null),
    [activeStrokes, undoTargetId]
  );

  function undo() {
    if (!lastOwn || !undoTarget) return;
    setHistory((current) => {
      const index = current.lastIndexOf(lastOwn);
      return current.filter((_, position) => position !== index);
    });
    setRedoStack((current) => [...current, { sheet: lastOwn.sheet, shape: lastOwn.shape }]);
    if (source) source.eraseStroke(sheet, undoTarget.id);
    else erase.mutate({ sheet, strokeIds: [undoTarget.id], reason: t("mobile.undoReason") });
  }

  function redo() {
    const entry = redoStack.at(-1);
    if (!entry) return;
    setRedoStack((current) => current.slice(0, -1));
    setHistory((current) => [...current, ownStroke(entry.sheet, entry.shape, state?.sheets ?? [])]);
    if (entry.sheet !== sheet) setSheet(entry.sheet);
    if (source) source.addStroke(entry.sheet, entry.shape);
    else if (!realtime.sendStroke(entry.sheet, entry.shape)) addStroke.mutate({ sheet: entry.sheet, stroke: entry.shape });
  }

  function updateStroke(strokeId: string, update: StrokeUpdate) {
    if (source) return source.updateStroke(sheet, strokeId, update);
    updateMutation.mutate({ sheet, strokeId, update });
  }

  /** Veb #176: o'qituvchi hammasini, o'quvchi faqat o'zinikini (`by_id`); uy vazifasida hammasi o'ziniki. */
  function canEdit(stroke: StrokeDto) {
    return canEditStroke(stroke, { isTeacher: Boolean(state?.isTeacher), userId, personal: Boolean(source) });
  }

  const selectedStroke = tool === "select" && canDraw && selectedId ? ((activeStrokes ?? []).find((stroke) => stroke.id === selectedId) ?? null) : null;
  const author = selectedStroke?.by
    ? [selectedStroke.by, selectedStroke.edited_by && selectedStroke.edited_by !== selectedStroke.by ? t("edit.editedBy", { name: selectedStroke.edited_by }) : ""]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  const draftPlainText = placement?.tool === "text" ? linesToPlainText(draftLines) : placement?.tool === "code" ? draftCode : draftText;
  const adding = !source && addStroke.isPending;
  const canPlaceBlock = Boolean(draftPlainText.trim()) && !adding;

  /** Nuqtaning kanvasdagi ekran balandligi (zoom/siljish bilan). */
  function viewTop(point: Point): number {
    const fallback = card.width && state ? (point[1] * card.width) / state.width : 0;
    return canvasRef.current?.toView(point)[1] ?? fallback;
  }

  function resetDrafts() {
    setDraftText("");
    setDraftLines([]);
    setDraftCode("");
    setInitialLines(undefined);
  }

  /** Veb #161: matn, formula va kod bosilgan joyga yoziladi; telefonda pastki oyna orqali (veb #177 ham). */
  function openPlacement(point: Point) {
    if (tool !== "text" && tool !== "math" && tool !== "code") return;
    resetDrafts();
    setPlacement({ tool, point, top: viewTop(point) });
  }

  /** Tanlangan matn/formula/kod tegishli muharrirda eski qiymat bilan ochiladi. */
  function openEditor(stroke: StrokeDto) {
    if (stroke.type !== "text" && stroke.type !== "math" && stroke.type !== "code") return;
    resetDrafts();
    if (stroke.type === "text") {
      const lines = stroke.lines?.length ? stroke.lines : plainTextToLines(stroke.text);
      setInitialLines(lines);
      setDraftLines(lines);
    } else if (stroke.type === "math") {
      setDraftText(stroke.latex);
    } else {
      setDraftCode(stroke.text);
      setCodeLanguage(stroke.language ?? "auto");
    }
    const size = stroke.size ?? (stroke.type === "code" ? CODE_TEXT_SIZE : BOARD_TEXT_SIZE);
    const point: Point = stroke.type === "code" ? [stroke.x - CODE_PAD, stroke.y - size * 1.05] : [stroke.x, stroke.y - BOARD_TEXT_SIZE * 0.35];
    setPlacement({ tool: stroke.type, point, top: viewTop(point), editingId: stroke.id });
  }

  function anchorFor(point: Point, kind: PlacedTool): Point {
    const width = state?.width ?? 1600;
    if (kind === "code") return [Math.min(Math.max(point[0] + CODE_PAD, CODE_PAD), width - 40), point[1] + CODE_TEXT_SIZE * 1.05];
    return [Math.min(Math.max(point[0], 8), width - 40), point[1] + BOARD_TEXT_SIZE * 0.35];
  }

  /** Matn, formula va kod — yangi matn ularga tegmasin (shakl va chizmalar to'siq emas). */
  function textObstacles(): BoardObstacle[] {
    return (activeStrokes ?? []).flatMap((stroke) => {
      if (stroke.type !== "text" && stroke.type !== "math" && stroke.type !== "code") return [];
      const box = measureStroke(stroke);
      return box ? [{ left: box.minX, right: box.maxX, top: box.minY, bottom: box.maxY }] : [];
    });
  }

  /**
   * Veb #178: matn qator to'riga tushadi (qator = o'lcham × 1.35), band
   * bo'lsa pastdagi birinchi bo'sh qatorga. Vebda yangi matn qatori 22 (M)
   * bo'yicha hisoblanardi; bu yerda tanlangan o'lcham bo'yicha (XL matn
   * yuqoridagi qatorga chiqib ketmasin).
   */
  function freeTextAnchor(x: number, y: number, text: string, size: number, obstacles: BoardObstacle[]): Point {
    const width = Math.max(size, textWidth(text, size));
    const lines = text.split("\n").length;
    return [x, freeTextBaseline({ x, y, size, lines, width, obstacles, maxBaseline: boardHeight - 20 })];
  }

  function closePlacement() {
    // Maydon fokusda turib yo'qolsa klaviatura ochiq qoladi.
    Keyboard.dismiss();
    setPlacement(null);
    resetDrafts();
  }

  function saveEdit(strokeId: string, kind: PlacedTool) {
    if (kind === "math") {
      updateStroke(strokeId, { changes: { latex: draftText.trim() } });
    } else if (kind === "code") {
      const text = draftCode.replace(/\s+$/, "");
      updateStroke(strokeId, { changes: { text, language: codeLanguage === "auto" ? detectCodeLanguage(text) : codeLanguage } });
    } else {
      updateStroke(strokeId, { changes: { text: draftPlainText, lines: hasRichFormatting(draftLines) ? draftLines : [] } });
    }
    closePlacement();
  }

  /**
   * Matn, formula va kod HTTP orqali (veb ham `addStroke.mutate`): soket faqat
   * chizma strokelarini saqlaydi.
   */
  function placeBlock() {
    if (!placement || !canPlaceBlock) return;
    if (placement.editingId) return saveEdit(placement.editingId, placement.tool);
    let stroke: StrokeShapeDto;
    const [x, y] =
      placement.tool === "text"
        ? freeTextAnchor(anchorFor(placement.point, "text")[0], placement.point[1], draftPlainText, textSize, textObstacles())
        : anchorFor(placement.point, placement.tool);
    if (placement.tool === "math") {
      stroke = { type: "math", latex: draftText.trim(), x, y, size: BOARD_TEXT_SIZE, color };
    } else if (placement.tool === "code") {
      const text = draftCode.replace(/\s+$/, "");
      // "Avto" bo'lsa aniqlangan til saqlanadi — PDF ham shu tilda ranglanadi.
      stroke = { type: "code", text, language: codeLanguage === "auto" ? detectCodeLanguage(text) : codeLanguage, x, y, size: CODE_TEXT_SIZE, color: CODE_TEXT_COLOR };
    } else {
      stroke = { type: "text", text: draftPlainText, x, y, size: textSize, color, ...(hasRichFormatting(draftLines) ? { lines: draftLines } : {}) };
    }
    if (source) {
      source.addStroke(sheet, stroke);
      closePlacement();
      return;
    }
    addStroke.mutate({ sheet, stroke }, { onSuccess: closePlacement, onError: (error) => toast.error(error.message) });
  }

  /** O'chirish sababi so'raladi (jonli dars); uy vazifasida darhol. Bir nechta element — bitta oyna. */
  function askToDelete(ids: string[]) {
    if (!ids.length) return;
    if (source) {
      ids.forEach((id) => source.eraseStroke(sheet, id)); // shaxsiy doska: o'chirishga sabab so'ralmaydi
      return;
    }
    setDeleteIds(ids);
    setReason(t("eraseDialog.reasons.wrongAnswer"));
    setReasonOpen(true);
  }

  function deleteSelected(strokeId: string) {
    setSelectedId(null);
    askToDelete([strokeId]);
  }

  function closeReasonDialog() {
    setReasonOpen(false);
    setDeleteIds([]);
    setReason("");
  }

  async function removeSelected() {
    if (!deleteIds.length || !reason.trim()) return;
    try {
      await erase.mutateAsync({ sheet, strokeIds: deleteIds, reason: reason.trim() });
      closeReasonDialog();
      toast.success(deleteIds.length > 1 ? t("eraseDialog.deletedCount", { count: deleteIds.length }) : t("eraseDialog.deleted"));
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
  const formTop = placement ? Math.max(0, Math.min(placement.top - FORM_LIFT, card.height - formHeight)) : 0;
  const placeKinds: PlacedTool[] = state.codeEnabled ? ["text", "math", "code"] : ["text", "math"];

  const pill = source ? null : !canDraw ? (
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
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setCard({ width, height });
          }}
        >
          <BoardCanvas
            ref={canvasRef}
            strokes={active?.strokes ?? []}
            width={state.width}
            height={canvasHeight}
            fit="height"
            dotColor={ds.c.line}
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            enabled={canDraw}
            onCommit={commitStroke}
            onPlacePoint={openPlacement}
            markedStrokeIds={deleteIds}
            zoomControls
            eraserSize={eraserSize}
            onErase={askToDelete}
            selection={{
              selectedId,
              onSelect: setSelectedId,
              canEdit,
              onDenied: () => toast.info(t("edit.notOwner")),
              onMove: (strokeId, delta) => updateStroke(strokeId, { move: delta }),
              onResize: (strokeId, changes) => updateStroke(strokeId, { changes }),
              onDraggingChange: setDragging,
              label: author,
            }}
          />
        </View>

        {/* Karta kanvas tashqarisida: klaviatura ochilib kanvas kichraysa ham tugmalari kesilmaydi. */}
        {placement ? (
          <View
            onLayout={(event) => setFormHeight(event.nativeEvent.layout.height)}
            style={[styles.form, { top: formTop, borderColor: ds.c.line, backgroundColor: ds.c.surface, boxShadow: ds.shadow.lg }]}
          >
            {placement.editingId ? (
              <DsText v="title-sm">{t(`inline.edit.${placement.tool}`)}</DsText>
            ) : (
              <View accessibilityRole="tablist" style={[styles.tabs, { backgroundColor: ds.c.subtle }]}>
                {placeKinds.map((kind) => {
                  const on = placement.tool === kind;
                  return (
                    <Pressable
                      key={kind}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: on }}
                      onPress={() => {
                        resetDrafts();
                        setPlacement({ ...placement, tool: kind });
                      }}
                      style={[styles.tab, { backgroundColor: on ? ds.c.surface : "transparent", boxShadow: on ? ds.shadow.sm : dsShadowHidden(ds.shadow.sm) }]}
                    >
                      <DsText v="body-sm" w={on ? "600" : "500"} c={on ? "ink" : "ink-secondary"}>
                        {t(`inline.${kind === "math" ? "formula" : kind}`)}
                      </DsText>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <View style={styles.formBody}>
              {placement.tool === "math" ? (
                <MathFieldInput value={draftText} onChange={setDraftText} />
              ) : placement.tool === "code" ? (
                <CodeEditor value={draftCode} onChange={setDraftCode} language={codeLanguage} onLanguageChange={setCodeLanguage} languages={state.codeLanguages} />
              ) : (
                <RichTextInput key={placement.editingId ?? "new"} initialLines={initialLines} onChange={setDraftLines} />
              )}
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
                  {placement.editingId ? t("inline.save") : t("inline.add")}
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
          {/* Veb `selectionToolbar(true)`: telefonda panel pastki asboblar ustida. */}
          {selectedStroke && !placement && !dragging ? (
            <SelectionToolbar
              stroke={selectedStroke}
              onEdit={selectedStroke.type === "text" || selectedStroke.type === "math" || selectedStroke.type === "code" ? () => openEditor(selectedStroke) : undefined}
              onChange={(changes) => updateStroke(selectedStroke.id, { changes })}
              onDelete={() => deleteSelected(selectedStroke.id)}
            />
          ) : null}
          <MobileBoardToolbar
            tool={tool}
            color={color}
            width={strokeWidth}
            textSize={textSize}
            eraserSize={eraserSize}
            onToolChange={(next) => {
              setSelectedId(null);
              if (next === "math") setFormulaOpen(true);
              else setTool(next);
            }}
            onColorChange={setColor}
            onWidthChange={setStrokeWidth}
            onTextSizeChange={setTextSize}
            onEraserSizeChange={setEraserSize}
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
            onPrev={() => changeSheet(Math.max(0, sheet - 1))}
            onNext={() => changeSheet(Math.min(total - 1, sheet + 1))}
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
            changeSheet(index);
            setSelectedId(null);
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
  /* `mx-1 mt-1.5 min-h-[94px] flex-col justify-end gap-1.5` — tanlash paneli asboblar ustida */
  toolbarSlot: { minHeight: 94, marginTop: 6, marginHorizontal: 4, justifyContent: "flex-end", gap: 6 },
  footer: { marginTop: 2, marginHorizontal: 4 },
});
