/**
 * `voice` modulining mobil barrel'i.
 *
 * Veb `src/modules/voice/index.ts` dan generatsiya qilingan: domen qatlami
 * to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida yoziladi.
 */
export { voiceApi } from "./api/voice.api";
export { voiceEndpoints } from "./api/voice.endpoints";
export type { VoiceRoomFormValues } from "./api/voice.dto";
export {
  useActiveVoiceRoom,
  useAnswerVoiceJoinRequest,
  useCloseVoiceRoom,
  useCreateVoiceRoom,
  useJoinVoiceRoom,
  useLeaveVoiceRoom,
  useRequestVoiceJoin,
  useVoiceJoinRequests,
  useVoiceRooms,
  voiceKeys,
} from "./model/voice.queries";

// --- Mobil UI ---
export { VoiceRoomBar } from "./ui/voice-room-bar";
export type { VoiceRoomBarProps } from "./ui/voice-room-bar";
export { VoiceRoomSheet } from "./ui/voice-room-sheet";
export type { VoiceRoomSheetProps } from "./ui/voice-room-sheet";
