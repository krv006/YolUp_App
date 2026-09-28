import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  Canvas,
  Circle,
  Group,
  matchFont,
  Text as SkiaText,
  useClock,
} from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";
import { useTheme } from "@/shared/ui";
import { BOARD_FONT_FAMILY } from "./board-font";

/**
 * Bor atom modeli — veb `bohr-model.tsx` ning mobil varianti.
 *
 * 🔴 QAYTA YOZILDI: veb uni THREE.JS bilan, WebGL sahnada uch o'lchamda
 * chizadi. React Native'da buning uchun `expo-gl` + `expo-three` kerak
 * bo'lardi — og'ir nativ zanjir, faqat shu bitta oynacha uchun.
 *
 * Buning o'rniga model Skia bilan IKKI o'lchamda chiziladi. Skia
 * loyihada allaqachon bor (doskaning o'zi shu bilan chiziladi), ya'ni
 * yangi bog'liqlik qo'shilmaydi.
 *
 * Ikki o'lchov yo'qotish emas: bu ko'rinishning vazifasi — qaysi
 * qatlamda nechta elektron borligini ko'rsatish. Telefon ekranida
 * qiyshaytirilgan uch o'lchamli halqalarda elektronlarni sanash
 * QIYINROQ, tekis aylanalarda esa oson. Doskaga chiziladigan diagramma
 * (`buildBohrStrokes`) ham aynan shunday — tekis.
 *
 * Elektronlar aylanadi: har qatlam o'z tezligida, ichkarisi tezroq —
 * veb bilan bir xil qoida (`speed: 0.5 / (shellIndex + 1.4)`).
 */

/** Qatlam ranglari — veb `SHELL_COLORS` bilan bir xil. */
const SHELL_COLORS = [
  "#7c4dff",
  "#2f9bff",
  "#1fc79a",
  "#f5a524",
  "#ff5d8f",
  "#9d7bff",
  "#4ad6ff",
];
const NUCLEUS_COLOR = "#ff6b4a";

const SIZE = 260;
const NUCLEUS_RADIUS = 26;
/** Eng ichki halqa radiusi va qatlamlar orasidagi masofa. */
const FIRST_SHELL = 44;
const ELECTRON_RADIUS = 5;

export interface BohrModelProps {
  shells: readonly number[];
  symbol: string;
}

export function BohrModel({ shells, symbol }: BohrModelProps) {
  const { palette } = useTheme();
  const clock = useClock();

  const center = SIZE / 2;
  /* Halqalar kanvasga sig'ishi kerak — qadam qatlamlar soniga qarab. */
  const step = useMemo(() => {
    const available = center - FIRST_SHELL - ELECTRON_RADIUS - 4;
    return shells.length > 1 ? available / (shells.length - 1) : 0;
  }, [center, shells.length]);

  const symbolFont = useMemo(
    () => matchFont({ fontFamily: BOARD_FONT_FAMILY, fontSize: 20, fontWeight: "700" }),
    []
  );

  const symbolWidth = useMemo(
    () => symbolFont.getTextWidth(symbol),
    [symbolFont, symbol]
  );

  if (!shells.length) return null;

  return (
    <View style={[styles.wrap, { borderColor: palette.border }]}>
      <Canvas style={styles.canvas}>
        {shells.map((_, shellIndex) => (
          <Circle
            key={`ring-${shellIndex}`}
            cx={center}
            cy={center}
            r={FIRST_SHELL + shellIndex * step}
            color={SHELL_COLORS[shellIndex % SHELL_COLORS.length]}
            style="stroke"
            strokeWidth={1}
            opacity={0.4}
          />
        ))}

        {shells.map((electrons, shellIndex) => (
          <Shell
            key={`shell-${shellIndex}`}
            clock={clock}
            center={center}
            radius={FIRST_SHELL + shellIndex * step}
            electrons={electrons}
            color={SHELL_COLORS[shellIndex % SHELL_COLORS.length]}
            speed={0.5 / (shellIndex + 1.4)}
          />
        ))}

        <Circle cx={center} cy={center} r={NUCLEUS_RADIUS} color={NUCLEUS_COLOR} />
        <SkiaText
          x={center - symbolWidth / 2}
          y={center + 7}
          text={symbol}
          font={symbolFont}
          color="#ffffff"
        />
      </Canvas>
    </View>
  );
}

/**
 * Bitta qatlam: elektronlar teng oraliqda joylashadi va guruh butunicha
 * aylanadi.
 *
 * Aylanish `useDerivedValue` da hisoblanadi — ya'ni UI oqimida, React
 * qayta render qilmasdan. `setState` bilan qilinsa, soniyasiga o'nlab
 * render bo'lardi.
 */
function Shell({
  clock,
  center,
  radius,
  electrons,
  color,
  speed,
}: {
  clock: { value: number };
  center: number;
  radius: number;
  electrons: number;
  color: string;
  speed: number;
}) {
  const positions = useMemo(
    () =>
      Array.from({ length: electrons }, (_, index) => {
        const angle = (index / electrons) * Math.PI * 2;
        return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
      }),
    [center, electrons, radius]
  );

  const transform = useDerivedValue(
    () => [{ rotate: (clock.value / 1000) * speed }],
    [clock, speed]
  );

  return (
    <Group transform={transform} origin={{ x: center, y: center }}>
      {positions.map((position, index) => (
        <Circle
          key={index}
          cx={position.x}
          cy={position.y}
          r={ELECTRON_RADIUS}
          color={color}
        />
      ))}
    </Group>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  canvas: { width: SIZE, height: SIZE },
});
