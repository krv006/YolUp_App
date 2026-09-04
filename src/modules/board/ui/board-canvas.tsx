import { useMemo } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Canvas, Group, Path, Skia } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useTheme } from "@/shared/ui";
import type { Point, StrokeDto, StrokeShapeDto } from "../api/board.dto";
import { buildStroke, MARKER_OPACITY, type DrawKind } from "../lib/board.geometry";
import { BoardStroke, hitTestStroke, useBoardFont } from "./board-stroke";
import { MathMarkup } from "./math-field-sheet";
import type { BoardTool } from "./board-toolbar";

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
}: BoardCanvasProps) {
  const { palette } = useTheme();
  const font = useBoardFont();

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
    tool === "text" || tool === "math" || tool === "select" ? null : (tool as DrawKind);

  /** Doskani ekranga sig'dirish koeffitsienti. */
  const fit = useDerivedValue(() => {
    "worklet";
    const vw = viewWidth.get();
    const vh = viewHeight.get();
    if (vw === 0 || vh === 0) return 1;
    return Math.min(vw / width, vh / height);
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
    if (tool === "select" && onSelectStroke) {
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
        // Massiv QAYTA YARATILADI — shared value o'zgarishini sezishi uchun.
        draftPoints.set([...draftPoints.get(), point]);
      }
    })
    .onEnd(() => {
      "worklet";
      runOnJS(commitDraft)(draftPoints.get(), draftStart.get(), draftEnd.get());
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

  /** Canvas bilan bir xil transform — formula qatlami uni takrorlaydi. */
  const overlayStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [
        { translateX: translateX.get() },
        { translateY: translateY.get() },
        { scale: fit.get() * scale.get() },
      ],
    };
  });

  const draftOpacity = drawKind === "marker" ? MARKER_OPACITY : 1;

  /**
   * Formula (`type: "math"`) Skia'da chizilmaydi — u yerda LaTeX dvigateli
   * yo'q. Shuning uchun formulalar canvas USTIDAGI qatlamda, WebView bilan
   * chiziladi va canvas bilan BIR XIL transform'ga bo'ysunadi (pastdagi
   * `overlayStyle`), ya'ni kattalashtirilganda ular ham birga suriladi.
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

  function handleLayout(event: LayoutChangeEvent) {
    viewWidth.set(event.nativeEvent.layout.width);
    viewHeight.set(event.nativeEvent.layout.height);
  }

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <GestureDetector gesture={gesture}>
        <Canvas style={[styles.canvas, { backgroundColor: palette.surface }]}>
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
      {mathStrokes.length > 0 ? (
        <Animated.View style={[styles.mathLayer, overlayStyle]} pointerEvents="none">
          {mathStrokes.map((stroke) =>
            stroke.type === "math" ? (
              <View
                key={stroke.id}
                style={[
                  styles.mathItem,
                  { left: stroke.x, top: stroke.y - (stroke.size ?? 20) },
                ]}
              >
                <MathMarkup latex={stroke.latex} size={stroke.size ?? 20} />
              </View>
            ) : null
          )}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  canvas: { flex: 1 },
  // Canvas ustidagi qatlam: transform origini chap-yuqori burchakda
  // bo'lishi shart, aks holda formulalar canvas bilan bir joyda turmaydi.
  mathLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    transformOrigin: "0 0",
  },
  mathItem: { position: "absolute", minWidth: 120 },
});
