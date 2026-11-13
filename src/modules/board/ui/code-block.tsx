import { useMemo } from "react";
import { Group, RoundedRect, Text as SkiaText } from "@shopify/react-native-skia";
import type { CodeStrokeDto } from "../api/board.dto";
import { CODE_BACKGROUND, CODE_LINE_HEIGHT, CODE_PAD, codeBoxWidth } from "../lib/code-highlight";
import { useCodeTokens } from "../model/use-code-tokens";
import { codeFont } from "./board-font";

export interface CodeBlockProps {
  stroke: CodeStrokeDto;
  color: string;
  opacity?: number;
}

/**
 * Kod bloki — veb `code-block.tsx` ning Skia varianti: `#f6f8fa` fon,
 * monospace, qator oralig'i `size × 1.35`, highlight.js ranglari. Vebda
 * `<tspan>` lar o'zi qatorga tushadi; Skia'da har token qo'lda, oldingi
 * token kengligicha surilib chiziladi.
 */
export function CodeBlock({ stroke, color, opacity = 1 }: CodeBlockProps) {
  const size = stroke.size ?? 20;
  const lineHeight = size * CODE_LINE_HEIGHT;
  const lines = useCodeTokens(String(stroke.text ?? ""), stroke.language);
  const font = codeFont(size);

  const pieces = useMemo(
    () =>
      lines.flatMap((tokens, index) => {
        let cursor = stroke.x;
        return tokens.map((token) => {
          const piece = {
            text: token.text,
            color: token.color,
            x: cursor,
            y: stroke.y + index * lineHeight,
          };
          cursor += font.getTextWidth(token.text);
          return piece;
        });
      }),
    [lines, stroke.x, stroke.y, lineHeight, font]
  );

  return (
    <Group opacity={opacity}>
      <RoundedRect
        x={stroke.x - CODE_PAD}
        y={stroke.y - size * 1.05}
        width={codeBoxWidth(stroke)}
        height={size * 1.5 + (lines.length - 1) * lineHeight}
        r={4}
        color={CODE_BACKGROUND}
      />
      {pieces.map((piece, index) => (
        <SkiaText
          key={index}
          x={piece.x}
          y={piece.y}
          text={piece.text}
          font={font}
          color={piece.color ?? color}
        />
      ))}
    </Group>
  );
}
