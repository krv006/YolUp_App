import {
  normalizeMediaUrl,
  normalizePagination,
  type Page,
  type PaginationOptions,
} from "@/shared/api";
import type { Conversation } from "@/shared/types";
import type { ChatRoomDto, DirectTeacher, DirectTeacherDto } from "../api/conversation.dto";

const TONES = ["violet", "blue", "emerald", "amber", "rose"] as const;

function toneFor(id: unknown): string {
  return TONES[Math.abs(String(id).charCodeAt(0) || 0) % TONES.length];
}

export function mapConversationDto(dto: ChatRoomDto): Conversation {
  const other = dto.other_user;
  return {
    id: String(dto.id),
    type: dto.kind === "course" ? "group" : "direct",
    kind: dto.kind,
    courseId: dto.course ? String(dto.course) : null,
    title: dto.title,
    participantId: other?.id ? String(other.id) : null,
    participant: other
      ? {
          id: String(other.id),
          username: other.username,
          name: [other.first_name, other.last_name].filter(Boolean).join(" ") || other.username,
          phone: other.phone ?? null,
        }
      : null,
    directStatus: dto.direct_status ?? null,
    lastMessage: dto.last_message?.text ?? "Hozircha xabar yo‘q",
    lastSender: dto.last_message?.sender ?? null,
    updatedAt: dto.last_message?.created_at ?? dto.updated_at,
    unreadCount: Number(dto.unread ?? 0),
    status: "offline",
    typing: false,
    avatarTone: toneFor(dto.id),
    memberCount: 0,
    // `<img src>` uchun to'liq havola kerak — apiClient bazasi qo'llanadi.
    imageUrl: normalizeMediaUrl(dto.image_url),
  };
}

export function mapConversationPage(dto: unknown, options?: PaginationOptions): Page<Conversation> {
  const page = normalizePagination<ChatRoomDto>(dto, options);
  return { ...page, items: page.items.map(mapConversationDto) };
}

export function mapTeacherDto(dto: DirectTeacherDto): DirectTeacher {
  return {
    id: String(dto.id),
    username: dto.username,
    name: [dto.first_name, dto.last_name].filter(Boolean).join(" ") || dto.username,
    phone: dto.phone ?? null,
    directStatus: dto.direct_status ?? null,
    roomId: dto.room_id ? String(dto.room_id) : null,
  };
}
