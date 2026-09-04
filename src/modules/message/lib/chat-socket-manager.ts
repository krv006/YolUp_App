import { RealtimeSocket, type SocketState } from "@/shared/api";
import { parseSocketEvent, type ParsedSocketEvent } from "./message.mappers";

export type { SocketState };

const TYPING_THROTTLE_MS = 1500;

export interface ChatSocketManagerInit {
  roomId: string;
  onEvent?: (event: ParsedSocketEvent) => void;
  onState?: (state: SocketState) => void;
}

/**
 * Chat kanali — `wss://<domain>/ws/chat/<room_id>/` (docs/PROJECT.md §5.1).
 *
 * Ulanish, qayta urinish va token yangilash `RealtimeSocket` da; bu yerda faqat
 * chat shartnomasi: xabarni parse qilish va "yozmoqda" signalini throttle qilish.
 */
export class ChatSocketManager {
  private readonly socket: RealtimeSocket;
  private lastTypingAt = 0;

  constructor({ roomId, onEvent, onState }: ChatSocketManagerInit) {
    this.socket = new RealtimeSocket({
      path: `/ws/chat/${encodeURIComponent(roomId)}/`,
      onState,
      onMessage: (raw) => {
        try {
          const parsed = parseSocketEvent(raw);
          if (parsed) onEvent?.(parsed);
        } catch {
          onEvent?.({ type: "error", detail: "Socket javobi noto‘g‘ri" });
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

  sendTyping(): void {
    const now = Date.now();
    if (now - this.lastTypingAt < TYPING_THROTTLE_MS) return;
    if (this.socket.send({ type: "typing" })) this.lastTypingAt = now;
  }
}
