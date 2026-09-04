/**
 * Veb `src/shared/lib/sanitize-html.ts` ning mobil varianti.
 *
 * Farq: mobilda DOM yo'q, shuning uchun DOMPurify ishlatilmaydi. HTML
 * `WebView` ichida ko'rsatiladi va u yerda himoya ikki qatlamli:
 *   1) backend `nh3` bilan tozalaydi (docs/COMPLETED_WORK.md §2),
 *   2) WebView `originWhitelist` + CSP bilan qulflanadi va JS o'chiriladi.
 *
 * Shu funksiya qo'shimcha uchinchi qatlam: `<script>`, `<iframe>`, hodisa
 * atributlari va `javascript:` sxemasi WebView'ga umuman yetib bormaydi.
 * Regex — to'liq HTML parser emas, lekin bu yerda u oxirgi chiziq emas,
 * balki chuqurlashtirilgan himoya (defense in depth).
 */

/** Butunlay olib tashlanadigan teglar — ichidagi matni bilan birga. */
const DANGEROUS_BLOCKS = /<(script|style|iframe|object|embed|link|meta|form)\b[\s\S]*?<\/\1\s*>/gi;
/** Yopilmagan xavfli teglar (`<script src=...>` kabi). */
const DANGEROUS_TAGS = /<\/?(script|style|iframe|object|embed|link|meta|form)\b[^>]*>/gi;
/** `onclick="..."`, `onerror='...'`, `onload=...` */
const EVENT_ATTRS = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
/** `href="javascript:..."`, `src="data:text/html,..."` */
const DANGEROUS_URIS = /\b(href|src|xlink:href)\s*=\s*(?:"|')?\s*(javascript|data|vbscript):[^"'>\s]*/gi;

export function sanitizeHtml(html: string): string {
  return (html ?? "")
    .replace(DANGEROUS_BLOCKS, "")
    .replace(DANGEROUS_TAGS, "")
    .replace(EVENT_ATTRS, "")
    .replace(DANGEROUS_URIS, "$1=\"#\"");
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

/**
 * HTML'dan qisqa oddiy matn — ro'yxatdagi ko'rinish uchun.
 * Veb'da `element.textContent` ishlatilardi; mobilda teglar olib tashlanadi.
 */
export function htmlToPlainText(html: string, limit = 140): string {
  const text = sanitizeHtml(html)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&[a-z#0-9]+;/gi, (entity) => HTML_ENTITIES[entity.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}
