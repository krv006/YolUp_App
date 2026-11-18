import { useMemo } from "react";
import { Path, Skia } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { BOARD_GUIDE_CELL } from "../constants/board.constants";

/** Veb `stroke="rgb(100 116 139 / 0.22)"`. */
const GUIDE_COLOR = "rgba(100, 116, 139, 0.22)";

/**
 * Yordamchi katak — veb `board-guides.tsx` (SVG `pattern`). Skia'da
 * doska koordinatasida chiziqlar yo'li: har `BOARD_GUIDE_CELL` birlikda
 * tik va yotiq chiziq, kanvas transformatsiyasi ichida — doska bilan birga
 * siljiydi va kattalashadi. Vebdagi `vector-effect: non-scaling-stroke`
 * o'rniga qalinlik `1 / factor`: zoomda ham ekranda 1 px qoladi.
 * Faqat ko'rinish: stroke emas, PDF va boshqa ishtirokchilarga tushmaydi.
 */
export function BoardGuides({ width, height, factor }: { width: number; height: number; factor: SharedValue<number> }) {
  const path = useMemo(() => {
    const grid = Skia.Path.Make();
    for (let x = 0; x < width; x += BOARD_GUIDE_CELL) {
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
    }
    for (let y = 0; y < height; y += BOARD_GUIDE_CELL) {
      grid.moveTo(0, y);
      grid.lineTo(width, y);
    }
    return grid;
  }, [width, height]);
  const strokeWidth = useDerivedValue(() => {
    "worklet";
    const f = factor.get();
    return f > 0 ? 1 / f : 1;
  });
  return <Path path={path} color={GUIDE_COLOR} style="stroke" strokeWidth={strokeWidth} />;
}
