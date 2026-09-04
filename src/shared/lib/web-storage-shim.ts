import { mmkvInstance } from "./storage";

/**
 * `localStorage` ni MMKV ustida taqlid qiladi.
 *
 * NEGA KERAK: veb'dan ko'chirilgan uchta zustand store'i `persist`
 * middleware'ini ishlatadi (`conversation-filter`, `lesson-view`,
 * `selected-child`). Uning standart saqlagichi — `localStorage`, RN'da esa
 * bunday global yo'q. Natijada tanlovlar saqlanmasdan qolardi va bu
 * `tsc` ham, `eslint` ham ushlay olmaydigan JIM xato bo'lardi.
 *
 * RAD ETILGAN YO'L: uchala store'ga qo'lda `createJSONStorage` berish. Ular
 * 🟢 NUSXA fayllar; tahrirlansa 🟡 ga aylanib, veb'dagi har o'zgarish qo'lda
 * birlashtirishni talab qilardi (MOBILE_PLAN §18.3).
 *
 * MMKV sinxron ishlaydi — `localStorage` ning shartnomasi ham sinxron,
 * shuning uchun taqlid to'liq va yashirin farq qolmaydi.
 *
 * BU YERDA MAXFIY MA'LUMOT SAQLANMAYDI: MMKV shifrlanmagan. Tokenlar
 * `@/shared/api/token-storage` (Keychain/Keystore) da.
 */

const PREFIX = "ls:";

/** Faqat shu shim yozgan kalitlar — MMKV'dagi boshqa ma'lumot aralashmasin. */
function scoped(key: string): string {
  return `${PREFIX}${key}`;
}

function keys(): string[] {
  return mmkvInstance
    .getAllKeys()
    .filter((key) => key.startsWith(PREFIX))
    .map((key) => key.slice(PREFIX.length));
}

const webStorage: Storage = {
  get length() {
    return keys().length;
  },
  key(index: number) {
    return keys()[index] ?? null;
  },
  getItem(key: string) {
    return mmkvInstance.getString(scoped(key)) ?? null;
  },
  setItem(key: string, value: string) {
    mmkvInstance.set(scoped(key), value);
  },
  removeItem(key: string) {
    mmkvInstance.remove(scoped(key));
  },
  clear() {
    for (const key of keys()) mmkvInstance.remove(scoped(key));
  },
};

/**
 * Ilova boshlanishida, HAR QANDAY store import qilinishidan OLDIN chaqiriladi
 * (`src/app/_layout.tsx` ning birinchi importi).
 *
 * Tartib muhim: zustand `persist` saqlagichni store yaratilgan paytda o'qiydi,
 * shuning uchun kech o'rnatilsa store allaqachon "saqlagich yo'q" deb qaror
 * qilib bo'lgan bo'ladi.
 */
export function installWebStorageShim(): void {
  const target = globalThis as { localStorage?: Storage };
  if (target.localStorage) return;
  target.localStorage = webStorage;
}
