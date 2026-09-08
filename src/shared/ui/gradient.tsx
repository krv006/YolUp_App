import { useId } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

export interface GradientFillProps {
  colors: readonly [string, string];
  /** Diagonal (standart) yoki gorizontal yo'nalish. */
  direction?: "diagonal" | "horizontal";
}

/**
 * Ota-elementni to'liq to'ldiruvchi gradient fon.
 *
 * ISHLATILISHI: ota-elementga `overflow: "hidden"` va kerakli
 * `borderRadius` beriladi, bu esa uning ichiga BIRINCHI bola sifatida
 * qo'yiladi — burchaklar otadan meros bo'ladi.
 *
 * NEGA `expo-linear-gradient` EMAS: u nativ modul, ya'ni yana bir
 * bog'liqlik va yana bir qayta qurish. `react-native-svg` loyihada
 * ALLAQACHON bor (doska va ikonkalar uchun).
 *
 * `useId` MUHIM: SVG `id` lari butun ekran bo'ylab umumiy. Bir vaqtda
 * bir nechta har xil gradient chizilsa (masalan sozlamalar ekranidagi
 * namunalar qatori) va id lar bir xil bo'lsa, hammasi BIRINCHISINING
 * rangida chiqib qolardi.
 */
export function GradientFill({ colors, direction = "diagonal" }: GradientFillProps) {
  const id = `grad-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const end = direction === "diagonal" ? { x2: "1", y2: "1" } : { x2: "1", y2: "0" };

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" {...end}>
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
