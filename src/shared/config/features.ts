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
  /*
   * "AI yordamchi" (Workspace kartasi, "Yaratish" menyusi, imtihon oynasidagi
   * "AI bilan yaratish", test natijalaridagi "AI mini-test"). Vebda
   * 2026-11-10 dan vaqtincha yashirin (veb `features.ts`). Uy vazifasining AI
   * tekshiruvi bu bayroqqa bog'liq emas.
   */
  aiAssistant: false,
});
