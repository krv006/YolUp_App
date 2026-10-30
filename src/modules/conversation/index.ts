/**
 * `conversation` modulining mobil barrel'i.
 *
 * Veb `src/modules/conversation/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { conversationApi } from "./api/conversation.api";
export type { ChatRoomDto, DirectAction, DirectTeacher, DirectTeacherDto } from "./api/conversation.dto";
export { DIRECT_STATUS, isDirectLocked, useDirectStatusLabel } from "./constants/direct-status";
export { mapConversationDto, mapConversationPage, mapTeacherDto } from "./lib/conversation.mappers";
export { isOwnLastMessage, lastMessageBody } from "./lib/last-message";
export type { LastMessageLabels } from "./lib/last-message";
export { conversationKeys } from "./model/conversation.keys";
export { useNewConversationStore } from "./model/new-conversation.store";
export {
  matchesConversationFilter,
  countUnreadChats,
  useConversationFilter,
  useConversationFilterStore,
} from "./model/conversation-filter.store";
export type { ConversationFilter } from "./model/conversation-filter.store";
export {
  readCachedConversation,
  useConversations,
  useConversationSync,
  useGroupImages,
  useTeachersForDirect,
  useRequestDirect,
  useRespondDirect,
  useSetRoomImage,
} from "./model/use-conversations";

export { applyChatActivity, applyChatTyping, CHAT_TYPING_TTL_MS, setActiveConversation } from "./model/chat-realtime";
export { clearRoomTyping, markRoomTyping, useRoomTyping } from "./model/typing.store";
export type { RoomTyping } from "./model/typing.store";

// --- Mobil UI ---
export { ChatHeader } from "./ui/chat-header";
export { DirectRequestBar } from "./ui/direct-request-bar";
export type { DirectRequestBarProps } from "./ui/direct-request-bar";
export { ConversationInfoSheet } from "./ui/conversation-info-sheet";
export { NewGroupSheet } from "./ui/new-group-sheet";
export { InviteStudentsSheet } from "./ui/invite-students-sheet";
