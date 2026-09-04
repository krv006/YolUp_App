/**
 * `User-Agent` satrini "Chrome · Windows" ko'rinishiga keltiradi.
 *
 * Maqsad — foydalanuvchiga "bu men edimmi?" degan savolga javob berish, shuning uchun
 * aniq versiyalar emas, faqat brauzer va OS nomi ko'rsatiladi. Tanilmagan satr
 * o'zgarishsiz qaytadi (backend `curl/8.17.0` kabi qiymatlarni ham yozadi).
 */

const BROWSERS: Array<[RegExp, string]> = [
  [/\bEdg[ei]?\//i, "Edge"],
  [/\bOPR\/|\bOpera\//i, "Opera"],
  [/\bYaBrowser\//i, "Yandex"],
  [/\bFirefox\//i, "Firefox"],
  [/\bChrome\/|\bCriOS\//i, "Chrome"],
  [/\bSafari\//i, "Safari"],
];

const SYSTEMS: Array<[RegExp, string]> = [
  [/\bWindows NT\b/i, "Windows"],
  [/\bAndroid\b/i, "Android"],
  [/\biPhone\b|\biPad\b|\biOS\b/i, "iOS"],
  [/\bMac OS X\b|\bMacintosh\b/i, "macOS"],
  [/\bLinux\b|\bX11\b/i, "Linux"],
];

function match(source: string, table: Array<[RegExp, string]>): string | null {
  return table.find(([pattern]) => pattern.test(source))?.[1] ?? null;
}

export function describeUserAgent(userAgent: string | null | undefined): string {
  const value = userAgent?.trim();
  if (!value) return "Noma’lum qurilma";

  // Edge/Opera ham "Chrome/" ni o'z ichiga oladi — jadval tartibi shuni hisobga oladi.
  const browser = match(value, BROWSERS);
  const system = match(value, SYSTEMS);

  if (browser && system) return `${browser} · ${system}`;
  return browser ?? system ?? value;
}
