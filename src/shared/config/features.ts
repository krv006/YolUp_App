/**
 * Mobil ilovada vaqtincha o'chirilgan imkoniyatlar — 🆕 mobilga xos.
 *
 * `smsVerification` — SMS kod bilan tasdiqlash: kirishdagi SMS kod oynasi
 * (ikki bosqichli tasdiqlash). 2026-10-29 da loyiha egasi qarori bilan
 * hozircha o'chirildi. Kod joyida qoladi — qaytarish uchun `true` qiling.
 */
export const FEATURES = Object.freeze({
  smsVerification: false,
  /*
   * "Parolni unutdingizmi?" — veb #199 dan tiklash faqat email orqali
   * (email -> kod -> yangi parol). Backend 2026-11-18 da email xizmati
   * borligini aytadi (`register/options` -> `email_available: true`).
   * Email kelmasa yoki xizmat o'chsa — `false` qiling, havola va sahifalar
   * yashiriladi.
   */
  emailPasswordReset: true,
  /*
   * "AI yordamchi" (Workspace kartasi, "Yaratish" menyusi, imtihon oynasidagi
   * "AI bilan yaratish", test natijalaridagi "AI mini-test"). Vebda
   * 2026-11-10 dan vaqtincha yashirin (veb `features.ts`). Uy vazifasining AI
   * tekshiruvi bu bayroqqa bog'liq emas.
   */
  aiAssistant: false,
});
