/**
 * `live` modulining mobil barrel'i.
 *
 * Veb `src/modules/live/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { liveApi } from "./api/live.api";
export type { AttentionCheck, FocusKind, FocusResult, RoomToken } from "./api/live.dto";
export { mapAttentionDto, mapFocusDto, mapRoomTokenDto } from "./lib/live.mappers";
export {
  CAMERA_SOURCE,
  canPublishSource,
  MICROPHONE_SOURCE,
  SCREEN_SHARE_SOURCE,
} from "./lib/live-permissions";
export { MIC_TRACK, tokenAllowsTrack } from "./lib/live-token";
export { decodeScreenShareRequest, encodeScreenShareRequest } from "./lib/screen-share-signal";
export { useFocusTracker } from "./lib/use-focus-tracker";
export {
  liveKeys,
  useAllowShare,
  useAnswerAttention,
  useAttentionCheck,
  useBanFromLesson,
  useDenyCamera,
  useDenyMic,
  useGrantCamera,
  useGrantMic,
  useInviteToLesson,
  useLiveToken,
  useRequestCamera,
  useRequestMic,
  useUnbanFromLesson,
} from "./model/live.queries";

export { useCameraSignals } from "./model/use-camera-signals";
export type { CameraRequest } from "./model/use-camera-signals";
export { useMicSignals } from "./model/use-mic-signals";
export type { MicRequest } from "./model/use-mic-signals";
