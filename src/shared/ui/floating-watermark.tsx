import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { DsText } from "./ds";
import { Logo } from "./logo";

interface Spot {
  x: number;
  y: number;
  visible: boolean;
}

const FIRST_DELAY_MS = 1500;

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Video ustida suzuvchi watermark — veb `floating-watermark.tsx`: "@login ·
 * YolUp" yozuvi kichik logo bilan, och rangda va qiya. Tasodifiy joyda 4–7
 * soniya ko'rinadi, 2–4.5 soniya yo'qoladi (1 s silliq o'tish bilan).
 *
 * 🟡 MOSLASH: vebda `translate(-x%, -y%)` yozuvning o'z o'lchamidan
 * hisoblanadi; RN'da o'lcham `onLayout` bilan olinadi.
 */
export function FloatingWatermark({ label }: { label: string }) {
  const [spot, setSpot] = useState<Spot>({ x: 10, y: 15, visible: false });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const opacity = useSharedValue(0);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = (visible: boolean) => {
      setSpot((current) =>
        visible ? { x: between(4, 96), y: between(6, 80), visible: true } : { ...current, visible: false }
      );
      timer = setTimeout(() => show(!visible), visible ? between(4000, 7000) : between(2000, 4500));
    };
    timer = setTimeout(() => show(true), FIRST_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    opacity.set(withTiming(spot.visible ? 1 : 0, { duration: 1000 }));
  }, [opacity, spot.visible]);

  return (
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <Animated.View
        onLayout={(event) => setSize(event.nativeEvent.layout)}
        style={[
          styles.mark,
          fade,
          {
            left: `${spot.x}%`,
            top: `${spot.y}%`,
            transform: [
              { translateX: (-spot.x / 100) * size.width },
              { translateY: (-spot.y / 100) * size.height },
              { rotate: "-12deg" },
            ],
          },
        ]}
      >
        <View style={styles.logo}>
          <Logo size={14} />
        </View>
        {/* `text-caption-strong text-ink-inverse/40` + soya */}
        <DsText v="caption" w="600" numberOfLines={1} style={styles.text}>
          {label}
        </DsText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* `absolute flex items-center gap-1.5 whitespace-nowrap` */
  mark: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 6 },
  logo: { opacity: 0.5 },
  text: {
    color: "rgba(255,255,255,0.4)",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
