/**
 * `FormData.prototype.set` ni React Native uchun to'ldiradi.
 *
 * NEGA KERAK: RN ning `FormData` si — brauzernikining to'liq nusxasi emas.
 * Unda faqat `append`, `getAll` va `getParts` bor; `set` YO'Q
 * (`react-native/Libraries/Network/FormData.js`).
 *
 * Ko'chirilgan kodda `set` 14 joyda ishlatiladi — avatar va sertifikat
 * yuklash, guruh chat rasmi, uy vazifasini topshirish, vazifa yaratish.
 * Ularsiz bu oqimlarning HAMMASI qurilmada "body.set is not a function"
 * bilan yiqilardi.
 *
 * Buni na `tsc`, na ESLint ushlay olmaydi: Expo'ning tsconfig'i `DOM` lib'ini
 * yoqadi, ya'ni TypeScript brauzerning to'liq `FormData` tipini ko'radi.
 *
 * RAD ETILGAN YO'L: beshta faylni `append` ga o'tkazish. Ularning hammasi
 * 🟢 NUSXA; tahrirlansa 🟡 ga aylanib, veb'dagi har o'zgarish qo'lda
 * birlashtirishni talab qilardi (MOBILE_PLAN §18.3).
 *
 * Semantika brauzernikidek: shu kalitdagi eski qiymatlar olib tashlanadi,
 * so'ng yangisi qo'shiladi.
 */

interface ReactNativeFormData {
  _parts?: [string, unknown][];
  append(key: string, value: unknown): void;
}

export function installFormDataShim(): void {
  const prototype = FormData.prototype as unknown as ReactNativeFormData & {
    set?: (key: string, value: unknown) => void;
  };

  if (typeof prototype.set === "function") return;

  prototype.set = function set(this: ReactNativeFormData, key: string, value: unknown): void {
    // `_parts` — RN ning ichki maydoni. U kutilgan shaklda bo'lmasa
    // (kelajakdagi RN versiyasi), jimgina `append` ga qaytamiz: dublikat
    // kalit yaratishimiz mumkin, lekin so'rov baribir ketadi.
    if (Array.isArray(this._parts)) {
      this._parts = this._parts.filter(([name]) => name !== key);
    }
    this.append(key, value);
  };
}
