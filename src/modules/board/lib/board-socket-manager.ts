import { RealtimeSocket, type SocketState } from "@/shared/api";
import type { StrokeDto, StrokeInput } from "../api/board.dto";

export type { SocketState };

/**
 * Doska kanalidan keladigan hodisalar — docs/PROJECT.md §5.2.
 *
 * `mic_request`/`mic_granted`/`camera_*`/`board_granted` doskaning o'ziga
 * aloqador emas, lekin dars davomida ochiq turgan yagona kanal shu bo'lgani
 * uchun backend ularni ham shu yerdan yuboradi (MIC_REQUEST_GRANT.md
 * §"Qanday ishlaydi", FRONTEND_TODO_CAMERA_BOARD.md).
 */
export type BoardSocketEvent =
  | { type: "stroke"; sheet: number; stroke: StrokeDto }
  | { type: "erase"; sheet: number; strokeIds: string[]; by: string; reason: string }
  | { type: "sheet"; index: number }
  | { type: "mic_request"; studentId: string; name: string }
  | { type: "mic_granted"; studentId: string }
  | { type: "mic_denied"; studentId: string }
  | { type: "camera_request"; studentId: string; name: string }
  | { type: "camera_granted"; studentId: string }
  | { type: "camera_denied"; studentId: string }
  | { type: "board_granted"; studentId: string }
  | { type: "error"; detail: string };

interface RawBoardEvent {
  type?: string;
  sheet?: number | string;
  stroke?: StrokeDto;
  stroke_ids?: string[];
  by?: string;
  reason?: string;
  index?: number | string;
  student_id?: string | number;
  name?: string;
  detail?: string;
}

export function parseBoardEvent(raw: unknown): BoardSocketEvent | null {
  const event = (typeof raw === "string" ? JSON.parse(raw) : raw) as RawBoardEvent | null;
  if (!event) return null;

  switch (event.type) {
    case "stroke":
      return event.stroke
        ? { type: "stroke", sheet: Number(event.sheet ?? 0), stroke: event.stroke }
        : null;
    case "erase":
      return {
        type: "erase",
        sheet: Number(event.sheet ?? 0),
        strokeIds: event.stroke_ids ?? [],
        by: event.by ?? "",
        reason: event.reason ?? "",
      };
    case "sheet":
      return { type: "sheet", index: Number(event.index ?? 0) };
    case "mic_request":
      return event.student_id
        ? { type: "mic_request", studentId: String(event.student_id), name: event.name ?? "" }
        : null;
    case "mic_granted":
      return event.student_id ? { type: "mic_granted", studentId: String(event.student_id) } : null;
    case "mic_denied":
      return event.student_id ? { type: "mic_denied", studentId: String(event.student_id) } : null;
    case "camera_request":
      return event.student_id
        ? { type: "camera_request", studentId: String(event.student_id), name: event.name ?? "" }
        : null;
    case "camera_granted":
      return event.student_id ? { type: "camera_granted", studentId: String(event.student_id) } : null;
    case "camera_denied":
      return event.student_id ? { type: "camera_denied", studentId: String(event.student_id) } : null;
    case "board_granted":
      return event.student_id ? { type: "board_granted", studentId: String(event.student_id) } : null;
    case "error":
      return { type: "error", detail: event.detail || "Doska ulanishida xatolik" };
    default:
      return null;
  }
}

export interface BoardSocketManagerInit {
  lessonId: string;
  onEvent?: (event: BoardSocketEvent) => void;
  onState?: (state: SocketState) => void;
}

/**
 * Doska kanali — `wss://<domain>/ws/board/<lesson_id>/` (docs/PROJECT.md §5.2).
 *
 * Boshlang'ich holat REST `GET /board/<id>/` dan olinadi, keyin faqat shu kanal
 * orqali yangilanadi. Kanal ulanmasa `useBoard` pollingga qaytadi.
 */
export class BoardSocketManager {
  private readonly socket: RealtimeSocket;

  constructor({ lessonId, onEvent, onState }: BoardSocketManagerInit) {
    this.socket = new RealtimeSocket({
      path: `/ws/board/${encodeURIComponent(lessonId)}/`,
      onState,
      onMessage: (raw) => {
        try {
          const parsed = parseBoardEvent(raw);
          if (parsed) onEvent?.(parsed);
        } catch {
          onEvent?.({ type: "error", detail: "Doska javobi noto‘g‘ri" });
        }
      },
    });
  }

  get isOpen(): boolean {
    return this.socket.isOpen;
  }

  start(): void {
    this.socket.start();
  }

  stop(): void {
    this.socket.stop();
  }

  /**
   * Chizmani kanal orqali yuboradi. `false` qaytsa — ulanish yo'q,
   * chaqiruvchi REST `POST .../stroke/` ga o'tadi (ikkalasi teng kuchli).
   */
  sendStroke(sheet: number, stroke: StrokeInput): boolean {
    return this.socket.send({ type: "stroke", sheet, stroke });
  }
}
