import type { UserDto } from "@/shared/types";

export interface MessageDto {
  id: string | number;
  room: string | number;
  sender?: UserDto;
  text: string;
  created_at: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
}

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
