import { storage } from "@/shared/lib/storage";

const KEY = "fokus_push_device_id";

/**
 * Shu o'rnatilgan ilova nusxasining BARQAROR identifikatori — 🆕 mobil,
 * vebda muqobili yo'q.
 *
 * ┌─ NEGA TOKENNING O'ZI YETMAYDI ────────────────────────────────────────┐
 * │ FCM tokeni o'zgaruvchan: Firebase uni o'zi yangilaydi, ilova qayta    │
 * │ o'rnatilganda yoki ma'lumotlar tozalanganda ham almashadi.            │
 * │                                                                       │
 * │ Agar backend yozuvni faqat token bo'yicha saqlasa, bitta telefon      │
 * │ uchun bazada o'nlab o'lik yozuv to'planardi va har yuborishda         │
 * │ bekorga urinib chiqilardi. Shuning uchun backenddagi unikal kalit —   │
 * │ `(user, device_id)`, token esa yangilanadigan maydon.                 │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * MMKV da saqlanadi, ya'ni ilova o'chirilmaguncha o'zgarmaydi. Qayta
 * o'rnatishda yangisi yaraladi — bu normal: eski yozuvni backend yaroqsiz
 * token bo'yicha o'zi tozalaydi.
 *
 * Bir qurilmada bir nechta hisob ishlatilsa, `device_id` bir xil bo'lib
 * `user` boshqa bo'ladi — backend buni qo'llab-quvvatlaydi.
 */
export function getDeviceId(): string {
  const saved = storage.get(KEY);
  if (saved) return saved;

  /*
   * `api-client.ts:16` dagi bilan bir xil zaxira: `crypto.randomUUID`
   * hamma muhitda mavjud emas. Bu yerda kriptografik kuch talab
   * qilinmaydi — faqat qurilmalar orasida to'qnashmaslik kerak.
   */
  const generated =
    globalThis.crypto?.randomUUID?.() ??
    `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  storage.set(KEY, generated);
  return generated;
}
