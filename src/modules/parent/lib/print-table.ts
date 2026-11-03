import { shareHtmlAsPdf } from "@/shared/lib";

export interface PrintableTable {
  documentTitle: string;
  heading: string;
  subtitle: string;
  summary: Array<{ label: string; value: string }>;
  columns: string[];
  rows: string[][];
}

const STYLE = `
  @page { size: A4 landscape; margin: 16mm; }
  body { margin: 0; font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1b1f3b; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  p { margin: 0; color: #5b6075; font-size: 13px; }
  .summary { display: flex; gap: 28px; margin: 18px 0; }
  .summary span { font-size: 12px; color: #5b6075; }
  .summary strong { display: block; font-size: 18px; color: #1b1f3b; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 8px; border-bottom: 2px solid #dfe3ee; color: #5b6075; font-weight: 600; }
  td { padding: 8px; border-bottom: 1px solid #eef0f5; }
`;

/*
 * A4 albom — nuqtalarda. Chetlar ikki joyda: Android `margins` parametrini
 * e'tiborsiz qoldiradi va `@page` ni oladi, iOS esa aksincha — har biri
 * faqat bittasini qo'llaydi, ikki barobar bo'lmaydi.
 */
const A4_LANDSCAPE = { width: 842, height: 595, margin: 45 };

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

/**
 * Veb `modules/parent/lib/print-table.ts` ning mobil varianti: vebda yashirin
 * iframe'da brauzerning chop etish oynasi ochilardi. Mobilda o'sha jadval
 * A4 albom PDF'ga aylantiriladi va `<documentTitle>.pdf` bo'lib ulashish
 * oynasida ochiladi (`shared/lib/share-file.ts`).
 */
export function printTable({ documentTitle, heading, subtitle, summary, columns, rows }: PrintableTable): Promise<boolean> {
  const facts = summary.map((item) => `<span><strong>${escape(item.value)}</strong>${escape(item.label)}</span>`).join("");
  const head = `<tr>${columns.map((column) => `<th>${escape(column)}</th>`).join("")}</tr>`;
  const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(documentTitle)}</title><style>${STYLE}</style></head><body><h1>${escape(heading)}</h1><p>${escape(subtitle)}</p><div class="summary">${facts}</div><table>${head}${body}</table></body></html>`;
  return shareHtmlAsPdf(documentTitle, html, A4_LANDSCAPE);
}
