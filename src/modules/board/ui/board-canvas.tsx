import { useMemo, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Canvas, Group, Path, Points, Skia, vec } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { useDs } from "@/shared/ui";
import type { Point, StrokeDto, StrokeShapeDto } from "../api/board.dto";
import { buildStroke, MARKER_OPACITY, type DrawKind } from "../lib/board.geometry";
import { BoardStroke, hitTestStroke, useBoardFont } from "./board-stroke";
import type { BoardTool } from "./board-mobile";
import { MathMarkup } from "./math-markup";

export interface BoardCanvasProps {
  strokes: StrokeDto[];
  /** Doska koordinata tizimi (`state.width` / `state.height`). */
  width: number;
  height: number;
  tool: BoardTool;
  color: string;
  strokeWidth: number;
  enabled: boolean;
  onCommit: (stroke: StrokeShapeDto) => void;
  /** Matn/formula asboblari bosilganda — joylashtirish nuqtasi. */
  onPlacePoint: (point: Point) => void;
  /** "Tanlash" asbobida stroke bosilganda — o'chirish uchun. */
  onSelectStroke?: (strokeId: string | null) => void;
  selectedStrokeId?: string | null;
  /**
   * `contain` — doska butunligicha sig'adi (jonli dars ko'rinishi); `width` —
   * eni bo'yicha, tepaga tekislanadi (veb `.board-canvas { width: 100%; height: auto }`).
   */
  fit?: "contain" | "width";
  /** Nuqtali fon rangi — veb `radial-gradient(...) 28px 28px`, 6px siljigan. Kattalashtirishda joyida qoladi. */
  dotColor?: string;
}

/** Nuqtalar orasidagi masofa va birinchi nuqta (`background-position: 6px` + katakning yarmi). */
const DOT_STEP = 28;
/** Veb #161 `use-board-drawing`: bundan yaqin nuqtalar tashlanadi — chizish tezroq, stroke ixchamroq. */
const MIN_POINT_DISTANCE = 2;
const DOT_START = 6 + DOT_STEP / 2;

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
 * Ikki barmoq — pan/zoom. Bir barmoq — chizish. Shu sabab `maxPointers(1)`:
 * aks holda kattalashtirmoqchi bo'lgan foydalanuvchi doskaga chizib qo'yardi.
 */
