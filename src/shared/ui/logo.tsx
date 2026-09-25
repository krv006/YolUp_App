import { View, type StyleProp, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { LOGO_SVG } from "./logo-svg";

/** Plitka burchagi — `scripts/build-icons.mjs` bilan bir xil nisbat. */
const TILE_RADIUS = 0.22;
/** Plitka ichida belgi shuncha ulushni egallaydi (u yerdagi `scale` bilan bir xil). */
const TILE_SCALE = 0.76;
/** Plitka foni — launcher ikonkasidagi `BACKGROUND` bilan bir xil. */
const TILE_BACKGROUND = "#ffffff";

export interface LogoProps {
  size?: number;
  /**
   * `mark` — faqat belgi, shaffof fonda.
   * `tile` — launcher ikonkasi kabi: oq plitka ustida belgi. Login
   *   ekranida shu ishlatiladi, shunda ekrandagi logo telefon ish
   *   stolidagi ikonka bilan bir xil ko'rinadi.
   */
  variant?: "mark" | "tile";
  style?: StyleProp<ViewStyle>;
}

/**
 * YolUp logotipi.
 *
 * Belgi `assets/y-logo.svg` dan olinadi — AYNAN o'sha fayldan launcher
 * ikonkalari ham rasterlanadi (`scripts/build-icons.mjs`). Shuning uchun
 * ekrandagi logo bilan telefon ish stolidagi ikonka bir xil bo'ladi:
 * SVG'ni almashtirsangiz, `npm run build:icons` ikkalasini ham
 * yangilaydi.
 *
 * Avval bu komponent `logo-mark.json` dagi soddalashtirilgan
 * geometriyadan (to'g'ri chiziq va ko'pburchak) chizardi — u haqiqiy
 * brend fayli bo'lmagan paytdagi o'rinbosar edi. Endi manba haqiqiy
 * logotip: gradientlar va strelka o'yig'i bilan.
 *
 * `color` (bir rangli siluet) propi OLIB TASHLANDI — u hech qayerda
 * ishlatilmasdi, haqiqiy logotipda esa gradientni bitta rangga
 * aylantirish belgini tanib bo'lmas holga keltiradi. Bir rangli variant
 * kerak bo'lsa, u ham SVG'dan yasaladi (monoxrom ikonka shunday).
 */
export function Logo({ size = 40, variant = "mark", style }: LogoProps) {
  const tile = variant === "tile";
  const markSize = tile ? Math.round(size * TILE_SCALE) : size;

  const mark = <SvgXml xml={LOGO_SVG} width={markSize} height={markSize} />;

  if (!tile) return <View style={style}>{mark}</View>;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * TILE_RADIUS,
          backgroundColor: TILE_BACKGROUND,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {mark}
    </View>
  );
}
