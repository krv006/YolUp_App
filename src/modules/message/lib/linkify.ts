/**
 * Chat matnidagi havolalarni ajratish.
 *
 * Backend dars tugagach kurs chatiga `".../boards/<lesson_id>"` va
 * `".../recordings/<lesson_id>"` havolalarini oddiy MATN sifatida yuboradi
 * (docs/README §Frontend integratsiyasi). Shularni ilova ichidagi marshrutga
 * aylantirish uchun matnni tokenlarga bo'lamiz.
 *
 * HTML generatsiya qilinmaydi — natija React tomonidan render qilinadigan
 * oddiy obyektlar, shuning uchun XSS xavfi yo'q.
 */

export type MessageToken =
  | { kind: "text"; value: string }
  | { kind: "internal"; value: string; href: string }
  | { kind: "external"; value: string; href: string };

/** To'liq URL yoki `/boards/<id>` ko'rinishidagi nisbiy yo'l. */
const LINK_PATTERN = /(https?:\/\/[^\s<>"']+|\/(?:boards|recordings)\/[\w-]+\/?)/g;

/** Ilova ichidagi marshrutlar — chatdagi havola shu sahifalarga tushadi. */
const INTERNAL_PATH = /^\/(?:boards|recordings)\/[\w-]+\/?$/;

/** Jumla oxiridagi tinish belgisi havolaga yopishib qolmasin. */
const TRAILING = /[.,;:!?)\]}»"']+$/;

function toInternalPath(raw: string): string | null {
  if (INTERNAL_PATH.test(raw)) return raw.replace(/\/$/, "");

  // To'liq URL ham ichki bo'lishi mumkin: https://fokus.uz/recordings/<id>
  try {
    const { pathname } = new URL(raw);
    return INTERNAL_PATH.test(pathname) ? pathname.replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

export function tokenizeMessageText(text: string): MessageToken[] {
  const tokens: MessageToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    const start = match.index;
    const trailing = match[0].match(TRAILING)?.[0] ?? "";
    const link = match[0].slice(0, match[0].length - trailing.length);
    if (!link) continue;

    if (start > lastIndex) tokens.push({ kind: "text", value: text.slice(lastIndex, start) });

    const internal = toInternalPath(link);
    tokens.push(
      internal
        ? { kind: "internal", value: link, href: internal }
        : { kind: "external", value: link, href: link }
    );

    if (trailing) tokens.push({ kind: "text", value: trailing });
    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) tokens.push({ kind: "text", value: text.slice(lastIndex) });
  return tokens;
}
