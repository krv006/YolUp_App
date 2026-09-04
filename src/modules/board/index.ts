/**
 * `board` modulining mobil barrel'i.
 *
 * Veb `src/modules/board/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { boardApi } from "./api/board.api";
export type {
  AwayStudent,
  BoardSheet,
  BoardState,
  PendingCameraRequest,
  PendingMicRequest,
  Point,
  StrokeDto,
  StrokeInput,
  StrokeKind,
  StrokeShapeDto,
} from "./api/board.dto";
export { mapBoardDto } from "./lib/board.mappers";
export { BoardSocketManager, parseBoardEvent } from "./lib/board-socket-manager";
export type { BoardSocketEvent } from "./lib/board-socket-manager";
export {
  boardKeys,
  useAddSheet,
  useAddStroke,
  useBoard,
  useEraseStrokes,
  useGrantDraw,
  useSolveFormula,
} from "./model/board.queries";
export { useBoardChannel } from "./model/use-board-channel";
export { useBoardRealtime } from "./model/use-board-realtime";
export { BOARD_COLORS, BOARD_TEXT_SIZE, BOARD_WIDTHS } from "./constants/board.constants";
export { arrowHeadPoints, boxFromDrag, buildStroke, strokeKindOf } from "./lib/board.geometry";
export type { DrawKind } from "./lib/board.geometry";

// --- Mobil UI ---
export { BoardCanvas } from "./ui/board-canvas";
export type { BoardCanvasProps } from "./ui/board-canvas";
export { BoardStroke, hitTestStroke, useBoardFont } from "./ui/board-stroke";
export { BoardSurface } from "./ui/board-surface";
export type { BoardSurfaceProps } from "./ui/board-surface";
export { BoardToolbar } from "./ui/board-toolbar";
export type { BoardTool, BoardToolbarProps } from "./ui/board-toolbar";

