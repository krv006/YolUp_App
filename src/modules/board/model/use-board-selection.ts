import { useRef, useState } from "react";
import type { Point, StrokeDto } from "../api/board.dto";
import { clampMove, type SheetSize, type StrokeBox } from "../lib/board-edit";
import {
  resizeHandles,
  resizeStroke,
  type HandlePoint,
  type ResizeHandle,
} from "../lib/board-resize";
import { boxOfStroke, pickStroke } from "../lib/board-select";

/** Ingichka chiziqlarni topish chegarasi (ekran px) — veb `HIT_PX`. */
const HIT_PX = 10;
/** Burchak tutqichini barmoq bilan ushlash radiusi (ekran px); vebda sichqoncha aniq tegadi. */
const HANDLE_TOUCH_PX = 22;
const DRAG_START = 2;

export type BoardDrag =
  | { kind: "move"; id: string; dx: number; dy: number }
  | { kind: "resize"; id: string; stroke: StrokeDto };

export interface UseBoardSelectionInit {
  strokes: StrokeDto[];
  sheet: SheetSize;
  /** Tanlangan element — ota komponentda (panel uchun), shu yerda boshqariladi. */
  selectedId: string | null;
  active: boolean;
  measure: (stroke: StrokeDto) => StrokeBox | null;
  canEdit: (stroke: StrokeDto) => boolean;
  onSelect: (id: string | null) => void;
  onMove: (id: string, delta: [number, number]) => void;
  onResize: (id: string, changes: Record<string, number>) => void;
  onDenied: () => void;
  onDraggingChange?: (dragging: boolean) => void;
}

interface DragState {
  id: string;
  stroke: StrokeDto;
  start: Point;
  delta: [number, number];
  moved: boolean;
  handle: ResizeHandle | null;
  preview: StrokeDto | null;
  changes: Record<string, number> | null;
}

function nearestHandle(handles: HandlePoint[], [x, y]: Point, reach: number): ResizeHandle | null {
  let best: { id: ResizeHandle; distance: number } | null = null;
  for (const handle of handles) {
    const distance = Math.hypot(handle.point[0] - x, handle.point[1] - y);
    if (distance <= reach && (!best || distance < best.distance))
      best = { id: handle.id, distance };
  }
  return best?.id ?? null;
}

/**
 * "Tanlash" vositasi — veb `use-board-selection.ts` ning mobil varianti.
 *
 * 🟡 MOSLASH: vebda pointer hodisalari SVG'dan keladi va matn DOM'dan
 * o'lchanadi. Mobilda `BoardCanvas` gesture'lari doska koordinatasini va
 * joriy masshtabni (`factor`, ekran px / doska birligi) beradi; o'lchov
 * `measure` orqali (Skia shriftlari). Bosish (`tap`) tanlaydi, sudrash
 * (`begin` → `move` → `end`) ko'chiradi yoki tutqich bilan o'lchamni
 * o'zgartiradi — oxirida bitta `move`/`changes` yuboriladi. Klaviatura
 * (strelka, Delete, Enter) va ikki marta bosish telefonda yo'q.
 */
export function useBoardSelection({
  strokes,
  sheet,
  selectedId,
  active,
  measure,
  canEdit,
  onSelect,
  onMove,
  onResize,
  onDenied,
  onDraggingChange,
}: UseBoardSelectionInit) {
  const [drag, setDrag] = useState<BoardDrag | null>(null);
  /**
   * Qo'yib yuborilgandan keyin ko'rinish yangi holat kelguncha saqlanadi:
   * optimistik yangilanish keyingi kadrda tushadi, `drag` darhol tozalansa
   * element bir lahzaga eski joyiga sakrab qaytardi.
   */
  const [settling, setSettling] = useState<StrokeDto[] | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const frameRef = useRef<number | null>(null);

  if (settling && settling !== strokes) {
    setSettling(null);
    setDrag(null);
  }

  const selected =
    active && selectedId ? (strokes.find((stroke) => stroke.id === selectedId) ?? null) : null;
  const box = selected ? boxOfStroke(selected, measure) : null;
  const handles = selected ? resizeHandles(selected, box) : [];

  function strokeAt(point: Point, factor: number): StrokeDto | null {
    return pickStroke(strokes, point, { tolerance: HIT_PX / factor, measure });
  }

  /** Bosish: element tanlanadi, bo'sh joy tanlovni bekor qiladi, birovniki — ogohlantirish. */
  function tap(point: Point, factor: number) {
    if (!active) return;
    const stroke = strokeAt(point, factor);
    if (!stroke) return onSelect(null);
    if (!canEdit(stroke)) {
      onSelect(null);
      onDenied();
      return;
    }
    onSelect(stroke.id);
  }

  function begin(point: Point, factor: number) {
    if (!active) return;
    const handle = selected ? nearestHandle(handles, point, HANDLE_TOUCH_PX / factor) : null;
    if (selected && handle) {
      dragRef.current = {
        id: selected.id,
        stroke: selected,
        start: point,
        delta: [0, 0],
        moved: false,
        handle,
        preview: null,
        changes: null,
      };
      return;
    }
    const stroke = strokeAt(point, factor);
    if (!stroke) {
      onSelect(null);
      return;
    }
    if (!canEdit(stroke)) {
      onSelect(null);
      onDenied();
      return;
    }
    onSelect(stroke.id);
    dragRef.current = {
      id: stroke.id,
      stroke,
      start: point,
      delta: [0, 0],
      moved: false,
      handle: null,
      preview: null,
      changes: null,
    };
  }

  function move(point: Point) {
    const state = dragRef.current;
    if (!state) return;
    const raw: [number, number] = [point[0] - state.start[0], point[1] - state.start[1]];
    if (!state.moved && Math.hypot(raw[0], raw[1]) < DRAG_START) return;
    if (!state.moved) onDraggingChange?.(true);
    state.moved = true;
    if (state.handle) {
      const resized = resizeStroke(state.stroke, state.handle, point, sheet);
      state.preview = resized?.stroke ?? null;
      state.changes = resized?.changes ?? null;
    } else {
      state.delta = clampMove(state.stroke, raw, sheet);
    }
    if (frameRef.current !== null) return;
    frameRef.current = globalThis.requestAnimationFrame(() => {
      frameRef.current = null;
      const live = dragRef.current;
      if (!live?.moved) return;
      setDrag(
        live.handle
          ? live.preview
            ? { kind: "resize", id: live.id, stroke: live.preview }
            : null
          : { kind: "move", id: live.id, dx: live.delta[0], dy: live.delta[1] }
      );
    });
  }

  /** `commit = false` — ikkinchi barmoq tegdi: hech narsa yuborilmaydi. */
  function end(commit: boolean) {
    const state = dragRef.current;
    dragRef.current = null;
    if (frameRef.current !== null) {
      globalThis.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (state?.moved) onDraggingChange?.(false);
    if (!state?.moved || !commit) {
      setDrag(null);
      return;
    }
    if (state.handle) {
      if (state.changes && state.preview) {
        onResize(state.id, state.changes);
        setDrag({ kind: "resize", id: state.id, stroke: state.preview });
        setSettling(strokes);
      } else setDrag(null);
      return;
    }
    const delta: [number, number] = [Math.round(state.delta[0]), Math.round(state.delta[1])];
    if (!delta[0] && !delta[1]) {
      setDrag(null);
      return;
    }
    onMove(state.id, delta);
    setDrag({ kind: "move", id: state.id, dx: delta[0], dy: delta[1] });
    setSettling(strokes);
  }

  return { selected, box, handles, drag, tap, begin, move, end, strokeAt };
}
