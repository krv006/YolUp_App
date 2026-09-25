
export type MessageToken =
  | { kind: "text"; value: string }
  | { kind: "internal"; value: string; href: string }
  | { kind: "external"; value: string; href: string };

const LINK_PATTERN = /(https?:\/\/[^\s<>"']+|\/(?:boards|recordings)\/[\w-]+\/?)/g;

const INTERNAL_PATH = /^\/(?:boards|recordings)\/[\w-]+\/?$/;

const TRAILING = /[.,;:!?)\]}»"']+$/;

function toInternalPath(raw: string): string | null {
  if (INTERNAL_PATH.test(raw)) return raw.replace(/\/$/, "");

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
