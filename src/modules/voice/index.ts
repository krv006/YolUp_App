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
export { useVoiceUiStore } from "./model/voice-ui.store";

// --- Mobil UI ---
export { VoiceRoomBar } from "./ui/voice-room-bar";
export type { VoiceRoomBarProps } from "./ui/voice-room-bar";
export { VoiceRoomCreateDialog } from "./ui/voice-room-create-dialog";
export type { VoiceRoomCreateDialogProps } from "./ui/voice-room-create-dialog";
export { VoiceRoomPanel } from "./ui/voice-room-panel";
export type { VoiceRoomPanelProps } from "./ui/voice-room-panel";
