import { DashPathEffect, Group, Path, Skia, Text as SkiaText } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import type { StrokeBox } from "../lib/board-edit";
import type { HandlePoint } from "../lib/board-resize";
import { boardFont } from "./board-font";

export interface SelectionOverlayProps {
  box: StrokeBox;
  offset?: [number, number];
  label?: string;
  handles?: HandlePoint[];
  /** Ko'rinish o'zgarishi: ekran px / doska birligi va siljish. */
  factor: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
}

const ACCENT = "#5b5cf0";
const PAD_PX = 6;
const HANDLE_PX = 12;
const LABEL_PX = 12;

/**
 * Tanlash ramkasi — veb `selection-overlay.tsx`: uzuq chiziqli ramka,
 * o'lcham tutqichlari va muallif. Vebda `vector-effect: non-scaling-stroke`
 * va `/ scale`; bu yerda ramka EKRAN koordinatasida (UI thread'da)
 * quriladi, shuning uchun kattalashtirilganda ham chiziq, tutqich va
 * yozuv o'lchami o'zgarmaydi. Mobilda tutqich biroz kattaroq (barmoq).
 */
export function SelectionOverlay({
  box,
  offset = [0, 0],
  label,
  handles = [],
  factor,
  translateX,
  translateY,
}: SelectionOverlayProps) {
  const font = boardFont(LABEL_PX);

  const frame = useDerivedValue(() => {
    "worklet";
    const f = factor.get();
    const x = (box.minX + offset[0]) * f + translateX.get() - PAD_PX;
    const y = (box.minY + offset[1]) * f + translateY.get() - PAD_PX;
    const path = Skia.Path.Make();
    path.addRRect(
      Skia.RRectXY(
        Skia.XYWHRect(
          x,
          y,
          (box.maxX - box.minX) * f + PAD_PX * 2,
          (box.maxY - box.minY) * f + PAD_PX * 2
        ),
        4,
        4
      )
    );
    return path;
  });

  const knobs = useDerivedValue(() => {
    "worklet";
    const f = factor.get();
    const path = Skia.Path.Make();
    for (const handle of handles) {
      const x = (handle.point[0] + offset[0]) * f + translateX.get();
      const y = (handle.point[1] + offset[1]) * f + translateY.get();
      path.addRRect(
        Skia.RRectXY(
          Skia.XYWHRect(x - HANDLE_PX / 2, y - HANDLE_PX / 2, HANDLE_PX, HANDLE_PX),
          2,
          2
        )
      );
    }
    return path;
  });

  const labelX = useDerivedValue(() => {
    "worklet";
    return (box.minX + offset[0]) * factor.get() + translateX.get() - PAD_PX;
  });
  const labelY = useDerivedValue(() => {
    "worklet";
    return (box.maxY + offset[1]) * factor.get() + translateY.get() + PAD_PX + LABEL_PX + 4;
  });

  return (
    <Group>
      <Path path={frame} color="rgba(91, 92, 240, 0.06)" />
      <Path path={frame} color={ACCENT} style="stroke" strokeWidth={1.5}>
        <DashPathEffect intervals={[6, 4]} />
      </Path>
      {handles.length ? (
        <>
          <Path path={knobs} color="#ffffff" />
          <Path path={knobs} color={ACCENT} style="stroke" strokeWidth={1.5} />
        </>
      ) : null}
      {label ? <SkiaText x={labelX} y={labelY} text={label} font={font} color={ACCENT} /> : null}
    </Group>
  );
}
