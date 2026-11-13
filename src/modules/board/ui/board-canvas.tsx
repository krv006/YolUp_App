import { useImperativeHandle, useMemo, useState, type Ref } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Canvas, Circle, FillType, Group, Path, Points, Skia, vec } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { useDs } from "@/shared/ui";
import type { Point, StrokeDto, StrokeShapeDto } from "../api/board.dto";
import { ERASER_SIZES } from "../constants/board.constants";
import { buildStroke, MARKER_OPACITY, type DrawKind } from "../lib/board.geometry";
import { measureStroke, type MathSize } from "../lib/board-measure";
import { resizedBox, resizeHandles } from "../lib/board-resize";
import { BOARD_ZOOM, clampZoom } from "../lib/board-zoom";
import { useBoardEraser } from "../model/use-board-eraser";
import { useBoardSelection } from "../model/use-board-selection";
import type { BoardTool } from "./board-mobile";
import { BoardStroke } from "./board-stroke";
import { BoardZoomControls } from "./board-zoom-controls";
import { MathMarkup } from "./math-markup";
import { SelectionOverlay } from "./selection-overlay";

/** Kanvas tashqarisidan kerak bo'ladigan amallar (joylashtirish oynasi joyi uchun). */
export interface BoardCanvasHandle {
  /** Doska nuqtasining kanvas ichidagi (ekran) joyi — zoom va siljish hisobga olinadi. */
  toView: (point: Point) => Point;
}

/** "Tanlash" vositasi — tanlangan element ota komponentda (pastdagi panel uchun). */
export interface BoardCanvasSelection {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  canEdit: (stroke: StrokeDto) => boolean;
  /** Birovning elementi bosildi (o'quvchi faqat o'zinikini tahrirlaydi). */
  onDenied: () => void;
  onMove: (id: string, delta: [number, number]) => void;
  onResize: (id: string, changes: Record<string, number>) => void;
  onDraggingChange?: (dragging: boolean) => void;
  /** Ramka ostidagi yozuv: muallif va kim tahrirlagani. */
  label?: string;
}

export interface BoardCanvasProps {
  ref?: Ref<BoardCanvasHandle>;
  strokes: StrokeDto[];
  /** Doska koordinata tizimi (`state.width` / `state.height`). */
  width: number;
  height: number;
  tool: BoardTool;
  color: string;
  strokeWidth: number;
  enabled: boolean;
  onCommit: (stroke: StrokeShapeDto) => void;
  /** Matn/formula/kod asboblari bosilganda — joylashtirish nuqtasi. */
  onPlacePoint: (point: Point) => void;
  /** O'chirish kutilayotgan elementlar (sabab oynasi ochiq) — xira ko'rinadi. */
  markedStrokeIds?: readonly string[];
  /**
   * `contain` — doska butunligicha sig'adi (jonli dars ko'rinishi); `width` —
   * eni bo'yicha, tepaga tekislanadi (veb `.board-canvas { width: 100%; height: auto }`);
   * `height` — balandligi bo'yicha: tik telefonda 16:9 doska kattaroq ko'rinadi,
   * yon tomonlariga ikki barmoq bilan suriladi (loyiha egasi qarori, 2026-11-13).
   */
  fit?: "contain" | "width" | "height";
  /** Nuqtali fon rangi — veb `radial-gradient(...) 28px 28px`, 6px siljigan. Kattalashtirishda joyida qoladi. */
  dotColor?: string;
  /** "− 100% +" tugmalari (veb `BoardZoomControls`). */
  zoomControls?: boolean;
  /** O'chirg'ich radiusi (ekran px) — `ERASER_SIZES`. */
  eraserSize?: number;
  /** O'chirg'ich qo'yib yuborilganda tekkan elementlar. */
  onErase?: (ids: string[]) => void;
  selection?: BoardCanvasSelection;
}

