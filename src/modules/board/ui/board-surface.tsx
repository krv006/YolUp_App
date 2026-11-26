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
import { confirmsPending } from "../lib/board-pending";
import { FLOW_MARGIN, freeTextBaseline, nextTextPoint, strokeSpan, type BoardObstacle } from "../lib/board-flow";
import { buildLenta, pageAt, shiftChanges, shiftStroke, strokeTop, type LentaPage } from "../lib/board-lenta";
import { ownStroke, resolveOwnStrokes, type OwnStroke } from "../lib/board-history";
import { measureStroke, textWidth } from "../lib/board-measure";
import { CODE_PAD, detectCodeLanguage } from "../lib/code-highlight";
import { hasRichFormatting, linesToPlainText, plainTextToLines } from "../lib/rich-text";
import { wrapToWidth } from "../lib/wrap-text";
import {
  useAddSheet,
  useAddStroke,
  useBoard,
  useEraseStrokes,
  useSetBoardPermissions,
  useSolveFormula,
  useUpdateStroke,
} from "../model/board.queries";
import { useBoardRealtime } from "../model/use-board-realtime";
import { BoardCanvas, type BoardCanvasHandle } from "./board-canvas";
import { MobileBoardFooter, MobileBoardHeader, MobileBoardPill, MobileBoardToolbar, type BoardTool } from "./board-mobile";
import { BoardPermissionDialog } from "./board-permission-dialog";
import { CodeEditor } from "./code-editor";
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
  mobile: BoardMobileChrome;
}

/** Joylashtirish oynasi nuqtadan shuncha yuqorida turadi (`-translate-y-[34px]`). */
const FORM_LIFT = 34;
/** Veb #192: server javob bermasa vaqtinchalik chiziq shuncha vaqtdan keyin o'chadi. */
const PENDING_STROKE_MS = 8000;
/** Sahifa ajratgichi va "N-sahifa" yorlig'i (veb `board-panel` lenta chizig'i). */
const PAGE_LABEL_SIZE = 22;
/** Sahifaga o'tganda ajratgich ko'rinib tursin — shuncha yuqoridan (doska birligida; veb `PAGE_REVEAL_MARGIN`). */
const PAGE_REVEAL_MARGIN = 40;