export function BoardCanvas({
  strokes,
  width,
  height,
  tool,
  color,
  strokeWidth,
  enabled,
  onCommit,
  onPlacePoint,
  onSelectStroke,
  selectedStrokeId = null,
  fit: fitMode = "contain",
  dotColor,
}: BoardCanvasProps) {
  const font = useBoardFont();
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Ekrandagi o'lcham — doska koordinatalarini shunga moslashtiramiz.
  const viewWidth = useSharedValue(0);
  const viewHeight = useSharedValue(0);

  // Ko'rish o'zgarishi (pinch/pan). `base*` — jest boshlangandagi qiymat.
  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const baseTranslateX = useSharedValue(0);
  const baseTranslateY = useSharedValue(0);

  // Chizilayotgan chiziq — FAQAT UI thread'da.
  const draftPoints = useSharedValue<Point[]>([]);
  const draftStart = useSharedValue<Point>([0, 0]);
  const draftEnd = useSharedValue<Point>([0, 0]);

  const drawKind: DrawKind | null =
    tool === "text" || tool === "math" || tool === "erase" ? null : (tool as DrawKind);

  /** Doskani ekranga sig'dirish koeffitsienti. */
  const fit = useDerivedValue(() => {
    "worklet";
    const vw = viewWidth.get();
    const vh = viewHeight.get();
    if (vw === 0 || vh === 0) return 1;
    return fitMode === "width" ? vw / width : Math.min(vw / width, vh / height);
  });

  const draftPath = useDerivedValue(() => {
    "worklet";
    const path = Skia.Path.Make();
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
    return [
      { translateX: translateX.get() },
      { translateY: translateY.get() },
      { scale: fit.get() * scale.get() },
    ];
  });

  /** Barmoq uzilganda — bitta React yangilanishi va serverga yuborish. */
  function commitDraft(points: Point[], from: Point, to: Point) {
    if (!drawKind) return;
    const stroke = buildStroke({ kind: drawKind, from, to, points, color, width: strokeWidth });
    if (stroke) onCommit(stroke);
  }

  function handleTap(point: Point) {
    if (tool === "text" || tool === "math") {
      onPlacePoint(point);
      return;
    }
    if (tool === "erase" && onSelectStroke) {
      // Oxirgi chizilgani ustda turadi — teskari tartibda qidiramiz.
      const hit = [...strokes].reverse().find((stroke) => hitTestStroke(stroke, point));
      onSelectStroke(hit?.id ?? null);
    }
  }

  const drawGesture = Gesture.Pan()
    // Bitta barmoq — chizish; ikkitasi pan/zoom uchun qoladi.
    .maxPointers(1)
    .enabled(enabled && drawKind !== null)
    .onBegin((event) => {
      "worklet";
      const factor = fit.get() * scale.get();
      const point: Point = [
        (event.x - translateX.get()) / (factor || 1),
        (event.y - translateY.get()) / (factor || 1),
      ];
      draftStart.set(point);
      draftEnd.set(point);
      draftPoints.set([point]);
    })
    .onUpdate((event) => {
      "worklet";
      const factor = fit.get() * scale.get();
      const point: Point = [
        (event.x - translateX.get()) / (factor || 1),
        (event.y - translateY.get()) / (factor || 1),
      ];
      draftEnd.set(point);
      if (drawKind === "pen" || drawKind === "marker") {
        const points = draftPoints.get();
        const last = points[points.length - 1];
        // Massiv QAYTA YARATILADI — shared value o'zgarishini sezishi uchun.
        if (!last || Math.hypot(point[0] - last[0], point[1] - last[1]) >= MIN_POINT_DISTANCE) draftPoints.set([...points, point]);
      }
    })
    .onEnd(() => {
      "worklet";
      const points = draftPoints.get();
      const end = draftEnd.get();
      const last = points[points.length - 1];
      // Tashlab ketilgan oxirgi nuqta — chiziq barmoq turgan joyda tugasin.
      const finalPoints = last && (last[0] !== end[0] || last[1] !== end[1]) ? [...points, end] : points;
      runOnJS(commitDraft)(finalPoints, draftStart.get(), end);
      draftPoints.set([]);
      draftStart.set([0, 0]);
      draftEnd.set([0, 0]);
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(300)
    .onEnd((event) => {
      "worklet";
      const factor = fit.get() * scale.get();
      runOnJS(handleTap)([
        (event.x - translateX.get()) / (factor || 1),
        (event.y - translateY.get()) / (factor || 1),
      ]);
    });

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      "worklet";
      baseScale.set(scale.get());
    })
    .onUpdate((event) => {
      "worklet";
      // 1x dan kichraytirishga ruxsat yo'q — doska ekrandan kichrayib
      // "yo'qolib" ketmasin.
      scale.set(Math.min(5, Math.max(1, baseScale.get() * event.scale)));
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onBegin(() => {
      "worklet";
      baseTranslateX.set(translateX.get());
      baseTranslateY.set(translateY.get());
    })
    .onUpdate((event) => {
      "worklet";
      translateX.set(baseTranslateX.get() + event.translationX);
      translateY.set(baseTranslateY.get() + event.translationY);
    });

  const gesture = Gesture.Race(
    Gesture.Simultaneous(pinchGesture, panGesture),
    drawGesture,
    tapGesture
  );

  const draftOpacity = drawKind === "marker" ? MARKER_OPACITY : 1;

  /**
   * Formula (`type: "math"`) Skia'da chizilmaydi — u yerda LaTeX dvigateli
   * yo'q. Shuning uchun formulalar canvas USTIDAGI qatlamda, WebView bilan
   * chiziladi. WebView'ni `scale` bilan kichraytirib bo'lmaydi: Android uni
   * qayta chizganda (masalan Modal ochilganda) asl o'lchamiga qaytadi. Shu
   * sabab shrift o'lchami doska masshtabiga JS'da ko'paytiriladi, joyi esa
   * siljitish/kattalashtirishga UI thread'da ergashadi (`MathItem`).
   */
  const mathStrokes = useMemo(
    () => strokes.filter((stroke) => stroke.type === "math"),
    [strokes]
  );

  // Saqlangan stroke'lar React tomonda memo qilinadi — draft ularga tegmaydi.
  const rendered = useMemo(
    () =>
      strokes.map((stroke) => (
        <BoardStroke
          key={stroke.id}
          stroke={stroke}
          font={font}
          selected={stroke.id === selectedStrokeId}
        />
      )),
    [strokes, font, selectedStrokeId]
  );

  /** JS tomonidagi masshtab (kattalashtirishsiz) — formula shrifti uchun. */
  const mathScale = size.width && size.height ? (fitMode === "width" ? size.width / width : Math.min(size.width / width, size.height / height)) : 0;

  const dots = useMemo(() => {
    if (!dotColor || !size.width) return [];
    const points = [];
    for (let y = DOT_START; y < size.height; y += DOT_STEP) {
      for (let x = DOT_START; x < size.width; x += DOT_STEP) points.push(vec(x, y));
    }
    return points;
  }, [dotColor, size]);

  function handleLayout(event: LayoutChangeEvent) {
    const layout = event.nativeEvent.layout;
    viewWidth.set(layout.width);
    viewHeight.set(layout.height);
    setSize({ width: layout.width, height: layout.height });
  }

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <GestureDetector gesture={gesture}>
        <Canvas style={styles.canvas}>
          {dots.length ? <Points points={dots} mode="points" color={dotColor} style="stroke" strokeWidth={2.5} strokeCap="round" /> : null}
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
        </Canvas>
      </GestureDetector>

      {/* Formulalar — teginishni o'tkazib yuboradi, chizishga xalaqit bermaydi. */}
      {mathStrokes.length > 0 && mathScale ? (
        <View style={styles.mathLayer} pointerEvents="none">
          {mathStrokes.map((stroke) =>
            stroke.type === "math" ? (
              <MathItem key={stroke.id} stroke={stroke} mathScale={mathScale} fit={fit} zoom={scale} translateX={translateX} translateY={translateY} selected={stroke.id === selectedStrokeId} />
            ) : null
          )}
        </View>
      ) : null}
    </View>
  );
}

/** Veb `foreignObject`: `x`, `y - size`, eni 640 (doska birligida). */
function MathItem({
  stroke,
  mathScale,
  fit,
  zoom,
  translateX,
  translateY,
  selected,
}: {
  stroke: Extract<StrokeDto, { type: "math" }>;
  mathScale: number;
  fit: SharedValue<number>;
  zoom: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  selected: boolean;
}) {
  const ds = useDs();
  const size = stroke.size ?? 24;
  const position = useAnimatedStyle(() => {
    "worklet";
    const factor = fit.get() * zoom.get();
    // `left/top` emas: React qayta chizganda Reanimated layout xossalarini boshlang'ich qiymatga qaytarib qo'yadi.
    return { transform: [{ translateX: stroke.x * factor + translateX.get() }, { translateY: (stroke.y - size) * factor + translateY.get() }] };
  });
  return (
    <Animated.View style={[styles.mathItem, { width: 640 * mathScale }, position]}>
      <MathMarkup latex={stroke.latex} size={size * mathScale} framed={false} color={selected ? ds.c.danger : stroke.color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  canvas: { flex: 1 },
  mathLayer: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  mathItem: { position: "absolute", top: 0, left: 0 },
});