/** Nuqtalar orasidagi masofa va birinchi nuqta (`background-position: 6px` + katakning yarmi). */
const DOT_STEP = 28;
/** Veb #161 `use-board-drawing`: bundan yaqin nuqtalar tashlanadi — chizish tezroq, stroke ixchamroq. */
const MIN_POINT_DISTANCE = 2;
const DOT_START = 6 + DOT_STEP / 2;
const ZOOM_MIN = BOARD_ZOOM.min;
const ZOOM_MAX = BOARD_ZOOM.max;
const DRAW_KINDS: readonly BoardTool[] = ["pen", "marker", "line", "arrow", "rect", "ellipse"];
const PLACED_TOOLS: readonly BoardTool[] = ["text", "math", "code"];
const ERASER_FILL = "rgba(127, 127, 127, 0.12)";

function ignore() {}

/** Kontent ko'rinishdan kichik bo'lsa markazda, katta bo'lsa chetlari ichkarida qoladi. */
function clampAxis(offset: number, content: number, view: number): number {
  "worklet";
  if (content <= view) return (view - content) / 2;
  return Math.min(0, Math.max(view - content, offset));
}

/**
 * Doska maydoni — veb `board-panel.tsx` dagi SVG canvas'ning mobil varianti.
 *
 * ⚠️ ARXITEKTURA FARQI (MOBILE_PLAN §7.1):
 *
 * Veb versiyada har `pointermove` da React state yangilanardi. Mobilda bu
 * low-end Androidda ~15 FPS beradi — barmoq chiziqdan uzoqlashib ketadi.
 *
 * Shuning uchun chizilayotgan chiziq (`draft`) UI THREAD'da yashaydi:
 * nuqtalar shared value'da to'planadi, yo'l `useDerivedValue` worklet'ida
 * quriladi va Skia uni React'ga umuman chiqmasdan chizadi. React state
 * faqat barmoq uzilganda, BIR MARTA yangilanadi.
 *
 * Shared value'lar `.get()`/`.set()` bilan ishlatiladi (`.value` emas):
 * React Compiler `.value` ga yozishni "o'zgarmas qiymatni o'zgartirish" deb
 * hisoblaydi va komponentni optimallashtirishdan voz kechadi. Reanimated
 * aynan shu sabab bu API'ni qo'shgan.
 *
 * Bir barmoq — chizish, o'chirg'ich yoki tanlangan elementni surish. Ikki
 * barmoq — zoom (50–300%, barmoqlar ostidagi nuqta joyida qoladi) va
 * siljitish; ikkinchi barmoq tekkanda boshlangan chiziq BEKOR qilinadi
 * (veb #190: `gestureCancel`). Bosish — matn/formula/kod joyi, tanlash
 * yoki aylana ostidagini o'chirish.
 */
