import { SvgXml } from "react-native-svg";
import { ICONS, type IconName } from "./icons-svg";

export type { IconName };

export interface IconProps {
  name: IconName;
  /** Vebda ikonkalar 24×24; boshqa o'lcham kerak bo'lsa shu yerdan beriladi. */
  size?: number;
  color: string;
}

/**
 * Veb ikonkasi — `assets/icons/*.svg` dan.
 *
 * ┌─ NEGA `lucide-react-native` EMAS ─────────────────────────────────────┐
 * │ Ilovada hozirgacha lucide ishlatilgan: u CHIZIQLI (outline) uslubda.  │
 * │ Veb esa o'z to'plamini ishlatadi va u TO'LDIRILGAN (Material uslubi): │
 * │ masalan pastki paneldagi suhbat ikonkasi to'liq bo'yalgan purakcha.   │
 * │ Yonma-yon qo'yilganda farq darhol ko'rinadi, shuning uchun ikonkalar  │
 * │ ham vebdan ko'chirildi.                                               │
 * │                                                                       │
 * │ Lucide OLIB TASHLANMAYDI: vebda mavjud bo'lmagan ikonkalar (doska     │
 * │ asboblari, grafiklar) uchun u qolaveradi.                             │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * `color` MAJBURIY: SVG ichida rang `currentColor` ga almashtirilgan va
 * berilmasa ikonka ko'rinmay qoladi.
 */
export function Icon({ name, size = 24, color }: IconProps) {
  return <SvgXml xml={ICONS[name]} width={size} height={size} color={color} />;
}
