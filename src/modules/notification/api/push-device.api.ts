import { apiClient } from "@/shared/api";

/**
 * Mobil qurilmani push uchun ro'yxatga olish — 🆕 mobil, vebda muqobili
 * yo'q.
 *
 * ┌─ NEGA ALOHIDA FAYL ───────────────────────────────────────────────────┐
 * │ `notification.endpoints.ts` va `notification.api.ts` — 🟢 veb bilan   │
 * │ bayt-bayt bir xil fayllar. Vebda bu endpointlar YO'Q: u brauzerning  │
 * │ Web Push obunasini yuboradi (`push/subscribe/`), mobil esa FCM       │
 * │ qurilma tokenini. Shuning uchun mobil yo'l shu yerda, alohida turadi │
 * │ va ko'chirilgan fayllar toza qoladi.                                  │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Backend yo'llari `docs/PUSH-BACKEND.md` da kelishilgan.
 */
export const pushDeviceEndpoints = Object.freeze({
  device: "/api/v1/notifications/push/device/",
  test: "/api/v1/notifications/push/test/",
});

export interface RegisterPushDevicePayload {
  token: string;
  platform: "android" | "ios";
  device_id: string;
  app_version?: string;
}

export const pushDeviceApi = {
  /**
   * Qurilmani ro'yxatga oladi yoki tokenini yangilaydi.
   *
   * Backend `update_or_create` qiladi, kalit `(user, device_id)` — shuning
   * uchun ilova har ochilganda qayta yuborishi NORMAL. FCM tavsiyasi ham
   * shunday: token jimgina yangilanishi mumkin va uni muntazam tasdiqlab
   * turish kerak.
   */
  register(payload: RegisterPushDevicePayload) {
    return apiClient.post(pushDeviceEndpoints.device, payload);
  },

  /** Chiqishda yoki bildirishnoma o'chirilganda. */
  unregister(deviceId: string) {
    return apiClient.delete(pushDeviceEndpoints.device, {
      body: { device_id: deviceId },
    });
  },

  /** O'ziga bitta sinov push — token -> baza -> FCM -> telefon zanjiri. */
  sendTest() {
    return apiClient.post(pushDeviceEndpoints.test, {});
  },
};
