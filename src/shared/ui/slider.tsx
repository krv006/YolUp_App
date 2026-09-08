import { useCallback, useEffect, useState } from "react";
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
  /** Ekran o'quvchi uchun: "Xabar matni o'lchami" kabi. */
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
 * ┌─ NEGA GESTURE `useMemo` ICHIDA ──────────────────────────────────────┐
 * │ Dastlab `Gesture.Pan()` har renderda qaytadan yaratilardi. Sudrash   │
 * │ paytida har qiymat o'zgarishi ota-komponentni qayta render qilar,    │
 * │ bu esa YANGI gesture obyektini tug'dirar va uning holati nolga       │
 * │ tushardi — tugmacha barmoq ostidan qochib, tanlangan joyga           │
 * │ tushmasdi. Endi obyekt bir marta yaratiladi.                         │
 * │                                                                      │
 * │ Shu sabab o'zgaruvchan qiymatlar (`onChange`, `usable`) worklet      │
 * │ ichiga TO'G'RIDAN-TO'G'RI olinmaydi: ular ref va shared value orqali │
 * │ o'qiladi, aks holda gesture eski nusxani ushlab qolardi.             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Pozitsiya `translationX` (nisbiy siljish) bo'yicha hisoblanadi, `x`
 * (mutlaq joylashuv) bo'yicha emas: barmoq tugmachaning chetiga tekkanda
 * ham u sakrab ketmaydi.
 */
export function Slider({ value, min, max, step, onChange, label, formatValue }: SliderProps) {
  const { palette } = useTheme();
  const [width, setWidth] = useState(0);

  const usable = Math.max(0, width - THUMB);
  const ratio = max > min ? (value - min) / (max - min) : 0;

  /** Tugmachaning joriy o'rni (piksel). Sudrash paytida yagona manba. */
  const offset = useSharedValue(0);
  const startOffset = useSharedValue(0);
  const dragging = useSharedValue(false);
  /** Oxirgi marta JS ga yuborilgan qadam raqami — takrorni to'sadi. */
  const lastSent = useSharedValue(-1);

  const [isDragging, setIsDragging] = useState(false);

  /*
   * O'zgaruvchan qiymatlar shared value da saqlanadi.
   *
   * Gesture bir marta yaratilgani uchun u closure orqali eski qiymatlarni
   * ushlab qolardi. Shared value ni esa ham UI, ham JS oqimidan o'qish
   * mumkin, shuning uchun `emit` ham shu manbadan foydalanadi.
   *
   * Ref emas: React Compiler render vaqtida ref ga yozishni taqiqlaydi.
   */
  /** Chegaralar va foydali uzunlik — BITTA obyektda, bitta o'qishda olinadi. */
  const bounds = useSharedValue({ min, max, step, span: 0 });

  useEffect(() => {
    bounds.set({ min, max, step, span: usable });
    // Sudralmayotganda tugmacha QIYMATGA ergashadi (tashqaridan o'zgarsa ham).
    if (!isDragging) offset.set(ratio * usable);
  }, [onChange, min, max, step, ratio, usable, isDragging, offset, bounds]);

  const setDragging = useCallback((next: boolean) => setIsDragging(next), []);

  const pan = Gesture.Pan()
    // Teginish bilan ham boshlansin — tugmachani bosib ushlash kifoya.
    .minDistance(0)
    .onBegin(() => {
      dragging.set(true);
      startOffset.set(offset.get());
      lastSent.set(-1);
      runOnJS(setDragging)(true);
    })
    .onUpdate((event) => {
      const limits = bounds.get();
      const span = limits.span;
      const next = Math.min(span, Math.max(0, startOffset.get() + event.translationX));
      offset.set(next);

      /*
       * JS oqimiga faqat QADAM O'ZGARGANDA xabar beriladi.
       *
       * Ilgari har kadrda `onChange` chaqirilardi — bu sekundiga ~60 marta
       * qayta render degani. Renderlar oqimi gesture yangilanishini kechiktirib,
       * tugmacha barmoq ortidan qolib ketardi va qo'yib yuborilganda boshqa
       * joyga tushardi. Tugmacha esa baribir silliq harakatlanadi, chunki
       * uning o'rni UI oqimidagi `offset` bilan chiziladi.
       */
      if (span > 0) {
        const raw = limits.min + (next / span) * (limits.max - limits.min);
        const stepIndex = Math.round((raw - limits.min) / limits.step);
        if (stepIndex !== lastSent.get()) {
          lastSent.set(stepIndex);
          const stepped = limits.min + stepIndex * limits.step;
          const clamped = Math.min(limits.max, Math.max(limits.min, stepped));
          // Suzuvchi nuqta xatosi: 1.0500000000000003 kabi qiymatlar
          // saqlashda ham, taqqoslashda ham muammo tug'diradi.
          // To'g'ridan-to'g'ri `onChange`: gesture har renderda qayta
          // quriladi, shuning uchun u doim eng yangi funksiya bo'ladi.
          runOnJS(onChange)(Math.round(clamped * 10000) / 10000);
        }
      }
    })
    .onFinalize(() => {
      dragging.set(false);
      runOnJS(setDragging)(false);
    });

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }, { scale: dragging.get() ? 1.15 : 1 }],
  }));

  const fillStyle = useAnimatedStyle(() => ({ width: THUMB / 2 + offset.get() }));

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
          const next = event.nativeEvent.actionName === "increment" ? value + step : value - step;
          onChange(Number(Math.min(max, Math.max(min, next)).toFixed(4)));
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
