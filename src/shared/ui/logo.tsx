import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Path, Polygon, Rect, Stop } from "react-native-svg";
import mark from "./logo-mark.json";

type StrokeShape = { role: string; type: "stroke"; w: number; points: number[][] };
type PolygonShape = { role: string; type: "polygon"; points: number[][] };
type Shape = StrokeShape | PolygonShape;

const SHAPES = mark.shapes as Shape[];
const BODY = SHAPES.filter((shape) => shape.role === "body");
const CUT = SHAPES.filter((shape) => shape.role === "cut");

/** Oq "Y" ustidagi oq strelkani ajratib turuvchi hoshiya (belgi fazosida). */
const GAP = 0.026;
/** Plitka burchagi — `scripts/build-icons.mjs` dagi `tileRadius` bilan bir xil. */
const TILE_RADIUS = 0.22;
/** Plitka ichida belgi shuncha ulushni egallaydi (u yerdagi `scale` bilan bir xil). */
const TILE_SCALE = 0.6;

function shapeBounds(shape: Shape) {
  const pad = shape.type === "stroke" ? shape.w / 2 : 0;
  const xs = shape.points.map(([x]) => x as number);
  const ys = shape.points.map(([, y]) => y as number);
  return [
    Math.min(...xs) - pad,
    Math.min(...ys) - pad,
    Math.max(...xs) + pad,
    Math.max(...ys) + pad,
  ] as const;
}

/**
 * Belgining chegara qutisi. Shakllar kvadratning aniq markazida turmasligi
 * mumkin — bu yerda hisoblanib, render vaqtida avtomatik markazlashtiriladi.
 * Ya'ni `logo-mark.json` ni tahrirlaganda bu yerda hech narsa sozlanmaydi.
 */
const BOUNDS = SHAPES.reduce(
  (box, shape) => {
    const [x0, y0, x1, y1] = shapeBounds(shape);
    return {
      minX: Math.min(box.minX, x0),
      minY: Math.min(box.minY, y0),
      maxX: Math.max(box.maxX, x1),
      maxY: Math.max(box.maxY, y1),
    };
  },
  { minX: 1, minY: 1, maxX: 0, maxY: 0 }
);

const SPAN = Math.max(BOUNDS.maxX - BOUNDS.minX, BOUNDS.maxY - BOUNDS.minY);

/**
 * Belgi fazosidan (0..1 logotip kvadrati) chizma fazosiga (0..1 SVG
 * `viewBox`) o'tkazish. AYNAN shu hisob `scripts/build-icons.mjs` da ham
 * bor — shuning uchun ekrandagi logo bilan launcher ikonkasi piksel-ma-piksel
 * bir xil joylashadi.
 */
function placement(scale: number) {
  const k = scale / SPAN;
  return {
    k,
    x: 0.5 - (BOUNDS.minX + (BOUNDS.maxX - BOUNDS.minX) / 2) * k,
    y: 0.5 - (BOUNDS.minY + (BOUNDS.maxY - BOUNDS.minY) / 2) * k,
  };
}

type Place = ReturnType<typeof placement>;

function toPath(points: number[][], place: Place) {
  return points
    .map(([px, py], index) => {
      const x = place.x + (px as number) * place.k;
      const y = place.y + (py as number) * place.k;
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}

function toPoints(points: number[][], place: Place) {
  return points
    .map(([px, py]) => `${place.x + (px as number) * place.k},${place.y + (py as number) * place.k}`)
    .join(" ");
}

/** Bir guruh shaklni chizadi. `widen` — hoshiya uchun qo'shimcha kenglik. */
function draw(shapes: Shape[], place: Place, color: string, widen = 0) {
  return shapes.map((shape, index) =>
    shape.type === "stroke" ? (
      <Path
        key={index}
        d={toPath(shape.points, place)}
        stroke={color}
        strokeWidth={(shape.w + widen * 2) * place.k}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ) : (
      <Polygon
        key={index}
        points={toPoints(shape.points, place)}
        fill={color}
        stroke={widen > 0 ? color : "none"}
        strokeWidth={widen * 2 * place.k}
        strokeLinejoin="round"
      />
    )
  );
}

function gradientStops() {
  return mark.gradient.stops.map((stop) => (
    <Stop key={stop.at} offset={stop.at} stopColor={stop.color} />
  ));
}

export interface LogoProps {
  /** Tomon uzunligi. `tile` da — plitka o'lchami. */
  size?: number;
  /**
   * `mark` — faqat belgi: gradient "Y" va uning ustidan o'tuvchi oq strelka
   * (logotipning asosiy ko'rinishi).
   * `tile` — launcher ikonkasi kabi: gradient plitka ustida oq belgi.
   */
  variant?: "mark" | "tile";
  /**
   * Bir rangli siluet (masalan bosma yoki bir rangli fonda). Bunda strelka
   * chizilmaydi — uni ko'rsatish uchun ikkinchi rang kerak bo'lardi.
   */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * YolUp logotipi.
 *
 * Geometriya `logo-mark.json` dan olinadi — AYNAN o'sha fayldan launcher
 * ikonkalari ham rasterlanadi (`scripts/build-icons.mjs`). Shuning uchun
 * ekrandagi logo bilan telefon ish stolidagi ikonka bir xil bo'ladi:
 * birini o'zgartirsangiz, ikkinchisi `npm run build:icons` dan keyin
 * o'z-o'zidan yangilanadi.
 */
export function Logo({ size = 40, variant = "mark", color, style }: LogoProps) {
  const tile = variant === "tile";
  const place = placement(tile ? TILE_SCALE : 1);
  const gradientId = tile ? "yolup-tile" : "yolup-mark";
  const gradientRef = `url(#${gradientId})`;

  // Gradient o'qi: plitkada u butun kvadrat bo'ylab cho'ziladi, belgi
  // rejimida esa belgining o'zi bo'ylab — rasterlovchi ham shunday qiladi.
  const [fromX, fromY] = mark.gradient.from;
  const [toX, toY] = mark.gradient.to;
  const axis = tile
    ? { x1: fromX, y1: fromY, x2: toX, y2: toY }
    : {
        x1: place.x + fromX * place.k,
        y1: place.y + fromY * place.k,
        x2: place.x + toX * place.k,
        y2: place.y + toY * place.k,
      };

  const bodyFill = color ?? (tile ? mark.onBrand : gradientRef);

  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 1 1">
        <Defs>
          <LinearGradient id={gradientId} gradientUnits="userSpaceOnUse" {...axis}>
            {gradientStops()}
          </LinearGradient>
        </Defs>

        {tile ? (
          <Rect x={0} y={0} width={1} height={1} rx={TILE_RADIUS} ry={TILE_RADIUS} fill={gradientRef} />
        ) : null}

        {draw(BODY, place, bodyFill)}

        {/* Bir rangli siluetda strelka chizilmaydi — ikkinchi rang yo'q. */}
        {color ? null : (
          <>
            {/* Plitkada "Y" ham, strelka ham oq: ular ingichka gradient
                hoshiya bilan ajraladi. Belgi rejimida "Y" gradient bo'lgani
                uchun hoshiya kerak emas. */}
            {tile ? draw(CUT, place, gradientRef, GAP) : null}
            {draw(CUT, place, mark.onBrand)}
          </>
        )}
      </Svg>
    </View>
  );
}
