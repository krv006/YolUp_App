import type { TextLineDto, TextListKind, TextRunDto } from "../api/board.dto";

/**
 * Doskadagi formatlangan matn bilan ishlash.
 *
 * 🟡 VEB'DAN FARQ — `htmlToLines` KO'CHIRILMADI.
 *
 * Veb'da matn `contenteditable` ichida yoziladi va `htmlToLines` brauzer
 * chizgan HTML'ni (`window.getComputedStyle` bilan) qatorlar DTO'siga
 * aylantiradi. Mobilda `contenteditable` ham, `getComputedStyle` ham yo'q —
 * matn `TextInput` da yoziladi va formatlash tugmalari bilan belgilanadi,
 * ya'ni DTO to'g'ridan-to'g'ri quriladi va oraliq HTML umuman bo'lmaydi.
 *
 * Qolgan uchta funksiya SOF va veb bilan bayt-bayt bir xil: ular kelgan
 * qatorlarni KO'RSATISH uchun kerak, ya'ni veb'da yozilgan formatlangan
 * matn mobilda to'g'ri chiqadi.
 */

export function listMarkers(lines: readonly TextLineDto[]): string[] {
  let counter = 0;
  return lines.map((line) => {
    if (line.list === "number") {
      counter += 1;
      return `${counter}. `;
    }
    counter = 0;
    return line.list === "bullet" ? "• " : "";
  });
}

export function linesToPlainText(lines: readonly TextLineDto[]): string {
  const markers = listMarkers(lines);
  return lines.map((line, index) => markers[index] + line.runs.map((run) => run.text).join("")).join("\n");
}

export function hasRichFormatting(lines: readonly TextLineDto[]): boolean {
  return lines.some(
    (line) => Boolean(line.list) || line.runs.some((run) => run.bold || run.italic || run.underline)
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function runHtml(run: TextRunDto): string {
  let html = escapeHtml(run.text);
  if (run.underline) html = `<u>${html}</u>`;
  if (run.italic) html = `<i>${html}</i>`;
  if (run.bold) html = `<b>${html}</b>`;
  return html;
}

export function linesToHtml(lines: readonly TextLineDto[]): string {
  let html = "";
  let list: TextListKind | undefined;
  const close = () => {
    if (list) html += list === "bullet" ? "</ul>" : "</ol>";
    list = undefined;
  };
  for (const line of lines) {
    const content = line.runs.map(runHtml).join("") || "<br>";
    if (line.list) {
      if (list !== line.list) {
        close();
        html += line.list === "bullet" ? "<ul>" : "<ol>";
        list = line.list;
      }
      html += `<li>${content}</li>`;
    } else {
      close();
      html += `<div>${content}</div>`;
    }
  }
  close();
  return html;
}

export function plainTextToLines(text: string): TextLineDto[] {
  return text.split("\n").map((line) => ({ runs: line ? [{ text: line }] : [] }));
}
