/**
 * LiveKit `TrackSource` protokol qiymatlari. SDK enum'i emas, aynan raqamlar
 * keladi: token ichidagi `canPublishSources` shu ko'rinishda bo'ladi.
 */
export const CAMERA_SOURCE = 1;
export const MICROPHONE_SOURCE = 2;
export const SCREEN_SHARE_SOURCE = 3;

interface PublishPermissions {
  canPublish: boolean;
  canPublishSources: number[];
}

/**
 * Foydalanuvchi shu manbani efirga uzata oladimi.
 *
 * `canPublishSources` bo'sh bo'lsa — cheklov yo'q, hamma manba ochiq (LiveKit
 * shartnomasi). Ro'yxat to'ldirilgan bo'lsa — faqat sanab o'tilganlari.
 */
export function canPublishSource(
  permissions: PublishPermissions | null | undefined,
  source: number
): boolean {
  if (!permissions?.canPublish) return false;
  return !permissions.canPublishSources.length || permissions.canPublishSources.includes(source);
}
