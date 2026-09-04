/**
 * `conversation` modulining mobil barrel'i.
 *
 * Veb `src/modules/conversation/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { conversationApi } from "./api/conversation.api";
export type { ChatRoomDto, DirectAction, DirectTeacher, DirectTeacherDto } from "./api/conversation.dto";
export { DIRECT_STATUS, DIRECT_STATUS_LABELS, directStatusLabel } from "./constants/direct-status";
export { mapConversationDto, mapConversationPage, mapTeacherDto } from "./lib/conversation.mappers";
export { conversationKeys } from "./model/conversation.keys";
export {
  matchesConversationFilter,
  useConversationFilter,
  useConversationFilterStore,
} from "./model/conversation-filter.store";
export type { ConversationFilter } from "./model/conversation-filter.store";
export {
  readCachedConversation,
  useConversations,
  useTeachersForDirect,
  useRequestDirect,
  useRespondDirect,
  useSetRoomImage,
} from "./model/use-conversations";
