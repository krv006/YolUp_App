import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { runOnJS, useAnimatedReaction, type SharedValue } from "react-native-reanimated";
import { Grid3x3, Minus, Plus } from "lucide-react-native";
import { DsText, dsRadius, useDs } from "@/shared/ui";
import { BOARD_ZOOM } from "../lib/board-zoom";

export interface BoardZoomControlsProps {
  /** Joriy zoom (UI thread) — foiz barmoq bilan kattalashtirilayotganda ham yangilanadi. */
  zoom: SharedValue<number>;
  /** Eng kichik zoom (`height` rejimida 50% dan kichik bo'lishi mumkin). */
  minZoom?: SharedValue<number>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  /** Veb #198: yordamchi katak yoqilganmi. */
  guides?: boolean;
  onToggleGuides?: () => void;
}

/**
 * "# | − 100% +" — veb `board-zoom-controls.tsx` (`absolute top-3 right-3`,
 * `rounded-xl bg-surface p-1 shadow-lg`). Foiz faqat shu komponentda
 * qayta chiziladi: kanvas pinch paytida React'ga chiqmaydi.
 */
export function BoardZoomControls({ zoom, minZoom, onZoomIn, onZoomOut, onReset, guides = false, onToggleGuides }: BoardZoomControlsProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  const [percent, setPercent] = useState(100);
  const [minPercent, setMinPercent] = useState(Math.round(BOARD_ZOOM.min * 100));

  useAnimatedReaction(
    () => Math.round((minZoom ? minZoom.get() : BOARD_ZOOM.min) * 100),
    (value, previous) => {
      if (value !== previous) runOnJS(setMinPercent)(value);
    }
  );

  useAnimatedReaction(
    () => Math.round(zoom.get() * 100),
    (value, previous) => {
      if (value !== previous) runOnJS(setPercent)(value);
    }
  );

  const canOut = percent > minPercent;
  const canIn = percent < Math.round(BOARD_ZOOM.max * 100);

  return (
    <View style={[styles.root, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.lg }]}>
      {onToggleGuides ? (
        <>
          {/* `size-8 rounded-md`; yoqilganda `bg-brand-subtle text-brand` */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={guides ? t("guides.hide") : t("guides.show")}
            accessibilityState={{ selected: guides }}
            onPress={onToggleGuides}
            style={({ pressed }) => [
              styles.button,
              guides ? { backgroundColor: ds.c["brand-subtle"] } : pressed && { backgroundColor: ds.c.subtle },
            ]}
          >
            <Grid3x3 size={16} color={guides ? ds.c.brand : ds.c["ink-secondary"]} />
          </Pressable>
          {/* `mx-0.5 h-5 w-px bg-line` */}
          <View style={[styles.divider, { backgroundColor: ds.c.line }]} />
        </>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("zoom.out")}
        disabled={!canOut}
        onPress={onZoomOut}
        style={({ pressed }) => [
          styles.button,
          pressed && { backgroundColor: ds.c.subtle },
          !canOut && styles.faded,
        ]}
      >
        <Minus size={16} color={ds.c["ink-secondary"]} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("zoom.reset", { value: percent })}
        onPress={onReset}
        style={({ pressed }) => [styles.value, pressed && { backgroundColor: ds.c.subtle }]}
      >
        <DsText v="caption-strong" style={styles.center}>
          {percent}%
        </DsText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("zoom.in")}
        disabled={!canIn}
        onPress={onZoomIn}
        style={({ pressed }) => [
          styles.button,
          pressed && { backgroundColor: ds.c.subtle },
          !canIn && styles.faded,
        ]}
      >
        <Plus size={16} color={ds.c["ink-secondary"]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    padding: 4,
    borderRadius: dsRadius.xl,
  },
  button: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dsRadius.md,
  },
  value: {
    height: 32,
    minWidth: 52,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dsRadius.md,
  },
  center: { textAlign: "center" },
  faded: { opacity: 0.4 },
  divider: { width: 1, height: 20, marginHorizontal: 2 },
});
