import type { Point, StrokeDto, StrokeKind, StrokeShapeDto } from "../api/board.dto";

export const MARKER_OPACITY = 0.4;

export function strokeKindOf(stroke: StrokeShapeDto): StrokeKind {
  if (stroke.type) return stroke.type;
  return (stroke.opacity ?? 1) < 1 ? "marker" : "pen";
}

export function boxFromDrag([x1, y1]: Point, [x2, y2]: Point) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1),
    h: Math.abs(y2 - y1),
  };
}

export type DrawKind = "pen" | "marker" | "line" | "arrow" | "rect" | "ellipse";

export interface BuildStrokeInit {
  kind: DrawKind;
  from: Point;
  to: Point;
  points: Point[];
  color: string;
  width: number;
}

const MIN_DRAG = 4;

export function buildStroke({
  kind,
  from,
  to,
  points,
  color,
  width,
}: BuildStrokeInit): StrokeShapeDto | null {
  const dragged = Math.hypot(to[0] - from[0], to[1] - from[1]) >= MIN_DRAG;

  switch (kind) {
    case "pen":
      return points.length > 1 ? { points, color, width } : null;
    case "marker":
      return points.length > 1 ? { points, color, width, opacity: MARKER_OPACITY } : null;
    case "line":
    case "arrow":
      return dragged
        ? {
            type: "line",
            x1: from[0],
            y1: from[1],
            x2: to[0],
            y2: to[1],
            color,
            width,
            ...(kind === "arrow" ? { arrow: true } : {}),
          }
        : null;
    case "rect":
      return dragged ? { type: "rect", ...boxFromDrag(from, to), color, width } : null;
    case "ellipse":
      return dragged ? { type: "ellipse", ...boxFromDrag(from, to), color, width } : null;
    default:
      return null;
  }
}

export function arrowHeadPoints(x1: number, y1: number, x2: number, y2: number, size = 16): string {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const spread = Math.PI / 7;
  const left: Point = [x2 - size * Math.cos(angle - spread), y2 - size * Math.sin(angle - spread)];
  const right: Point = [x2 - size * Math.cos(angle + spread), y2 - size * Math.sin(angle + spread)];
  return `${left[0]},${left[1]} ${x2},${y2} ${right[0]},${right[1]}`;
}

export function polylinePoints(points: Point[] = []): string {
  return points.map((point) => point.join(",")).join(" ");
}

export function textLines(stroke: Extract<StrokeDto, { type: "text" }>): string[] {
  return String(stroke.text ?? "").split("\n");
}
