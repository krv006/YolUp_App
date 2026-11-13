import { memo } from "react";
import { Circle, Group, Path, Rect, Skia, Text as SkiaText } from "@shopify/react-native-skia";
import type { Point, StrokeShapeDto } from "../api/board.dto";
import { BOARD_TEXT_SIZE } from "../constants/board.constants";
import { TEXT_LINE_HEIGHT } from "../lib/board-flow";
import { arrowHeadPoints, strokeKindOf } from "../lib/board.geometry";
import { boardFont } from "./board-font";
import { CodeBlock } from "./code-block";
import { RichTextStroke } from "./rich-text-stroke";

/**
 * Bitta stroke'ni Skia'da chizadi.
 *
 * Veb versiya SVG elementlarini qaytarardi; bu yerda esa Skia tugunlari.
 * Shakl MANTIG'I (`strokeKindOf`, `arrowHeadPoints`) 🟢 veb'dan ko'chirilgan —
 * strelka uchi burchagi ikkala platformada aynan bir xil chiqadi.
 */

const DEFAULT_COLOR = "#1a1f26";
const DEFAULT_WIDTH = 3;

/** Nuqtalar ro'yxatidan silliq yo'l — qalam va marker uchun. */
function freehandPath(points: Point[]) {
  const path = Skia.Path.Make();
  if (points.length === 0) return path;

  const [first, ...rest] = points;
  path.moveTo(first![0], first![1]);

  if (rest.length === 0) {
    // Bitta nuqta — kichkina chiziq, aks holda Skia hech narsa chizmaydi.
    path.lineTo(first![0] + 0.1, first![1] + 0.1);
    return path;
  }

  /*
   * Kvadratik silliqlash: har ikki nuqta orasidagi O'RTA nuqtaga egri
   * chiziladi, nuqtaning o'zi esa boshqaruv nuqtasi bo'ladi. Oddiy `lineTo`
   * bilan barmoq bilan chizilgan chiziq burchakli va "sinuvchan" ko'rinadi.
   */
  for (let index = 0; index < rest.length; index += 1) {
    const current = rest[index]!;
    const previous = index === 0 ? first! : rest[index - 1]!;
    const midX = (previous[0] + current[0]) / 2;
    const midY = (previous[1] + current[1]) / 2;
    path.quadTo(previous[0], previous[1], midX, midY);
  }

  const last = rest[rest.length - 1]!;
  path.lineTo(last[0], last[1]);
  return path;
}

function linePath(x1: number, y1: number, x2: number, y2: number, arrow?: boolean) {
  const path = Skia.Path.Make();
  path.moveTo(x1, y1);
  path.lineTo(x2, y2);

  if (arrow) {
    // `arrowHeadPoints` "x,y x,y x,y" satrini qaytaradi (SVG merosi).
    const [left, tip, right] = arrowHeadPoints(x1, y1, x2, y2)
      .split(" ")
      .map((pair) => pair.split(",").map(Number) as [number, number]);
    if (left && tip && right) {
      path.moveTo(left[0], left[1]);
      path.lineTo(tip[0], tip[1]);
      path.lineTo(right[0], right[1]);
    }
  }
  return path;
}

export interface BoardStrokeProps {
  stroke: StrokeShapeDto;
  /** O'chirish kutilayotgan stroke ajratib ko'rsatiladi (sabab oynasi ochiq). */
  selected?: boolean;
}

export const BoardStroke = memo(function BoardStroke({
  stroke,
  selected = false,
}: BoardStrokeProps) {
  const color = stroke.color ?? DEFAULT_COLOR;
  const width = stroke.width ?? DEFAULT_WIDTH;
  const kind = strokeKindOf(stroke);

  const common = {
    color,
    style: "stroke" as const,
    strokeWidth: width,
    strokeCap: "round" as const,
    strokeJoin: "round" as const,
    // Marker shaffof (docs/PROJECT.md §5.3); tanlangan stroke ham so'niq
    // ko'rinadi — o'chirishdan oldin qaysi element tanlanganini bildiradi.
    opacity: selected ? 0.45 : kind === "marker" ? 0.4 : 1,
  };

  if (kind === "pen" || kind === "marker") {
    const points = "points" in stroke ? (stroke.points ?? []) : [];
    return <Path path={freehandPath(points)} {...common} />;
  }

  if (stroke.type === "line") {
    return <Path path={linePath(stroke.x1, stroke.y1, stroke.x2, stroke.y2, stroke.arrow)} {...common} />;
  }

  if (stroke.type === "rect") {
    return <Rect x={stroke.x} y={stroke.y} width={stroke.w} height={stroke.h} {...common} />;
  }

  if (stroke.type === "ellipse") {
    // Skia'da ellips — o'lchamli aylana; markazga va radiusga o'giramiz.
    return (
      <Group
        transform={[
          { translateX: stroke.x + stroke.w / 2 },
          { translateY: stroke.y + stroke.h / 2 },
          { scaleX: stroke.w / 2 || 1 },
          { scaleY: stroke.h / 2 || 1 },
        ]}
      >
        <Circle cx={0} cy={0} r={1} {...common} strokeWidth={width / Math.max(1, stroke.w / 2)} />
      </Group>
    );
  }

  if (stroke.type === "text") {
    const size = stroke.size ?? BOARD_TEXT_SIZE;

    /*
     * Formatlangan matn (qalin, kursiv, ro'yxat) alohida chiziladi —
     * veb ham `lines` bo'lsa o'shani afzal ko'radi (`board-stroke.tsx:23`).
     * `lines` bo'lmasa oddiy `text` ga qaytamiz.
     */
    if (stroke.lines?.length) {
      return (
        <RichTextStroke
          lines={stroke.lines}
          x={stroke.x}
          y={stroke.y}
          size={size}
          color={color}
          opacity={selected ? 0.45 : 1}
        />
      );
    }

    /*
     * Ko'p qatorli matn: Skia `\n` ni o'zi ajratmaydi. Shrift stroke
     * o'lchamida va `600` qalinlikda, qator oralig'i `size × 1.35` — veb
     * va PDF bilan bir xil (avval hamma matn 20px va 1.25 oraliqda edi,
     * S/M/L/XL o'lchamlari telefonda ko'rinmasdi).
     */
    const font = boardFont(size);
    const lines = String(stroke.text ?? "").split("\n");
    return (
      <Group opacity={selected ? 0.45 : 1}>
        {lines.map((line, index) => (
          <SkiaText
            key={index}
            x={stroke.x}
            y={stroke.y + index * size * TEXT_LINE_HEIGHT}
            text={line}
            font={font}
            color={color}
          />
        ))}
      </Group>
    );
  }

  if (stroke.type === "code") {
    return <CodeBlock stroke={stroke} color={color} opacity={selected ? 0.45 : 1} />;
  }

  /*
   * Formula (`type: "math"`) Skia'da chizilmaydi — LaTeX render qilish uchun
   * matn dvigateli kerak. U `BoardMathLayer` da WebView orqali ustiga
   * qo'yiladi (izohi o'sha faylda).
   */
  return null;
});
