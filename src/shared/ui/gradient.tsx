import { useId, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
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
 * ┌─ NEGA O'LCHAM O'LCHANADI ────────────────────────────────────────────┐
 * │ Dastlab `<Rect width="100%" height="100%" />` yozilgan edi. Foizlar  │
 * │ SVG darchasiga nisbatan hisoblanadi va u ota-element KATTALASHGANDA  │
 * │ qayta hisoblanmaydi — natijada xabar matni kattalashganda gradient   │
 * │ eski enida qolib, purakchaning bir qismi bo'yalmay qolardi.          │
 * │ Endi o'lcham `onLayout` bilan o'lchanib, aniq piksel sifatida        │
 * │ beriladi va har o'zgarishda yangilanadi.                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * `useId` ham MUHIM: SVG `id` lari butun ekran bo'ylab umumiy. Bir vaqtda
 * bir nechta har xil gradient chizilsa (masalan sozlamalardagi namunalar
 * qatori) va id lar bir xil bo'lsa, hammasi BIRINCHISINING rangida
 * chiqib qolardi.
 */
export function GradientFill({ colors, direction = "diagonal" }: GradientFillProps) {
  const id = `grad-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [size, setSize] = useState({ width: 0, height: 0 });

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    // Faqat haqiqiy o'zgarishda holatni yangilaymiz — aks holda har
    // layoutda qayta render bo'lib turardi.
    setSize((current) =>
      current.width === width && current.height === height ? current : { width, height }
    );
  }

  const end = direction === "diagonal" ? { x2: "1", y2: "1" } : { x2: "1", y2: "0" };

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {size.width > 0 && size.height > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" {...end}>
              <Stop offset="0" stopColor={colors[0]} />
              <Stop offset="1" stopColor={colors[1]} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.width} height={size.height} fill={`url(#${id})`} />
        </Svg>
      ) : null}
    </View>
  );
}
