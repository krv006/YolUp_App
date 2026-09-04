import { installFormDataShim } from "./form-data-shim";
import { installWebStorageShim } from "./web-storage-shim";

/**
 * Yon-effektli modul: import qilinishining O'ZI ilovani ishga tayyorlaydi.
 *
 * `src/app/_layout.tsx` ning ENG BIRINCHI importi bo'lishi shart. ES modul
 * baholanishi chuqurlik bo'yicha va import tartibida ketadi, shuning uchun
 * shu yerdagi kod boshqa modullardan (jumladan `persist` ishlatadigan
 * zustand store'lardan) oldin bajariladi.
 *
 * Kech qolinsa store allaqachon "saqlagich yo'q" deb qaror qilib bo'ladi va
 * foydalanuvchi tanlovlari jimgina saqlanmay qoladi.
 *
 * Bu yerdagi ikkala shim ham VEB API'sining RN'da yetishmayotgan qismini
 * to'ldiradi. Ikkalasi ham `tsc` va ESLint ko'ra olmaydigan xatolarni
 * yopadi — Expo tsconfig'i `DOM` lib'ini yoqadi va TypeScript brauzerning
 * to'liq API'sini ko'radi, RN esa uni to'liq bermaydi.
 */
installWebStorageShim();
installFormDataShim();
