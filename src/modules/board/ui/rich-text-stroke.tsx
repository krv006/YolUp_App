import { useMemo } from "react";
import {
  Group,
  matchFont,
  Rect,
  Text as SkiaText,
  type SkFont,
} from "@shopify/react-native-skia";
import type { TextLineDto } from "../api/board.dto";
import { listMarkers } from "../lib/rich-text";

/**
 * Formatlangan matn strokesi — veb `board-stroke.tsx:23-46` ning mobil
 * varianti.
 *
 * NEGA ALOHIDA FAYL: bu yerda har RUN uchun alohida shrift tanlanadi va
 * kenglik o'lchanadi. Vebda buning hammasini SVG `<tspan>` o'zi qiladi —
 * bir necha qator kod. Skia'da esa qo'lda joylashtirish kerak, shuning
 * uchun mantiq `board-stroke.tsx` ni ikki barobar uzaytirib yubormasligi
 * uchun bu yerga ajratildi.
 *
 * Bungacha mobil `stroke.lines` ni UMUMAN o'qimasdi va faqat `stroke.text`
 * ni chizardi — ya'ni vebda qalin harf yoki ro'yxat bilan yozilgan matn
 * telefonda formatsiz va belgisiz ko'rinardi.
 */

/** Qator balandligi — veb `lineHeight = size * 1.35` bilan bir xil. */
const LINE_HEIGHT = 1.35;
/** Tagiga chizish qalinligi va matndan pastdagi masofa (shrift ulushida). */
const UNDERLINE_WIDTH = 0.06;
const UNDERLINE_OFFSET = 0.16;

interface Piece {
  text: string;
  font: SkFont;
  x: number;
  underline: boolean;
}

export interface RichTextStrokeProps {
  lines: readonly TextLineDto[];
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
}

export function RichTextStroke({ lines, x, y, size, color, opacity }: RichTextStrokeProps) {
  /*
   * Shriftlar va joylashuv BIR MARTA hisoblanadi: `matchFont` har
   * chaqirilganda tizim shrift menejeriga boradi, doskada esa yuzlab
   * stroke bo'lishi mumkin.
   */
  const rows = useMemo(() => {
    const markers = listMarkers(lines);

    // Veb qalinligi: oddiy matn 600, qalin 800, belgi 700.
    const fontFor = (bold?: boolean, italic?: boolean) =>
      matchFont({
        fontSize: size,
        fontWeight: bold ? "800" : "600",
        fontStyle: italic ? "italic" : "normal",
      });

    const markerFont = matchFont({ fontSize: size, fontWeight: "700" });

    return lines.map((line, index) => {
      const pieces: Piece[] = [];
      let cursor = x;

      const marker = markers[index];
      if (marker) {
        pieces.push({ text: marker, font: markerFont, x: cursor, underline: false });
        cursor += markerFont.getTextWidth(marker);
      }

      for (const run of line.runs) {
        if (!run.text) continue;
        const font = fontFor(run.bold, run.italic);
        pieces.push({ text: run.text, font, x: cursor, underline: Boolean(run.underline) });
        cursor += font.getTextWidth(run.text);
      }

      return { pieces, y: y + index * size * LINE_HEIGHT };
    });
  }, [lines, size, x, y]);

  return (
    <Group opacity={opacity}>
      {rows.map((row, rowIndex) =>
        row.pieces.map((piece, pieceIndex) => (
          <Group key={`${rowIndex}-${pieceIndex}`}>
            <SkiaText x={piece.x} y={row.y} text={piece.text} font={piece.font} color={color} />
            {/*
              * Skia'da matnni tagiga chizish imkoniyati yo'q — chiziq
              * qo'lda qo'yiladi. Kenglik o'sha shrift bilan o'lchanadi,
              * shuning uchun u matndan qisqa yoki uzun bo'lib qolmaydi.
              */}
            {piece.underline ? (
              <Rect
                x={piece.x}
                y={row.y + size * UNDERLINE_OFFSET}
                width={piece.font.getTextWidth(piece.text)}
                height={Math.max(1, size * UNDERLINE_WIDTH)}
                color={color}
              />
            ) : null}
          </Group>
        ))
      )}
    </Group>
  );
}
