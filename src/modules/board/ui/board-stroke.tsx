import { memo } from "react";
import {
  Circle,
  Group,
  Path,
  Rect,
  Skia,
  Text as SkiaText,
  useFont,
  type SkFont,
} from "@shopify/react-native-skia";
import type { Point, StrokeDto, StrokeShapeDto } from "../api/board.dto";
import { arrowHeadPoints, strokeKindOf } from "../lib/board.geometry";

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
  /** Matn uchun shrift — `useFont` bilan bir marta yuklanadi va uzatiladi. */
  font: SkFont | null;
  /** Tanlangan stroke ajratib ko'rsatiladi (o'chirish uchun). */
  selected?: boolean;
}

export const BoardStroke = memo(function BoardStroke({
  stroke,
  font,
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

  if (stroke.type === "text" && font) {
    // Ko'p qatorli matn: Skia `\n` ni o'zi ajratmaydi.
    const lines = String(stroke.text ?? "").split("\n");
    const size = stroke.size ?? 20;
    return (
      <Group opacity={selected ? 0.45 : 1}>
        {lines.map((line, index) => (
          <SkiaText
            key={index}
            x={stroke.x}
            y={stroke.y + index * size * 1.25}
            text={line}
            font={font}
            color={color}
          />
        ))}
      </Group>
    );
  }

  /*
   * Formula (`type: "math"`) Skia'da chizilmaydi — LaTeX render qilish uchun
   * matn dvigateli kerak. U `BoardMathLayer` da WebView orqali ustiga
   * qo'yiladi (izohi o'sha faylda).
   */
  return null;
});

/** Matn strokelari uchun tizim shrifti — bir marta yuklanadi. */
export function useBoardFont(size = 20) {
  // `null` — Skia tizim shriftini oladi (maxsus shrift fayli kerak emas).
  return useFont(null, size);
}

/** Tanlash uchun: bosilgan nuqta shu stroke ustidami? */
export function hitTestStroke(stroke: StrokeDto, [px, py]: Point, tolerance = 12): boolean {
  const kind = strokeKindOf(stroke);

  if (kind === "pen" || kind === "marker") {
    const points = "points" in stroke ? (stroke.points ?? []) : [];
    return points.some(([x, y]) => Math.hypot(x - px, y - py) <= tolerance);
  }

  if (stroke.type === "line") {
    return distanceToSegment([px, py], [stroke.x1, stroke.y1], [stroke.x2, stroke.y2]) <= tolerance;
  }

  if (stroke.type === "rect" || stroke.type === "ellipse") {
    return (
      px >= stroke.x - tolerance &&
      px <= stroke.x + stroke.w + tolerance &&
      py >= stroke.y - tolerance &&
      py <= stroke.y + stroke.h + tolerance
    );
  }

  if (stroke.type === "text" || stroke.type === "math") {
    const size = stroke.size ?? 20;
    return (
      px >= stroke.x - tolerance &&
      px <= stroke.x + size * 12 &&
      py >= stroke.y - size &&
      py <= stroke.y + size
    );
  }

  return false;
}

function distanceToSegment([px, py]: Point, [x1, y1]: Point, [x2, y2]: Point): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(px - x1, py - y1);

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
