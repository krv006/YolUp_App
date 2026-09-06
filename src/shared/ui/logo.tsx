import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";
import mark from "./logo-mark.json";
import { radius } from "./tokens";

type RectShape = { type: "rect"; x: number; y: number; w: number; h: number; r: number };
type CircleShape = { type: "circle"; cx: number; cy: number; r: number };
type Shape = RectShape | CircleShape;

const SHAPES = mark.shapes as Shape[];

/**
 * Belgining chegara qutisi. SVG `viewBox` shu qutiga qo'yiladi, shuning
 * uchun belgi O'ZI markazlashadi va `logo-mark.json` tahrirlanganda bu
 * yerda hech narsani sozlash kerak bo'lmaydi.
 */
const BOUNDS = SHAPES.reduce(
  (box, shape) => {
    const [x0, y0, x1, y1] =
      shape.type === "rect"
        ? [shape.x, shape.y, shape.x + shape.w, shape.y + shape.h]
        : [shape.cx - shape.r, shape.cy - shape.r, shape.cx + shape.r, shape.cy + shape.r];
    return {
      minX: Math.min(box.minX, x0),
      minY: Math.min(box.minY, y0),
      maxX: Math.max(box.maxX, x1),
      maxY: Math.max(box.maxY, y1),
    };
  },
  { minX: 1, minY: 1, maxX: 0, maxY: 0 }
);

const VIEW_BOX = `${BOUNDS.minX} ${BOUNDS.minY} ${BOUNDS.maxX - BOUNDS.minX} ${
  BOUNDS.maxY - BOUNDS.minY
}`;

export interface LogoProps {
  /** Tomon uzunligi. `tile` da — plitka o'lchami. */
  size?: number;
  /**
   * `mark` — faqat belgi (brend rangida yoki berilgan rangda).
   * `tile` — launcher ikonkasi kabi: brend plitka ustida oq belgi.
   */
  variant?: "mark" | "tile";
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fokus logotipi.
 *
 * Geometriya `logo-mark.json` dan olinadi — AYNAN o'sha fayldan launcher
 * ikonkalari ham rasterlanadi (`scripts/build-icons.mjs`). Shuning uchun
 * ekrandagi logo bilan telefon ish stolidagi ikonka bir xil bo'ladi:
 * birini o'zgartirsangiz, ikkinchisi `npm run build:icons` dan keyin
 * o'z-o'zidan yangilanadi.
 */
export function Logo({ size = 40, variant = "mark", color, style }: LogoProps) {
  const fill = color ?? (variant === "tile" ? mark.onBrand : mark.brand);
  // Plitkada belgi chetga tegib ketmasligi uchun ichkarida biroz kichrayadi.
  const inner = variant === "tile" ? size * 0.6 : size;

  const svg = (
    <Svg width={inner} height={inner} viewBox={VIEW_BOX}>
      {SHAPES.map((shape, index) =>
        shape.type === "rect" ? (
          <Rect
            key={index}
            x={shape.x}
            y={shape.y}
            width={shape.w}
            height={shape.h}
            rx={shape.r}
            ry={shape.r}
            fill={fill}
          />
        ) : (
          <Circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} fill={fill} />
        )
      )}
    </Svg>
  );

  if (variant === "mark") return <View style={style}>{svg}</View>;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.lg,
          backgroundColor: mark.brand,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {svg}
    </View>
  );
}
