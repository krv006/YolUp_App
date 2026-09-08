import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { radius } from "./tokens";
import { useTheme } from "./theme";

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  /** Qiymat shu qadam bo'yicha yaxlitlanadi. */
  step: number;
  onChange: (value: number) => void;
  /** Ekran o'quvchi uchun: "Shrift o'lchami" kabi. */
  label: string;
  /** Ekran o'quvchi qiymatni qanday o'qishi: 1.15 -> "115%". */
  formatValue?: (value: number) => string;
}

const THUMB = 26;
const TRACK = 6;

/**
 * Sudraladigan qiymat tanlagich.
 *
 * NEGA O'ZIMIZNIKI: `@react-native-community/slider` — nativ modul, ya'ni
 * yana bir bog'liqlik va yana bir qayta qurish. Bu yerda kerak bo'lgani
 * shunchaki gorizontal sudrash, u esa loyihada ALLAQACHON bor
 * `gesture-handler` + `reanimated` bilan bajariladi.
 *
 * QADAM BO'YICHA YAXLITLASH muhim: shrift o'lchami o'zgarganda BUTUN ilova
 * qayta render bo'ladi. Barmoq harakatining har kadrida qiymat berilsa,
 * sudrash sekinlashib qolardi. Shuning uchun barmoq uzluksiz harakatlanadi
 * (tugmacha shared value bilan chiziladi), qiymat esa faqat yangi qadamga
 * o'tilganda beriladi.
 */
export function Slider({ value, min, max, step, onChange, label, formatValue }: SliderProps) {
  const { palette } = useTheme();
  const [width, setWidth] = useState(0);

  const usable = Math.max(0, width - THUMB);
  const ratio = max > min ? (value - min) / (max - min) : 0;

  const offset = useSharedValue(0);
  const dragging = useSharedValue(false);

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  /** Piksel o'rnini qadamga yaxlitlangan qiymatga aylantiradi. */
  function commit(x: number) {
    if (usable <= 0) return;
    const raw = min + (x / usable) * (max - min);
    const stepped = Math.round(raw / step) * step;
    const clamped = Math.min(max, Math.max(min, stepped));
    // Suzuvchi nuqta xatosini yo'qotamiz: 1.0500000000000003 kabi qiymatlar
    // saqlashda ham, taqqoslashda ham muammo tug'diradi.
    const rounded = Number(clamped.toFixed(4));
    if (rounded !== value) onChange(rounded);
  }

  const pan = Gesture.Pan()
    .onBegin((event) => {
      dragging.set(true);
      offset.set(event.x - THUMB / 2);
      runOnJS(commit)(event.x - THUMB / 2);
    })
    .onUpdate((event) => {
      const x = Math.min(usable, Math.max(0, event.x - THUMB / 2));
      offset.set(x);
      runOnJS(commit)(x);
    })
    .onFinalize(() => {
      dragging.set(false);
    });

  // Sudrash paytida tugmacha barmoq ortidan, aks holda qiymatga bog'lanadi.
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragging.get() ? Math.min(usable, Math.max(0, offset.get())) : ratio * usable },
      { scale: dragging.get() ? 1.15 : 1 },
    ],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width:
      THUMB / 2 +
      (dragging.get() ? Math.min(usable, Math.max(0, offset.get())) : ratio * usable),
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={onLayout}
        style={styles.root}
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: formatValue ? formatValue(value) : String(value) }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) => {
          const next =
            event.nativeEvent.actionName === "increment" ? value + step : value - step;
          const clamped = Math.min(max, Math.max(min, next));
          onChange(Number(clamped.toFixed(4)));
        }}
      >
        <View style={[styles.track, { backgroundColor: palette.muted }]} />
        <Animated.View style={[styles.fill, { backgroundColor: palette.primary }, fillStyle]} />
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: palette.primary, borderColor: palette.surface },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // Balandlik tugmacha bo'yicha — teginish maydoni kichkina bo'lib qolmasin.
  root: { height: THUMB + 12, justifyContent: "center" },
  track: {
    height: TRACK,
    borderRadius: radius.full,
    marginHorizontal: THUMB / 2,
  },
  fill: {
    position: "absolute",
    left: 0,
    height: TRACK,
    borderRadius: radius.full,
  },
  thumb: {
    position: "absolute",
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: radius.full,
    borderWidth: 3,
  },
});
