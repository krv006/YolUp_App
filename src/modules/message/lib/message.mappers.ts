import type { ChatMessage, UserDto } from "@/shared/types";
import type { MessageDto } from "../api/message.dto";

/**
 * Backendda `reply_to` maydoni yo'q — reply matn ichiga prefiks sifatida yoziladi
 * va shu regex bilan qayta ajratiladi. Backend maydon qo'shgach bu olib tashlanadi.
 */
const REPLY_PATTERN = /^↪ ([^:]+): (.*?)\n([\s\S]*)$/;

export function mapMessageDto(dto: MessageDto): ChatMessage {
  const sender = dto.sender ?? ({} as UserDto);
  const replyMatch = String(dto.text ?? "").match(REPLY_PATTERN);

  return {
    id: String(dto.id),
    conversationId: String(dto.room),
    senderId: String(sender.id),
    senderName: [sender.first_name, sender.last_name].filter(Boolean).join(" ") || sender.username,
    senderUsername: sender.username,
    text: replyMatch ? replyMatch[3] : dto.text,
    replyTo: replyMatch ? { author: replyMatch[1], text: replyMatch[2] } : undefined,
    type: "text",
    createdAt: dto.created_at,
    status: "sent",
    pending: false,
    failed: false,
    attachment: dto.file_url
      ? {
          messageId: String(dto.id),
          name: dto.file_name || "Fayl",
          mimeType: dto.file_type || "",
        }
      : undefined,
  };
}

export type ParsedSocketEvent =
  | { type: "message"; message: ChatMessage }
  | { type: "typing"; userId: string; name: string }
  /** Foydalanuvchi kursdan chiqarildi — server socketni 4403 bilan yopadi. */
  | { type: "removed" }
  | { type: "error"; detail: string };

export function parseSocketEvent(raw: unknown): ParsedSocketEvent | null {
  const event = (typeof raw === "string" ? JSON.parse(raw) : raw) as
    | { type?: string; message?: MessageDto; user_id?: string | number; name?: string; detail?: string }
    | null;

  if (!event || !["message", "typing", "removed", "error"].includes(event.type ?? "")) return null;
  if (event.type === "message" && event.message) {
    return { type: "message", message: mapMessageDto(event.message) };
  }
  if (event.type === "typing") {
    return { type: "typing", userId: String(event.user_id), name: event.name ?? "" };
  }
  // Kursdan chiqarilgan (docs/LIVE_MODERATION_API.md §3) — server shundan
  // keyin ulanishni 4403 bilan yopadi.
  if (event.type === "removed") return { type: "removed" };
  return { type: "error", detail: event.detail || "WebSocket xatosi" };
}

/** Xabarni ro'yxatga qo'shadi yoki mavjudini yangilaydi, so'ng vaqt bo'yicha saralaydi. */
export function upsertMessage(messages: ChatMessage[] = [], message: ChatMessage): ChatMessage[] {
  const index = messages.findIndex((item) => item.id === message.id);
  if (index >= 0) return messages.map((item, i) => (i === index ? { ...item, ...message } : item));
  return [...messages, message].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function markMessageFailed(messages: ChatMessage[] = [], temporaryId: string): ChatMessage[] {
  return messages.map((item) =>
    item.id === temporaryId ? { ...item, pending: false, failed: true, status: "failed" } : item
  );
}