export function BoardCanvas({
  ref,
  strokes,
  width,
  height,
  tool,
  color,
  strokeWidth,
  enabled,
  onCommit,
  onPlacePoint,
  markedStrokeIds,
  fit: fitMode = "contain",
  dotColor,
  zoomControls = false,
  eraserSize = ERASER_SIZES[1].value,
  onErase,
  selection,
}: BoardCanvasProps) {
  const ds = useDs();
  const [size, setSize] = useState({ width: 0, height: 0 });
  /** Formula shrifti uchun zoom — pinch tugagach yangilanadi (WebView'ni masshtablab bo'lmaydi). */
  const [mathZoom, setMathZoom] = useState(1);
  const [mathSizes, setMathSizes] = useState<Record<string, MathSize>>({});

  // Ekrandagi o'lcham — doska koordinatalarini shunga moslashtiramiz.
  const viewWidth = useSharedValue(0);
  const viewHeight = useSharedValue(0);

  // Ko'rish o'zgarishi: zoom va siljish (ekran px).
  const zoom = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Chizilayotgan chiziq — FAQAT UI thread'da.
  const draftPoints = useSharedValue<Point[]>([]);
  const draftStart = useSharedValue<Point>([0, 0]);
  const draftEnd = useSharedValue<Point>([0, 0]);
  /** Barmoq tekkan nuqta (doska birligida) — sudrash faollashganda boshlanish nuqtasi. */
  const touchStart = useSharedValue<Point>([0, 0]);
  /** Chiziq doska ichida boshlandimi (kichraytirilganda atrofdagi bo'sh joyda chizilmaydi). */
  const drawing = useSharedValue(0);
  /** O'chirg'ich aylanasi (ekran px). */
  const eraserAt = useSharedValue<Point>([0, 0]);
  const eraserShown = useSharedValue(0);

  const drawKind: DrawKind | null = DRAW_KINDS.includes(tool) ? (tool as DrawKind) : null;
  const isDraw = drawKind !== null;
  const isErase = tool === "erase" && Boolean(onErase);
  const isSelect = tool === "select" && Boolean(selection);

  /** Doskani ekranga sig'dirish koeffitsienti. */
  const fit = useDerivedValue(() => {
    "worklet";
    const vw = viewWidth.get();
    const vh = viewHeight.get();
    if (vw === 0 || vh === 0) return 1;
    if (fitMode === "height") return vh / height;
    return fitMode === "width" ? vw / width : Math.min(vw / width, vh / height);
  });
  /*
   * Eng kichik zoom: vebdagi 50%, lekin `height` rejimida doska butunligicha
   * ko'rinadigan darajagacha kichraytirish mumkin (tik telefonda ~38%).
   */
  const minZoom = useDerivedValue(() => {
    "worklet";
    const vw = viewWidth.get();
    const vh = viewHeight.get();
    if (vw === 0 || vh === 0 || fitMode !== "height") return ZOOM_MIN;
    return Math.min(ZOOM_MIN, Math.min(vw / width, vh / height) / (vh / height));
  });
  /** Ekran px / doska birligi. */
  const factor = useDerivedValue(() => {
    "worklet";
    return fit.get() * zoom.get();
  });

  function measure(stroke: StrokeDto) {
    return measureStroke(stroke, stroke.type === "math" ? mathSizes[stroke.id] : undefined);
  }

  const select = useBoardSelection({
    strokes,
    sheet: { width, height },
    selectedId: selection?.selectedId ?? null,
    active: isSelect && enabled,
    measure,
    canEdit: selection?.canEdit ?? (() => false),
    onSelect: selection?.onSelect ?? ignore,
    onMove: selection?.onMove ?? ignore,
    onResize: selection?.onResize ?? ignore,
    onDenied: selection?.onDenied ?? ignore,
    onDraggingChange: selection?.onDraggingChange,
  });
  const eraser = useBoardEraser({ strokes, measure, onErase: onErase ?? ignore });

  useImperativeHandle(
    ref,
    () => ({
      toView: ([x, y]: Point): Point => {
        const f = fit.get() * zoom.get();
        return [x * f + translateX.get(), y * f + translateY.get()];
      },
    }),
    [fit, zoom, translateX, translateY]
  );

  const draftPath = useDerivedValue(() => {
    "worklet";
    const path = Skia.Path.Make();
    // Barmoq tegmaganda bo'sh: aks holda (0, 0) da nol uzunlikdagi chiziq nuqta bo'lib ko'rinadi.
    if (!drawing.get()) return path;
    const start = draftStart.get();
    const end = draftEnd.get();

    // Sudrab chiziladigan shakllar — boshi va oxiridan quriladi.
    if (drawKind === "line" || drawKind === "arrow") {
      path.moveTo(start[0], start[1]);
      path.lineTo(end[0], end[1]);
      return path;
    }
    if (drawKind === "rect" || drawKind === "ellipse") {
      const x = Math.min(start[0], end[0]);
      const y = Math.min(start[1], end[1]);
      const w = Math.abs(end[0] - start[0]);
      const h = Math.abs(end[1] - start[1]);
      if (drawKind === "rect") path.addRect({ x, y, width: w, height: h });
      else path.addOval({ x, y, width: w, height: h });
      return path;
    }

    // Qalam / marker — erkin chiziq.
    const points = draftPoints.get();
    if (points.length === 0) return path;
    path.moveTo(points[0]![0], points[0]![1]);
    for (let index = 1; index < points.length; index += 1) {
      path.lineTo(points[index]![0], points[index]![1]);
    }
    return path;
  });

  const canvasTransform = useDerivedValue(() => {
    "worklet";
    return [{ translateX: translateX.get() }, { translateY: translateY.get() }, { scale: factor.get() }];
  });

  function toBoard(x: number, y: number): Point {
    "worklet";
    const f = fit.get() * zoom.get() || 1;
    return [(x - translateX.get()) / f, (y - translateY.get()) / f];
  }

  /** Server nuqtalarni doska chegarasiga qisadi — tashqarida boshlangan chiziq/joy qabul qilinmaydi. */
  function insideBoard([x, y]: Point): boolean {
    "worklet";
    return x >= 0 && y >= 0 && x <= width && y <= height;
  }

  function clampView() {
    "worklet";
    const f = fit.get() * zoom.get();
    translateX.set(clampAxis(translateX.get(), width * f, viewWidth.get()));
    translateY.set(clampAxis(translateY.get(), height * f, viewHeight.get()));
  }

  /**
   * Tugmalar: ko'rinish markazi atrofida (veb `zoomBy` — markaz joyida qoladi).
   *
   * Hisob UI oqimida: JS oqimida `zoom.set()` dan keyingi `zoom.get()` eski
   * qiymatni qaytarardi va `clampView` doskani eski zoom uchun markazlashtirib
   * qo'yardi (40% dan 100% ga qaytganda doska pastga siljib qolardi).
   */
  function zoomOnUI(next: number) {
    "worklet";
    const current = zoom.get();
    if (next === current) return;
    const ratio = next / current;
    const cx = viewWidth.get() / 2;
    const cy = viewHeight.get() / 2;
    translateX.set(cx - (cx - translateX.get()) * ratio);
    translateY.set(cy - (cy - translateY.get()) * ratio);
    zoom.set(next);
    clampView();
  }

  function zoomTo(next: number) {
    runOnUI(zoomOnUI)(next);
    setMathZoom(next);
  }

  /** Barmoq uzilganda — bitta React yangilanishi va serverga yuborish. */
  function commitDraft(points: Point[], from: Point, to: Point) {
    if (!drawKind) return;
    const stroke = buildStroke({ kind: drawKind, from, to, points, color, width: strokeWidth });
    if (stroke) onCommit(stroke);
  }

  // Worklet'lardan `runOnJS` bilan chaqiriladigan JS funksiyalar.
  function eraseStart(point: Point, radius: number) {
    eraser.start(point, radius);
  }
  function eraseMove(point: Point, radius: number) {
    eraser.move(point, radius);
  }
  function eraseEnd(commit: boolean) {
    eraser.end(commit);
  }
  function selectBegin(point: Point, scale: number) {
    select.begin(point, scale);
  }
  function selectMove(point: Point) {
    select.move(point);
  }
  function selectEnd(commit: boolean) {
    select.end(commit);
  }

  function handleTap(point: Point, scale: number) {
    if (PLACED_TOOLS.includes(tool)) {
      if (insideBoard(point)) onPlacePoint(point);
      return;
    }
    if (isErase) eraser.tap(point, eraserSize / scale);
    else if (isSelect) select.tap(point, scale);
  }

  const singleGesture = Gesture.Pan()
    // Bitta barmoq; ikkinchisi tekkanda gesture bekor bo'ladi (`success = false`).
    .maxPointers(1)
    .enabled(enabled && (isDraw || isErase || isSelect))
    .onBegin((event) => {
      "worklet";
      const point = toBoard(event.x, event.y);
      touchStart.set(point);
      drawing.set(isDraw && insideBoard(point) ? 1 : 0);
      if (drawing.get()) {
        draftStart.set(point);
        draftEnd.set(point);
        draftPoints.set([point]);
      } else if (isErase) {
        eraserAt.set([event.x, event.y]);
        eraserShown.set(1);
      }
    })
    .onStart(() => {
      "worklet";
      const scale = fit.get() * zoom.get() || 1;
      if (isErase) runOnJS(eraseStart)(touchStart.get(), eraserSize / scale);
      else if (isSelect) runOnJS(selectBegin)(touchStart.get(), scale);
    })
    .onUpdate((event) => {
      "worklet";
      const point = toBoard(event.x, event.y);
      if (isDraw) {
        if (!drawing.get()) return;
        draftEnd.set(point);
        if (drawKind === "pen" || drawKind === "marker") {
          const points = draftPoints.get();
          const last = points[points.length - 1];
          // Massiv QAYTA YARATILADI — shared value o'zgarishini sezishi uchun.
          if (!last || Math.hypot(point[0] - last[0], point[1] - last[1]) >= MIN_POINT_DISTANCE) draftPoints.set([...points, point]);
        }
      } else if (isErase) {
        eraserAt.set([event.x, event.y]);
        runOnJS(eraseMove)(point, eraserSize / (fit.get() * zoom.get() || 1));
      } else if (isSelect) {
        runOnJS(selectMove)(point);
      }
    })
    .onEnd((_event, success) => {
      "worklet";
      if (isDraw) {
        // Ikkinchi barmoq tekkan bo'lsa (`success = false`) chiziq yuborilmaydi.
        if (!success || !drawing.get()) return;
        const points = draftPoints.get();
        const end = draftEnd.get();
        const last = points[points.length - 1];
        // Tashlab ketilgan oxirgi nuqta — chiziq barmoq turgan joyda tugasin.
        const finalPoints = last && (last[0] !== end[0] || last[1] !== end[1]) ? [...points, end] : points;
        runOnJS(commitDraft)(finalPoints, draftStart.get(), end);
      } else if (isErase) {
        runOnJS(eraseEnd)(success);
      } else if (isSelect) {
        runOnJS(selectEnd)(success);
      }
    })
    .onFinalize(() => {
      "worklet";
      // Faollashmagan (bosish) yoki bekor qilingan chiziq ham tozalanadi.
      drawing.set(0);
      draftPoints.set([]);
      draftStart.set([0, 0]);
      draftEnd.set([0, 0]);
      eraserShown.set(0);
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(300)
    .maxDistance(12)
    .enabled(enabled)
    .onEnd((event, success) => {
      "worklet";
      if (!success) return;
      runOnJS(handleTap)(toBoard(event.x, event.y), fit.get() * zoom.get() || 1);
    });

  // Zoom barmoqlar o'rtasi atrofida (`scaleChange` — oldingi hodisaga nisbatan).
  const pinchGesture = Gesture.Pinch()
    .onChange((event) => {
      "worklet";
      const current = zoom.get();
      const next = Math.min(ZOOM_MAX, Math.max(minZoom.get(), current * event.scaleChange));
      const ratio = next / current;
      translateX.set(event.focalX - (event.focalX - translateX.get()) * ratio);
      translateY.set(event.focalY - (event.focalY - translateY.get()) * ratio);
      zoom.set(next);
      clampView();
    })
    .onEnd(() => {
      "worklet";
      runOnJS(setMathZoom)(zoom.get());
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onChange((event) => {
      "worklet";
      translateX.set(translateX.get() + event.changeX);
      translateY.set(translateY.get() + event.changeY);
      clampView();
    });

  /*
   * `Simultaneous`: ikki barmoqli zoom bir barmoqli gesture'ni kutmaydi.
   * Bir barmoqli gesture `maxPointers(1)` sabab ikkinchi barmoqda o'zi
   * bekor bo'ladi, keyin pinch ishlaydi (avval `Race` edi — chizish
   * boshlangan bo'lsa pinch shu teginishda umuman ishlamasdi).
   */
  const gesture = Gesture.Simultaneous(Gesture.Simultaneous(pinchGesture, panGesture), Gesture.Race(singleGesture, tapGesture));

  const draftOpacity = drawKind === "marker" ? MARKER_OPACITY : 1;
  const erasingIds = eraser.erasing;
  const drag = select.drag;

  /**
   * Formula (`type: "math"`) Skia'da chizilmaydi — u yerda LaTeX dvigateli
   * yo'q. Shuning uchun formulalar canvas USTIDAGI qatlamda, WebView bilan
   * chiziladi. WebView'ni `scale` bilan kichraytirib bo'lmaydi: Android uni
   * qayta chizganda (masalan Modal ochilganda) asl o'lchamiga qaytadi. Shu
   * sabab shrift o'lchami doska masshtabiga JS'da ko'paytiriladi, joyi esa
   * siljitish/kattalashtirishga UI thread'da ergashadi (`MathItem`).
   */
  const mathStrokes = useMemo(() => strokes.filter((stroke) => stroke.type === "math"), [strokes]);

  // Saqlangan stroke'lar React tomonda memo qilinadi — draft ularga tegmaydi.
  const rendered = useMemo(() => {
    const marked = new Set(markedStrokeIds ?? []);
    const fading = new Set(erasingIds ?? []);
    return strokes.map((stroke) => {
      if (stroke.type === "math") return null;
      if (drag?.kind === "resize" && drag.id === stroke.id) return <BoardStroke key={stroke.id} stroke={drag.stroke} />;
      const node = <BoardStroke key={stroke.id} stroke={stroke} selected={marked.has(stroke.id)} />;
      if (drag?.kind === "move" && drag.id === stroke.id) {
        return (
          <Group key={stroke.id} transform={[{ translateX: drag.dx }, { translateY: drag.dy }]}>
            {node}
          </Group>
        );
      }
      return fading.has(stroke.id) ? (
        <Group key={stroke.id} opacity={0.25}>
          {node}
        </Group>
      ) : (
        node
      );
    });
  }, [strokes, markedStrokeIds, erasingIds, drag]);

  /** JS tomonidagi masshtab (kattalashtirishsiz) — formula shrifti uchun. */
  const mathScale =
    size.width && size.height
      ? fitMode === "height"
        ? size.height / height
        : fitMode === "width"
          ? size.width / width
          : Math.min(size.width / width, size.height / height)
      : 0;

  function handleMathMeasure(id: string, measured: MathSize) {
    setMathSizes((current) => {
      const previous = current[id];
      if (previous && Math.abs(previous.width - measured.width) < 0.5 && Math.abs(previous.height - measured.height) < 0.5) return current;
      return { ...current, [id]: measured };
    });
  }

  const dots = useMemo(() => {
    if (!dotColor || !size.width) return [];
    const points = [];
    for (let y = DOT_START; y < size.height; y += DOT_STEP) {
      for (let x = DOT_START; x < size.width; x += DOT_STEP) points.push(vec(x, y));
    }
    return points;
  }, [dotColor, size]);

  /** Kichraytirilganda doska tashqarisi (ko'rinish minus doska) — fon rangida. */
  const outside = useDerivedValue(() => {
    "worklet";
    const f = factor.get();
    const path = Skia.Path.Make();
    path.addRect(Skia.XYWHRect(0, 0, viewWidth.get(), viewHeight.get()));
    path.addRect(Skia.XYWHRect(translateX.get(), translateY.get(), width * f, height * f));
    path.setFillType(FillType.EvenOdd);
    return path;
  });

  const eraserX = useDerivedValue(() => {
    "worklet";
    return eraserAt.get()[0];
  });
  const eraserY = useDerivedValue(() => {
    "worklet";
    return eraserAt.get()[1];
  });

  function handleLayout(event: LayoutChangeEvent) {
    const layout = event.nativeEvent.layout;
    viewWidth.set(layout.width);
    viewHeight.set(layout.height);
    // O'lcham o'zgarsa (burilish) doska ko'rinishdan chiqib qolmasin.
    if (zoom.get() !== 1) clampView();
    setSize({ width: layout.width, height: layout.height });
  }

  const selected = select.selected;
  const overlayBox = select.box && drag?.kind === "resize" ? resizedBox(select.box, drag.stroke) : select.box;

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <GestureDetector gesture={gesture}>
        <Canvas style={styles.canvas}>
          {dots.length ? <Points points={dots} mode="points" color={dotColor} style="stroke" strokeWidth={2.5} strokeCap="round" /> : null}
          {zoomControls ? <Path path={outside} color={ds.c.subtle} /> : null}
          <Group transform={canvasTransform}>
            {rendered}
            <Path
              path={draftPath}
              color={color}
              style="stroke"
              strokeWidth={strokeWidth}
              strokeCap="round"
              strokeJoin="round"
              opacity={draftOpacity}
            />
          </Group>
          {selected && overlayBox ? (
            <SelectionOverlay
              box={overlayBox}
              offset={drag?.kind === "move" ? [drag.dx, drag.dy] : undefined}
              label={selection?.label}
              handles={resizeHandles(drag?.kind === "resize" ? drag.stroke : selected, overlayBox)}
              factor={factor}
              translateX={translateX}
              translateY={translateY}
            />
          ) : null}
          {isErase ? (
            <Group opacity={eraserShown}>
              <Circle cx={eraserX} cy={eraserY} r={eraserSize} color={ERASER_FILL} />
              <EraserRing cx={eraserX} cy={eraserY} r={eraserSize} />
            </Group>
          ) : null}
        </Canvas>
      </GestureDetector>

      {/* Formulalar — teginishni o'tkazib yuboradi, chizishga xalaqit bermaydi. */}
      {mathStrokes.length > 0 && mathScale ? (
        <View style={styles.mathLayer} pointerEvents="none">
          {mathStrokes.map((stroke) =>
            stroke.type === "math" ? (
              <MathItem
                key={stroke.id}
                stroke={stroke}
                mathScale={mathScale * mathZoom}
                factor={factor}
                translateX={translateX}
                translateY={translateY}
                offset={drag?.kind === "move" && drag.id === stroke.id ? [drag.dx, drag.dy] : null}
                selected={Boolean(markedStrokeIds?.includes(stroke.id))}
                faded={Boolean(erasingIds?.includes(stroke.id))}
                onMeasure={handleMathMeasure}
              />
            ) : null
          )}
        </View>
      ) : null}

      {zoomControls ? (
        <BoardZoomControls
          zoom={zoom}
          minZoom={minZoom}
          onZoomIn={() => zoomTo(clampZoom(zoom.get() * BOARD_ZOOM.step))}
          onZoomOut={() => zoomTo(Math.max(Math.round(minZoom.get() * 100) / 100, Math.round((zoom.get() / BOARD_ZOOM.step) * 100) / 100))}
          onReset={() => zoomTo(1)}
        />
      ) : null}
    </View>
  );
}

/** O'chirg'ich aylanasi chegarasi — veb `.board-eraser { stroke: var(--muted-foreground) }`. */
function EraserRing({ cx, cy, r }: { cx: SharedValue<number>; cy: SharedValue<number>; r: number }) {
  const ds = useDs();
  return <Circle cx={cx} cy={cy} r={r} color={ds.c["ink-secondary"]} style="stroke" strokeWidth={1.5} />;
}

/** Veb `foreignObject`: `x`, `y - size`, eni 640 (doska birligida). */
function MathItem({
  stroke,
  mathScale,
  factor,
  translateX,
  translateY,
  offset,
  selected,
  faded,
  onMeasure,
}: {
  stroke: Extract<StrokeDto, { type: "math" }>;
  /** Doska birligidan WebView px'iga (fit × oxirgi zoom). */
  mathScale: number;
  factor: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  offset: [number, number] | null;
  selected: boolean;
  faded: boolean;
  onMeasure: (id: string, size: MathSize) => void;
}) {
  const ds = useDs();
  const size = stroke.size ?? 24;
  const dx = offset?.[0] ?? 0;
  const dy = offset?.[1] ?? 0;
  const position = useAnimatedStyle(() => {
    "worklet";
    const f = factor.get();
    // `left/top` emas: React qayta chizganda Reanimated layout xossalarini boshlang'ich qiymatga qaytarib qo'yadi.
    return { transform: [{ translateX: (stroke.x + dx) * f + translateX.get() }, { translateY: (stroke.y + dy - size) * f + translateY.get() }] };
  });
  return (
    <Animated.View style={[styles.mathItem, { width: 640 * mathScale, opacity: faded ? 0.25 : 1 }, position]}>
      <MathMarkup
        latex={stroke.latex}
        size={size * mathScale}
        framed={false}
        color={selected ? ds.c.danger : stroke.color}
        onMeasure={(measured) => onMeasure(stroke.id, { width: measured.width / mathScale, height: measured.height / mathScale })}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  canvas: { flex: 1 },
  mathLayer: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  mathItem: { position: "absolute", top: 0, left: 0 },
});
