import palette from "./palette.json";

/**
 * YolUp dizayn tokenlari — veb `src/shared/styles/theme.css` ning porti.
 *
 * Rang qiymatlari `palette.json` da (yagona manba); shu fayl ularni tiplaydi
 * va JS'dan foydalanish uchun ochadi. `className` orqali ishlatilganda
 * NativeWind `global.css` dagi CSS o'zgaruvchilarini o'qiydi — u ham shu
 * JSON'dan generatsiya qilinadi (`npm run build:tokens`).
 *
 * JS qiymatlari kerak bo'ladigan joylar: navigatsiya temasi, StatusBar,
 * Skia (doska), grafiklar — ular `className` qabul qilmaydi.
 *
 * ─── WCAG eslatmalari (veb'dan ko'chirildi, o'zgartirilmaydi) ───
 * `primary` (#1A66E0) — tugma FONI. Oq matn bilan 5.22:1.
 *   Yorug'roq #2B7FFF da oq matn atigi 3.76:1 berardi va o'qilmasdi.
 * `primary-text` (#1466E8) — yuza ustidagi brend MATNI, 5.13:1.
 *   Qorong'ida #4D91FF: eng yomon holatda (aktiv tab ustida) 4.90:1.
 * `muted-foreground` — oq fonda 5.87:1, sahifa fonida 5.47:1.
 * `destructive` — oq matn bilan 4.88:1 (shuning uchun matn OQ bo'la oladi).
 */

export type ColorName = keyof typeof palette.light;
export type ColorScheme = "light" | "dark";

export const colors = {
  light: palette.light,
  dark: palette.dark,
} as const;

/** Joriy sxemaga ko'ra rang — `className` ishlatib bo'lmaydigan joylar uchun. */
export function color(scheme: ColorScheme, name: ColorName): string {
  return colors[scheme][name];
}

/**
 * Radius shkalasi — veb `--r-*` tokenlari.
 * Veb'da 21 xil qiymat bor edi; shkala ularni 6 pog'onaga yig'adi.
 */
export const radius = {
  xs: 7,
  sm: 10,
  md: 13,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

/**
 * Tipografiya shkalasi — veb `--fs-*` tokenlari.
 * Nom fazosi ataylab `text-*` emas: u Tailwind'niki.
 */
export const fontSize = {
  "2xs": 11,
  xs: 12,
  sm: 13,
  md: 14,
  lg: 15,
  xl: 16,
  "2xl": 17,
  "3xl": 19,
  "4xl": 21,
  "5xl": 24,
  "6xl": 28,
  "7xl": 44,
} as const;

/** 4px bazasidagi oraliq shkalasi (Tailwind bilan bir xil). */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

/**
 * Minimal teginish maydoni — iOS HIG 44pt, Android Material 48dp.
 * Har bosiladigan element shu o'lchovdan kichik bo'lmasligi kerak.
 */
export const MIN_TOUCH_SIZE = 44;
