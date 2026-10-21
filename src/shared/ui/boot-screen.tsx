import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "./logo";
import { useTheme } from "./theme";

export interface BootScreenProps {
  /** Birinchi kadr chizilgach — tizim splash'ini shu paytda yopish kerak. */
  onReady?: () => void;
}

const DOTS = [0, 1, 2] as const;
/** Bir nuqtaning ko'tarilib tushishi; navbatdagisi shuncha kechikadi. */
const STEP_MS = 160;

/**
 * Ilova ochilish ekrani — tizim splash'i bilan bir xil fon va logo,
 * pastda navbat bilan sakraydigan uchta nuqta. Token tiklanib, profil va
 * shriftlar yuklanguncha turadi.
 *
 * Tizim splash'i (Android 12+ `SplashScreen` API) faqat statik rasm
 * ko'rsata oladi, shuning uchun u birinchi kadrdayoq shu ekranga
 * almashtiriladi (`onReady`).
 */
export function BootScreen({ onReady }: BootScreenProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="YolUp"
      onLayout={onReady}
      style={[styles.root, { backgroundColor: palette.background }]}
    >
      <Logo size={96} />
      <View style={[styles.dots, { bottom: insets.bottom + 72 }]}>
        {DOTS.map((index) => (
          <Dot key={index} index={index} color={palette.primary} />
        ))}
      </View>
    </View>
  );
}

function Dot({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(
        index * STEP_MS,
        withRepeat(
          withSequence(
            withTiming(1, { duration: STEP_MS * 2 }),
            withTiming(0, { duration: STEP_MS * 2 }),
            // Uchala nuqta o'z navbatini o'tkazguncha kutadi — to'lqin bir xil qadamda.
            withTiming(0, { duration: STEP_MS * 2 })
          ),
          -1
        )
      )
    );
    return () => cancelAnimation(progress);
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.45 + progress.get() * 0.55,
    transform: [{ translateY: -6 * progress.get() }],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  dots: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
