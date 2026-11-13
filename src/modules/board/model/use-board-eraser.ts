import { useRef, useState } from "react";
import type { Point, StrokeDto } from "../api/board.dto";
import type { StrokeBox } from "../lib/board-edit";
import { strokesAlong } from "../lib/board-select";

export interface UseBoardEraserInit {
  strokes: StrokeDto[];
  measure: (stroke: StrokeDto) => StrokeBox | null;
  /** Qo'yib yuborilganda — tekkan elementlar (bitta ro'yxat, sabab bir marta so'raladi). */
  onErase: (ids: string[]) => void;
}

/**
 * O'chirg'ich (Excalidraw uslubi) — veb `board-panel.tsx` dagi
 * `eraseBetween` / `finishErasing` ning mobil varianti: sudralganda aylana
 * tekkan elementlar to'planadi (xira ko'rinadi), qo'yib yuborilganda
 * hammasi birga `onErase` ga beriladi. Bo'sh shakllar faqat chetidan
 * tegadi (`strokesAlong`). `radius` — doska birligida.
 */
export function useBoardEraser({ strokes, measure, onErase }: UseBoardEraserInit) {
  const [erasing, setErasing] = useState<string[] | null>(null);
  const lastRef = useRef<Point | null>(null);
  const idsRef = useRef<Set<string>>(new Set());

  function collect(from: Point, to: Point, radius: number) {
    const found = strokesAlong(strokes, from, to, radius, measure).filter(
      (id) => !idsRef.current.has(id)
    );
    if (!found.length) return;
    found.forEach((id) => idsRef.current.add(id));
    setErasing([...idsRef.current]);
  }

  function start(point: Point, radius: number) {
    idsRef.current = new Set();
    lastRef.current = point;
    setErasing([]);
    collect(point, point, radius);
  }

  function move(point: Point, radius: number) {
    if (!lastRef.current) return;
    collect(lastRef.current, point, radius);
    lastRef.current = point;
  }

  /** `commit = false` — ikkinchi barmoq tegdi: hech narsa o'chirilmaydi. */
  function end(commit: boolean) {
    const ids = [...idsRef.current];
    idsRef.current = new Set();
    lastRef.current = null;
    setErasing(null);
    if (commit && ids.length) onErase(ids);
  }

  /** Bosish (sudramasdan) — aylana ostidagilar darhol. */
  function tap(point: Point, radius: number) {
    const ids = strokesAlong(strokes, point, point, radius, measure);
    if (ids.length) onErase(ids);
  }

  return { erasing, start, move, end, tap };
}
