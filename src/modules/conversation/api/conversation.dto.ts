import type { DirectStatus, UserDto } from "@/shared/types";

/**
 * `GET /api/v1/chat/rooms/` — Telegram uslubidagi ro'yxat qatori.
 *
 * `last_message` va `other_user` — backendda `SerializerMethodField`, shu sabab
 * OpenAPI sxemasida `string` deb ko'rsatilgan, lekin amalda obyekt qaytadi.
 */
export interface ChatRoomDto {
  id: string | number;
  kind: "course" | "direct";
  course?: string | number | null;
  title: string;
  direct_status?: DirectStatus | null;
  last_message?: { text?: string; sender?: string; created_at?: string } | null;
  other_user?: UserDto | null;
  unread?: number;
  updated_at: string;
  /** Guruh chat rasmi (o'qituvchi o'rnatadi, docs/STAFF_API.md §6). */
  image_url?: string | null;
}

/** `GET /api/v1/chat/rooms/teachers/` — direct so'rov yuborish uchun o'qituvchilar. */
export interface DirectTeacherDto extends UserDto {
  direct_status?: DirectStatus | null;
  room_id?: string | number | null;
}

export interface DirectTeacher {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  directStatus: DirectStatus | null;
  roomId: string | null;
}

/** O'qituvchining direct so'rovga javobi. */
export type DirectAction = "accept" | "block";