interface PendingStroke {
  sheet: number;
  stroke: StrokeDto;
}

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
 * pastki qator (bekor qilish/qaytarish, "Sahifa qo'shish").
 *
 * Veb #215 (b39e0d9, 8216a74, d3929d4): doska sahifalar o'rniga BITTA LENTA —
 * hamma sahifalar tepa-past ketma-ket, hammasi tahrirlanadi. Kanvasda strokelar
 * sahifa siljishi (`offset`) bilan lenta koordinatasida; yangi element tepasi
 * tushgan sahifaga mahalliy koordinata bilan yuboriladi (`place`), tahrir va
 * o'chirish elementning o'z sahifasiga (`homeOf`). Sahifalar orasida chiziq va
 * "N-sahifa" yorlig'i; ochilganda oxirgi sahifaga aylanadi; yangi sahifa
 * qo'shilsa "N-sahifa qo'shildi" va unga o'tiladi.
 *
 * Kanvas Skia'da (vebda SVG), doska o'lchamida (16:9) va "− 100% +" zoom
 * bilan. Matn/formula/kod oynasi kanvas ustida, bosilgan nuqta balandligida
 * ochiladi (telefonda joyida yozish yo'q — veb #177 ham). "Tanlash"
 * vositasida element paneli pastki asboblar ustida (veb #176), o'chirg'ich
 * sudrab ishlaydi. Veb #213: o'chirishda sabab so'ralmaydi, `reason` bo'sh.
 */
export function BoardSurface({ lessonId, courseId, currentUserId, source, mobile }: BoardSurfaceProps) {
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
  const solve = useSolveFormula(lessonId);
  const members = useCourseStudents(board.data?.isTeacher ? courseId : null, { page_size: 100 });

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
  const [grantOpen, setGrantOpen] = useState(false);

  const [placement, setPlacement] = useState<Placement | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftLines, setDraftLines] = useState<TextLineDto[]>([]);
  const [draftCode, setDraftCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("auto");
  const [initialLines, setInitialLines] = useState<TextLineDto[] | undefined>(undefined);
  const [card, setCard] = useState({ width: 0, height: 0 });
  const [formHeight, setFormHeight] = useState(0);
  const [pendingStrokes, setPendingStrokes] = useState<PendingStroke[]>([]);
  const pendingSeq = useRef(0);

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
  const orderedSheets = useMemo(() => [...(state?.sheets ?? [])].sort((a, b) => a.index - b.index), [state?.sheets]);
  /** Lentaning oxirgi sahifasi — bekor qilish tarixi va davriy jadval shunga bog'lanadi (vebdagidek). */
  const sheet = orderedSheets[orderedSheets.length - 1]?.index ?? 0;
  const canDraw = Boolean(state?.canDraw);
  const boardHeight = state?.height ?? 900;
  const boardWidth = state?.width ?? 1600;

  /** Sahifa balandligi — kamida doska balandligi, pastdagi element ostida `FLOW_MARGIN` joy. */
  const lenta = useMemo(
    () =>
      buildLenta(orderedSheets, (strokes) => {
        const bottom = strokes.reduce((max, stroke) => {
          const span = strokeSpan(stroke as StrokeDto);
          return span ? Math.max(max, span.bottom) : max;
        }, 0);
        return Math.max(boardHeight, Math.ceil(bottom + FLOW_MARGIN));
      }),
    [orderedSheets, boardHeight]
  );
  const strokeHome = useMemo(() => {
    const homes = new Map<string, LentaPage>();
    for (const item of orderedSheets) {
      const page = lenta.pages.find((entry) => entry.index === item.index);
      if (page) for (const stroke of item.strokes) homes.set(stroke.id, page);
    }
    return homes;
  }, [orderedSheets, lenta]);
  /** Lentadagi hamma strokelar — har biri o'z sahifasi siljishi bilan. */
  const active = useMemo(
    () => ({
      strokes: orderedSheets.flatMap((item) => {
        const offset = lenta.pages.find((entry) => entry.index === item.index)?.offset ?? 0;
        return offset ? item.strokes.map((stroke) => shiftStroke(stroke, offset)) : item.strokes;
      }),
    }),
    [orderedSheets, lenta]
  );
  const lastPage = lenta.pages[lenta.pages.length - 1] ?? { index: sheet, offset: 0, height: boardHeight };

  function homeOf(strokeId: string): LentaPage {
    return strokeHome.get(strokeId) ?? lastPage;
  }

  /** Lenta koordinatasidagi element tepasi tushgan sahifa va o'sha sahifadagi shakli. */
  function place<T extends StrokeShapeDto>(shape: T): { sheet: number; shape: T } {
    const page = pageAt(lenta.pages, strokeTop(shape)) ?? lastPage;
    return { sheet: page.index, shape: shiftStroke(shape, -page.offset) };
  }

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

  /*
   * Kanvas = serverdagi doska (`state.width × state.height`, odatda 16:9).
   *
   * Avval kanvas vebdagidek karta nisbatiga cho'zilardi (telefonda
   * 1600×2254). Server esa nuqtalarni `state.height` bilan cheklaydi, shuning
   * uchun pastki qismda chizilgan chiziq 900-chiziqqa siqilib qolardi
   * ("ma'lum qismdan keyin chizib bo'lmayapti"). Endi karta doska nisbatida,
   * mayda yozish uchun ikki barmoq bilan kattalashtiriladi.
   */
  const canvasHeight = Math.max(lenta.total, boardHeight);

  function flowPointFor(lines: number): Point {
    return nextTextPoint(active?.strokes ?? [], { boardWidth: state?.width ?? 1200, boardHeight: canvasHeight, size: BOARD_TEXT_SIZE, lines });
  }

  /**
   * Veb #192: yuborilgan chiziq server tasdiqlaguncha vaqtinchalik
   * (`pending-N`) ko'rinadi — qalam qo'yib yuborilganda yo'qolib qolmaydi.
   * Server nusxasi kelgach u yashiriladi (`confirmsPending`); saqlash xato
   * bersa olib tashlanadi, javob kelmasa 8 soniyadan keyin o'chadi.
   */
  /** `stroke` — lenta koordinatasida; vaqtinchalik nusxa ham lentada ko'rinadi. */
  function sendStroke(stroke: StrokeShapeDto) {
    const target = place(stroke);
    if (source) return source.addStroke(target.sheet, target.shape);
    pendingSeq.current += 1;
    const id = `pending-${pendingSeq.current}`;
    const drop = () => setPendingStrokes((current) => current.filter((item) => item.stroke.id !== id));
    setPendingStrokes((current) => [...current, { sheet, stroke: { ...stroke, id } as StrokeDto }]);
    globalThis.setTimeout(drop, PENDING_STROKE_MS);
    if (!realtime.sendStroke(target.sheet, target.shape)) addStroke.mutate({ sheet: target.sheet, stroke: target.shape }, { onError: drop });
  }

  /** Tarix yozuvi: stroke tushadigan sahifa (id bog'lash shu sahifa bo'yicha), shakl — lentada (qaytarish uchun). */
  function remember(stroke: StrokeShapeDto) {
    setHistory((current) => [...current, { ...ownStroke(place(stroke).sheet, stroke, state?.sheets ?? []), shape: stroke }]);
  }

  function commitStroke(stroke: StrokeShapeDto) {
    remember(stroke);
    setRedoStack([]);
    sendStroke(stroke);
  }

  const lastOwn = history.at(-1) ?? null;
  const activeStrokes = active?.strokes;
  const visiblePending = useMemo(
    () =>
      pendingStrokes
        .filter((item) => item.sheet === sheet)
        .filter((item) => !(activeStrokes ?? []).some((stroke) => confirmsPending(stroke, item.stroke)))
        .map((item) => item.stroke),
    [pendingStrokes, activeStrokes, sheet]
  );
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
    const home = homeOf(undoTarget.id);
    if (source) source.eraseStroke(home.index, undoTarget.id);
    else erase.mutate({ sheet: home.index, strokeIds: [undoTarget.id], reason: "" });
  }

  function redo() {
    const entry = redoStack.at(-1);
    if (!entry) return;
    setRedoStack((current) => current.slice(0, -1));
    remember(entry.shape);
    sendStroke(entry.shape);
  }

  function updateStroke(strokeId: string, update: StrokeUpdate) {
    const home = homeOf(strokeId);
    const local: StrokeUpdate = update.changes ? { ...update, changes: shiftChanges(update.changes, -home.offset) } : update;
    if (source) return source.updateStroke(home.index, strokeId, local);
    updateMutation.mutate({ sheet: home.index, strokeId, update: local });
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
    return [...(activeStrokes ?? []), ...visiblePending].flatMap((stroke) => {
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
    return [x, freeTextBaseline({ x, y, size, lines, width, obstacles, maxBaseline: canvasHeight - 20 })];
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
    } else if (hasRichFormatting(draftLines)) {
      stroke = { type: "text", text: draftPlainText, x, y, size: textSize, color, lines: draftLines };
    } else {
      // Veb #212: uzun matn doska chetida yangi qatorga o'tadi (yonga cheksiz ketmaydi).
      const text = wrapToWidth(draftPlainText, boardWidth - x - 24, (value) => textWidth(value, textSize));
      stroke = { type: "text", text, x, y, size: textSize, color };
    }
    const target = place(stroke);
    if (source) {
      source.addStroke(target.sheet, target.shape);
      closePlacement();
      return;
    }
    addStroke.mutate({ sheet: target.sheet, stroke: target.shape }, { onSuccess: closePlacement, onError: (error) => toast.error(error.message) });
  }

  /**
   * Veb #213 (0903e0c, e82bead): o'chirish darhol, sabab so'ralmaydi (`reason`
   * bo'sh — o'quvchiga hech narsa ko'rsatilmaydi). Lentada elementlar o'z
   * sahifalari bo'yicha guruhlanadi.
   */
  function eraseNow(ids: string[]) {
    if (!ids.length) return;
    if (source) {
      ids.forEach((id) => source.eraseStroke(homeOf(id).index, id));
      return;
    }
    const bySheet = new Map<number, string[]>();
    for (const id of ids) {
      const index = homeOf(id).index;
      bySheet.set(index, [...(bySheet.get(index) ?? []), id]);
    }
    bySheet.forEach((strokeIds, index) => erase.mutate({ sheet: index, strokeIds, reason: "" }));
  }

  function deleteSelected(strokeId: string) {
    setSelectedId(null);
    eraseNow([strokeId]);
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
    const target = place<StrokeShapeDto>({ type: "text", text, x, y, size: BOARD_TEXT_SIZE, color });
    const done = () => {
      setFormulaOpen(false);
      setFormula("");
      setSolution(null);
    };
    if (source) {
      source.addStroke(target.sheet, target.shape);
      done();
      return;
    }
    addStroke.mutate({ sheet: target.sheet, stroke: target.shape }, { onSuccess: done });
  }

  const canAddPage = Boolean(source) || Boolean(state?.isTeacher && canDraw);
  const revealNewPage = useRef(false);
  const pageCount = lenta.pages.length;
  const lastOffset = lastPage.offset;

  function addPage() {
    revealNewPage.current = true;
    if (source) source.addSheet();
    else addSheet.mutate();
  }

  /** Ochilganda oxirgi (ishchi) sahifaga aylanadi — bir marta. */
  const lentaScrolled = useRef(false);
  useEffect(() => {
    if (lentaScrolled.current || !lastOffset || !card.height) return;
    lentaScrolled.current = true;
    const frame = requestAnimationFrame(() => canvasRef.current?.scrollToY(lastOffset - PAGE_REVEAL_MARGIN, false));
    return () => cancelAnimationFrame(frame);
  }, [lastOffset, card.height]);

  /** Yangi sahifa: "N-sahifa qo'shildi"; o'zim qo'shgan bo'lsam — o'sha sahifaga silliq aylanadi. */
  const knownPages = useRef<number | null>(null);
  const boardReady = Boolean(state);
  useEffect(() => {
    if (!boardReady) return;
    const known = knownPages.current;
    knownPages.current = pageCount;
    if (known === null || pageCount <= known) return;
    toast.success(t("sheet.pageAdded", { page: pageCount }));
    if (!revealNewPage.current) return;
    revealNewPage.current = false;
    const frame = requestAnimationFrame(() => canvasRef.current?.scrollToY(lastOffset - PAGE_REVEAL_MARGIN));
    return () => cancelAnimationFrame(frame);
  }, [pageCount, boardReady, lastOffset, t]);

  /** Sahifalar orasidagi chiziq va "N-sahifa" yorlig'i — `pendingStrokes` sifatida (tanlanmaydi, o'chmaydi). */
  const pageBreaks = useMemo<StrokeDto[]>(
    () =>
      lenta.pages.slice(1).flatMap((page, position) => {
        const label = t("sheet.page", { page: position + 2 });
        return [
          { id: `page-break-${page.index}`, type: "line", x1: 0, y1: page.offset, x2: boardWidth, y2: page.offset, color: ds.c.brand, width: 3 },
          {
            id: `page-label-${page.index}`,
            type: "text",
            text: label,
            // Chap chetda: doska balandligi bo'yicha sig'adi, o'ng qismi ekrandan tashqarida bo'lishi mumkin.
            x: FLOW_MARGIN,
            // Chiziq ostida: sahifaga o'tilganda yorliq ekran tepasidan chiqib ketmasin.
            y: page.offset + PAGE_LABEL_SIZE + 10,
            size: PAGE_LABEL_SIZE,
            color: ds.c.brand,
          },
        ] as StrokeDto[];
      }),
    [lenta.pages, boardWidth, ds.c.brand, t]
  );

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
        title={mobile.title ?? t("mobile.boardTitle")}
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
            pendingStrokes={[...pageBreaks, ...visiblePending]}
            width={state.width}
            height={canvasHeight}
            fit="height"
            fitHeight={boardHeight}
            dotColor={ds.c.line}
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            enabled={canDraw}
            onCommit={commitStroke}
            onPlacePoint={openPlacement}
            zoomControls
            eraserSize={eraserSize}
            onErase={eraseNow}
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
            showHistory={canDraw}
            canUndo={Boolean(undoTarget)}
            canRedo={redoStack.length > 0}
            onUndo={undo}
            onRedo={redo}
            onAdd={canAddPage ? addPage : undefined}
            adding={!source && addSheet.isPending}
          />
        )}
      </View>

      <Animated.View style={keyboardSpace} />

      {/* Oynalar ilova mavzusida (vebda portal orqali, `data-theme="light"` dan tashqarida). */}
      <ThemeScope scheme={null}>


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
