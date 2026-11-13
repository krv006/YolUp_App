import { useMemo } from "react";
import { Group, Rect, Text as SkiaText } from "@shopify/react-native-skia";
import type { TextLineDto } from "../api/board.dto";
import { richTextRows } from "../lib/board-measure";

/**
 * Formatlangan matn strokesi — veb `board-stroke.tsx:23-46` ning mobil
 * varianti.
 *
 * NEGA ALOHIDA FAYL: bu yerda har RUN uchun alohida shrift tanlanadi va
 * kenglik o'lchanadi. Vebda buning hammasini SVG `<tspan>` o'zi qiladi —
 * bir necha qator kod. Skia'da esa qo'lda joylashtirish kerak, shuning
 * uchun mantiq `board-stroke.tsx` ni ikki barobar uzaytirib yubormasligi
 * uchun bu yerga ajratildi. Joylashuvning o'zi `richTextRows` da — tanlash
 * ramkasi ham aynan shu o'lchov bilan chiziladi.
 *
 * Bungacha mobil `stroke.lines` ni UMUMAN o'qimasdi va faqat `stroke.text`
 * ni chizardi — ya'ni vebda qalin harf yoki ro'yxat bilan yozilgan matn
 * telefonda formatsiz va belgisiz ko'rinardi.
 */

/** Tagiga chizish qalinligi va matndan pastdagi masofa (shrift ulushida). */
const UNDERLINE_WIDTH = 0.06;
const UNDERLINE_OFFSET = 0.16;

export interface RichTextStrokeProps {
  lines: readonly TextLineDto[];
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
}

export function RichTextStroke({ lines, x, y, size, color, opacity }: RichTextStrokeProps) {
  // Shriftlar keshlangan (`boardFont`), joylashuv esa bir marta hisoblanadi.
  const rows = useMemo(() => richTextRows(lines, x, y, size), [lines, size, x, y]);

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
