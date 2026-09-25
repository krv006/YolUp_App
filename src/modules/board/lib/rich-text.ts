import type { TextLineDto } from "../api/board.dto";

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
