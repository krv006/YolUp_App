/**
 * Mobil ilovada vaqtincha o'chirilgan imkoniyatlar — 🆕 mobilga xos.
 *
 * `smsVerification` — SMS kod bilan tasdiqlash: parolni tiklash ("Parolni
 * unutdingizmi?"), akkaunt sozlamalaridagi ikki bosqichli tasdiqlash va
 * kirishdagi SMS kod oynasi. 2026-10-29 da loyiha egasi qarori bilan
 * hozircha o'chirildi. Kod joyida qoladi — qaytarish uchun `true` qiling.
 */
export const FEATURES = Object.freeze({
  smsVerification: false,
});
