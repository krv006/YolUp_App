/**
 * `app.config.ts` uchun minimal Node e'lonlari.
 *
 * NEGA `@types/node` EMAS: uni `types` ga qo'shish Node globallarini
 * (`Buffer`, `process`, `__dirname`) BUTUN loyihaga ochib yuboradi. Ilova
 * kodida ular yo'q — bunday import faqat qurilma ustida yiqilardi va
 * `tsc` uni ushlay olmasdi.
 *
 * `app.config.ts` esa Node ichida, qurish paytida ishlaydi. Unga kerakli
 * yagona narsa — fayl bor-yo'qligini tekshirish.
 */
declare module "fs" {
  export function existsSync(path: string): boolean;
}
