/**
 * `message` modulining mobil barrel'i.
 *
 * Veb `src/modules/message/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { messageApi } from "./api/message.api";
export type { MessageDto, SocketEventDto } from "./api/message.dto";
export { ChatSocketManager } from "./lib/chat-socket-manager";
export type { SocketState } from "./lib/chat-socket-manager";
export { mapMessageDto, markMessageFailed, parseSocketEvent, upsertMessage } from "./lib/message.mappers";
export type { ParsedSocketEvent } from "./lib/message.mappers";
export { tokenizeMessageText } from "./lib/linkify";
export type { MessageToken } from "./lib/linkify";
export { messageKeys } from "./model/message.keys";
export { useChat } from "./model/use-chat";
export type { ChatController } from "./model/use-chat";

// --- Mobil UI (veb'da ui/ ko'chirilmaydi, bular mobilga xos) ---
export { MessageActionsSheet } from "./ui/message-actions-sheet";
export { MessageBubble } from "./ui/message-bubble";
export { MessageComposer } from "./ui/message-composer";
export { MessageList } from "./ui/message-list";
export { MessageText } from "./ui/message-text";
export { MessageAttachment } from "./ui/message-attachment";
export { buildMessageRows } from "./lib/message-day";
export type { MessageRow } from "./lib/message-day";
