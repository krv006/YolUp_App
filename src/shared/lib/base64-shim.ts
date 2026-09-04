/**
 * `atob` / `btoa` — mavjud bo'lmasa qo'shiladi.
 *
 * NEGA KERAK: ko'chirilgan `live-token.ts` LiveKit token'ining ichini o'qish
 * uchun `atob` ishlatadi — token qaysi manbalarni (mikrofon, kamera) uzatishga
 * ruxsat berishini bilish uchun. `atob` bo'lmasa funksiya `catch` ga tushib
 * "ruxsat bor" deb qaytaradi va o'quvchiga ishlamaydigan mikrofon tugmasi
 * ko'rsatiladi.
 *
 * Hermes odatda `atob`/`btoa` ni beradi, lekin buni RN/Expo versiyalari
 * bo'ylab KAFOLATLAB bo'lmaydi va tsc ham tekshirmaydi (DOM lib ularni
 * mavjud deb ko'rsatadi). Shuning uchun mavjudligi ish paytida tekshiriladi
 * va faqat kerak bo'lsa o'rnatiladi — mahalliy implementatsiya hech qachon
 * platformanikidan ustun qo'yilmaydi.
 *
 * Faqat JWT bo'laklari uchun ishlatiladi (kichik satrlar), shuning uchun
 * sodda implementatsiya yetarli.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function encode(input: string): string {
  let output = "";
  for (let index = 0; index < input.length; index += 3) {
    const a = input.charCodeAt(index);
    const b = input.charCodeAt(index + 1);
    const c = input.charCodeAt(index + 2);

    output += ALPHABET[a >> 2];
    output += ALPHABET[((a & 3) << 4) | (Number.isNaN(b) ? 0 : b >> 4)];
    output += Number.isNaN(b) ? "=" : ALPHABET[((b & 15) << 2) | (Number.isNaN(c) ? 0 : c >> 6)];
    output += Number.isNaN(c) ? "=" : ALPHABET[c & 63];
  }
  return output;
}

function decode(input: string): string {
  const cleaned = input.replace(/[\t\n\f\r ]+/g, "").replace(/=+$/, "");
  let output = "";
  let buffer = 0;
  let bits = 0;

  for (const character of cleaned) {
    const value = ALPHABET.indexOf(character);
    if (value === -1) {
      throw new Error("atob: base64 bo'lmagan belgi");
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

export function installBase64Shim(): void {
  const target = globalThis as {
    atob?: (input: string) => string;
    btoa?: (input: string) => string;
  };

  if (typeof target.atob !== "function") target.atob = decode;
  if (typeof target.btoa !== "function") target.btoa = encode;
}
