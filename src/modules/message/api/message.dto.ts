import type { UserDto } from "@/shared/types";

/** `GET /api/v1/chat/rooms/<id>/messages/` — bitta xabar. */
export interface MessageDto {
  id: string | number;
  room: string | number;
  sender?: UserDto;
  text: string;
  created_at: string;
  /**
   * Biriktirilgan fayl (docs/STUDENT_API.md §6). Dars tugagach backend doska
   * PDF'ini shu ko'rinishda guruh chatga tashlaydi. Fayl `/chat/files/<id>/`
   * orqali beriladi va Authorization header talab qiladi.
   */
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
}

// ─── WebSocket shartnomasi (docs/PROJECT.md §5) ─────────────────────────────
export interface SocketMessageEventDto {
  type: "message";
  message: MessageDto;
}

export interface SocketTypingEventDto {
  type: "typing";
  user_id: string | number;
  name: string;
}

export interface SocketErrorEventDto {
  type: "error";
  detail?: string;
}

export type SocketEventDto = SocketMessageEventDto | SocketTypingEventDto | SocketErrorEventDto;
