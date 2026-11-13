/**
 * `live` modulining mobil barrel'i.
 *
 * Veb `src/modules/live/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { liveApi } from "./api/live.api";
export type { AttentionCheck, FocusKind, FocusResult, MediaKind, MediaMode, RoomToken } from "./api/live.dto";
export { mapAttentionDto, mapFocusDto, mapMediaModeDto, mapRoomTokenDto } from "./lib/live.mappers";
export {
  CAMERA_SOURCE,
  canPublishSource,
  identityUserId,
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
  useLessonPresence,
  useLiveToken,
  useMuteAll,
  useRequestCamera,
  useRequestMic,
  useUnbanFromLesson,
  useCameraOffAll,
  useMediaMode,
  useReleaseMedia,
  useSetMediaMode,
} from "./model/live.queries";
export { describeShareTrack } from "./lib/share-source";
export type { ShareSourceInfo, ShareSurface } from "./lib/share-source";
export { useMediaModeChannel } from "./model/use-media-mode-channel";
export {
  audioHealth,
  bitrateSince,
  clientHealthReport,
  isHealthSource,
  sentBytes,
  videoHealth,
  type ClientHealthReport,
  type HealthTrack,
} from "./lib/client-health";

export { useCameraSignals } from "./model/use-camera-signals";
export type { CameraRequest } from "./model/use-camera-signals";
export { useMicSignals } from "./model/use-mic-signals";
export type { MicRequest } from "./model/use-mic-signals";

// --- Mobil UI ---
export { LessonInviteSheet } from "./ui/lesson-invite-sheet";
export type { LessonInviteSheetProps } from "./ui/lesson-invite-sheet";
export { LessonPreJoin } from "./ui/lesson-pre-join";
export type { LessonPreJoinChoices, LessonPreJoinProps } from "./ui/lesson-pre-join";
