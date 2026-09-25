import type { PeriodicElement, Point, StrokeInput } from "../api/board.dto";

export interface PeriodicPlacement {
  color: string;
  boardWidth: number;
  boardHeight: number;
  electronLabel: string;
}

const MAX_ELECTRON_DOTS = 30;
const CARD_TEXT_SIZE = 26;
const CARD_PADDING = 18;
const CARD_LINE_HEIGHT = CARD_TEXT_SIZE * 1.35;

function cardLines(element: PeriodicElement): string[] {
  return [
    `${element.z}   ${element.symbol}`,
    element.name,
    element.mass ? `${element.mass}` : "",
    element.shells.length ? element.shells.join(" · ") : "",
  ].filter(Boolean);
}

export function elementCardHeight(element: PeriodicElement): number {
  const lines = cardLines(element);
  return Math.round(CARD_PADDING * 2 + CARD_TEXT_SIZE + (lines.length - 1) * CARD_LINE_HEIGHT);
}

export function bohrDiagramSize(element: PeriodicElement, placement: PeriodicPlacement): number {
  const shells = element.shells.length;
  if (!shells) return 0;
  const available = Math.min(placement.boardWidth, placement.boardHeight) / 2 - 60;
  const step = Math.max(28, Math.min(64, available / shells));
  return Math.round(step * shells * 2);
}

export function buildElementCardStrokes(
  element: PeriodicElement,
  { color }: PeriodicPlacement,
  [x, y]: Point
): StrokeInput[] {
  const lines = cardLines(element);
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const boxWidth = Math.round(Math.max(200, longest * CARD_TEXT_SIZE * 0.6 + CARD_PADDING * 2));

  return [
    { type: "rect", x, y, w: boxWidth, h: elementCardHeight(element), color, width: 3 },
    {
      type: "text",
      text: lines.join("\n"),
      x: x + CARD_PADDING,
      y: y + CARD_PADDING + CARD_TEXT_SIZE,
      size: CARD_TEXT_SIZE,
      color,
    },
  ];
}

export function buildBohrStrokes(
  element: PeriodicElement,
  placement: PeriodicPlacement,
  [x, y]: Point
): StrokeInput[] {
  const shells = element.shells;
  if (!shells.length) return [];

  const diameter = bohrDiagramSize(element, placement);
  const step = diameter / (2 * shells.length);
  const centerX = Math.round(x + diameter / 2);
  const centerY = Math.round(y + diameter / 2);
  const totalElectrons = shells.reduce((sum, count) => sum + count, 0);
  const withDots = totalElectrons <= MAX_ELECTRON_DOTS;

  const strokes: StrokeInput[] = [
    {
      type: "text",
      text: element.symbol,
      x: centerX - element.symbol.length * 9,
      y: centerY + 10,
      size: 30,
      color: placement.color,
    },
  ];

  shells.forEach((electrons, shellIndex) => {
    const radius = step * (shellIndex + 1);
    strokes.push({
      type: "ellipse",
      x: Math.round(centerX - radius),
      y: Math.round(centerY - radius),
      w: Math.round(radius * 2),
      h: Math.round(radius * 2),
      color: placement.color,
      width: 2,
    });

    if (!withDots) {
      strokes.push({
        type: "text",
        text: `${electrons}${placement.electronLabel}`,
        x: Math.round(centerX + radius - 26),
        y: centerY - 8,
        size: 18,
        color: placement.color,
      });
      return;
    }

    for (let index = 0; index < electrons; index += 1) {
      const angle = (index / electrons) * Math.PI * 2 - Math.PI / 2;
      strokes.push({
        type: "ellipse",
        x: Math.round(centerX + Math.cos(angle) * radius - 4),
        y: Math.round(centerY + Math.sin(angle) * radius - 4),
        w: 8,
        h: 8,
        color: placement.color,
        width: 5,
      });
    }
  });

  return strokes;
}
