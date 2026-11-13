import type { SkFont } from "@shopify/react-native-skia";
import type { StrokeDto, TextLineDto } from "../api/board.dto";
import { BOARD_TEXT_SIZE } from "../constants/board.constants";
import { boardFont } from "../ui/board-font";
import type { StrokeBox } from "./board-edit";
import { estimateTextWidth, TEXT_LINE_HEIGHT } from "./board-flow";
import { CODE_LINE_HEIGHT, CODE_PAD, codeBoxWidth, codeLines } from "./code-highlight";
import { listMarkers } from "./rich-text";

/*
 * 🟡 MOSLASH: veb `board-measure.ts` matn, kod va formulani DOM'dan
 * o'lchaydi (`getBBox`, canvas `measureText`). React Native'da DOM yo'q —
 * matn shu yerda Skia shrift o'lchovlari bilan, kod `codeBoxWidth` va
 * qatorlar soni bilan, formula esa WebView yuborgan o'lcham (yoki taxmin)
 * bilan o'lchanadi. Joylashuv `board-stroke.tsx` / `rich-text-stroke.tsx`
 * chizgani bilan bir xil (o'sha funksiyalardan foydalanadi).
 */

/** Formula WebView'da chizilgan o'lchami (doska birligida). */
export interface MathSize {
  width: number;
  height: number;
}

export interface RichTextPiece {
  text: string;
  font: SkFont;
  x: number;
  underline: boolean;
}

export interface RichTextRow {
  pieces: RichTextPiece[];
  y: number;
  /** Qator oxiri (doska birligida). */
  right: number;
}

/** Bir necha qatorli matnning eng keng qatori — veb `textWidth` (canvas `measureText`). */
export function textWidth(text: string, size: number): number {
  const font = boardFont(size);
  return Math.max(0, ...text.split("\n").map((line) => font.getTextWidth(line)));
}

/**
 * Formatlangan matn joylashuvi: har RUN o'z shriftida, ketma-ket. Veb
 * qalinligi: oddiy matn 600, qalin 800, ro'yxat belgisi 700.
 */
export function richTextRows(
  lines: readonly TextLineDto[],
  x: number,
  y: number,
  size: number
): RichTextRow[] {
  const markers = listMarkers(lines);
  const markerFont = boardFont(size, "700");
  return lines.map((line, index) => {
    const pieces: RichTextPiece[] = [];
    let cursor = x;
    const marker = markers[index];
    if (marker) {
      pieces.push({ text: marker, font: markerFont, x: cursor, underline: false });
      cursor += markerFont.getTextWidth(marker);
    }
    for (const run of line.runs) {
      if (!run.text) continue;
      const font = boardFont(size, run.bold ? "800" : "600", Boolean(run.italic));
      pieces.push({ text: run.text, font, x: cursor, underline: Boolean(run.underline) });
      cursor += font.getTextWidth(run.text);
    }
    return { pieces, y: y + index * size * TEXT_LINE_HEIGHT, right: cursor };
  });
}

function textBox(x: number, y: number, size: number, lineCount: number, width: number): StrokeBox {
  const { ascent, descent } = boardFont(size).getMetrics();
  return {
    minX: x,
    minY: y + (ascent || -size * 0.93),
    maxX: x + Math.max(1, width),
    maxY: y + (lineCount - 1) * size * TEXT_LINE_HEIGHT + (descent || size * 0.24),
  };
}

/** Formula o'lchami ma'lum bo'lmasa (WebView hali chizmagan) — taxminiy quti. */
function mathBox(stroke: Extract<StrokeDto, { type: "math" }>, measured?: MathSize): StrokeBox {
  const size = stroke.size ?? 24;
  const top = stroke.y - size;
  if (measured)
    return {
      minX: stroke.x,
      minY: top,
      maxX: stroke.x + measured.width,
      maxY: top + measured.height,
    };
  const plain = stroke.latex.replace(/\\[a-zA-Z]+|[{}^_\\]/g, "");
  return {
    minX: stroke.x,
    minY: top,
    maxX: stroke.x + Math.min(640, estimateTextWidth(plain, size)),
    maxY: top + size * 1.6,
  };
}

/** Matn, kod va formula qutisi (shakllar uchun `null` — ularni `shapeBox` o'lchaydi). */
export function measureStroke(stroke: StrokeDto, math?: MathSize): StrokeBox | null {
  switch (stroke.type) {
    case "text": {
      const size = stroke.size ?? BOARD_TEXT_SIZE;
      if (stroke.lines?.length) {
        const rows = richTextRows(stroke.lines, stroke.x, stroke.y, size);
        const right = Math.max(...rows.map((row) => row.right));
        return textBox(stroke.x, stroke.y, size, rows.length, right - stroke.x);
      }
      const text = String(stroke.text ?? "");
      return textBox(stroke.x, stroke.y, size, text.split("\n").length, textWidth(text, size));
    }
    case "code": {
      const size = stroke.size ?? 20;
      const lines = codeLines(String(stroke.text ?? "")).length;
      const top = stroke.y - size * 1.05;
      return {
        minX: stroke.x - CODE_PAD,
        minY: top,
        maxX: stroke.x - CODE_PAD + codeBoxWidth(stroke),
        maxY: top + size * 1.5 + (lines - 1) * size * CODE_LINE_HEIGHT,
      };
    }
    case "math":
      return mathBox(stroke, math);
    default:
      return null;
  }
}
