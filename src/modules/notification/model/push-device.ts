import { pushDeviceApi } from "../api/push-device.api";
import { getDeviceId } from "../lib/device-id";

/**
 * Chiqishda qurilmani push ro'yxatidan chiqaradi — 🆕 mobil.
 *
 * Chaqiruv `auth.store.ts` dagi `logout()` da, tokenlar tozalanishidan
 * OLDIN: so'rov autentifikatsiyani talab qiladi. Usiz telefondan chiqib
 * ketgan foydalanuvchiga bildirishnoma kelib turaverardi.
 *
 * Ro'yxatga OLISH esa bu yerda emas: u ruxsat so'rash va FCM tokenini
 * olishni talab qiladi, ya'ni platformaga bog'liq. Domen qatlamida RN yoki
 * Expo importi bo'lishi mumkin emas (eslint.config.js "Platforma tozaligi"),
 * shuning uchun u `providers/use-push-registration.ts` da.
 */
export async function unregisterPushDevice(): Promise<void> {
  try {
    await pushDeviceApi.unregister(getDeviceId());
  } catch {
    // Chiqish baribir davom etadi — sabab `logout()` dagi izohda.
  }
}
