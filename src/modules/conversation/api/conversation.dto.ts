import type { DirectStatus, UserDto } from "@/shared/types";

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
  image_url?: string | null;
}

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

export type DirectAction = "accept" | "block";
