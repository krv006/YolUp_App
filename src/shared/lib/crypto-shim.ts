/**
 * `crypto.randomUUID` — mavjud bo'lmasa qo'shiladi.
 *
 * NEGA KERAK: vebdan ko'chirilgan kod (`use-homework-board.ts`, `use-chat.ts`)
 * uni to'g'ridan-to'g'ri chaqiradi. Hermes'da u yo'q va xato chizish
 * (gesture) callback'i ichida chiqqani uchun ilova YIQILARDI — uy vazifasi
 * doskasida birinchi chiziqni chizishning o'zida.
 *
 * Platformaniki bo'lsa unga tegilmaydi. `getRandomValues` bo'lsa (LiveKit
 * `registerGlobals` qo'shadi) undan, bo'lmasa `Math.random` dan UUID v4
 * yasaladi — bu yerda u faqat vaqtinchalik va mahalliy id'lar uchun.
 */
function randomBytes(): Uint8Array {
  const bytes = new Uint8Array(16);
  const source = globalThis.crypto as Crypto | undefined;
  if (typeof source?.getRandomValues === "function") return source.getRandomValues(bytes);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return bytes;
}

function uuidV4(): `${string}-${string}-${string}-${string}-${string}` {
  const bytes = randomBytes();
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function installCryptoShim(): void {
  const scope = globalThis as unknown as { crypto?: Partial<Crypto> };
  if (!scope.crypto) scope.crypto = {};
  if (typeof scope.crypto.randomUUID !== "function") scope.crypto.randomUUID = uuidV4;
}
