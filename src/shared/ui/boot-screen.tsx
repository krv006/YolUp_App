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
  Easing,
} from "react-native-reanimated";
import { Logo } from "./logo";
import { DsGradient, useDs } from "./ds";

export interface BootScreenProps {
  /** Birinchi kadr chizilgach — tizim splash'ini shu paytda yopish kerak. */
  onReady?: () => void;
}

const DOTS = [0, 1, 2] as const;
/** Veb `splash-dot` — 1 s davr, nuqtalar orasida 150 ms kechikish. */
const PERIOD_MS = 1000;
const DELAY_MS = 150;

/**
 * Ilova ochilish ekrani (M1.3) — veb `shared/ui/splash-screen.tsx`: auth
 * gradienti, markazda logotip, pastda (balandlikning 9.8%) navbat bilan
 * sakraydigan uchta nuqta. Token tiklanib, profil va shriftlar yuklanguncha
 * turadi.
 *
 * Tizim splash'i (Android 12+ `SplashScreen` API) faqat statik rasm
 * ko'rsata oladi, shuning uchun u birinchi kadrdayoq shu ekranga
 * almashtiriladi (`onReady`).
 */
export function BootScreen({ onReady }: BootScreenProps) {
  const ds = useDs();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="YolUp"
      onLayout={onReady}
      style={[styles.root, { backgroundColor: ds.c.canvas }]}
    >
      <DsGradient name="auth" />
      <Logo size={136} />
      <View style={styles.dots}>
        {DOTS.map((index) => (
          <Dot key={index} index={index} color={ds.c["brand-strong"]} />
        ))}
      </View>
    </View>
  );
}

/** `@keyframes splash-dot` — 0%, 60%, 100%: joyida; 30%: 4px yuqorida. */
function Dot({ index, color }: { index: number; color: string }) {
  const lift = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.inOut(Easing.ease);
    lift.set(
      withDelay(
        index * DELAY_MS,
        withRepeat(
          withSequence(
            withTiming(-4, { duration: PERIOD_MS * 0.3, easing: ease }),
            withTiming(0, { duration: PERIOD_MS * 0.3, easing: ease }),
            withTiming(0, { duration: PERIOD_MS * 0.4 })
          ),
          -1
        )
      )
    );
    return () => cancelAnimation(lift);
  }, [index, lift]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.get() }] }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  /* `absolute bottom-[9.8%] gap-[5px]` */
  dots: { position: "absolute", bottom: "9.8%", flexDirection: "row", alignItems: "center", gap: 5 },
  /* `size-2 rounded-full bg-brand-strong` */
  dot: { width: 8, height: 8, borderRadius: 4 },
});
