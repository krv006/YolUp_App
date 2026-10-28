import { useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DsText, dsRadius, useDs } from "./ds";

export interface PopoverRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Tugmaga bog'langan menyu uchun: `anchorRef` tugmaning o'ramiga beriladi,
 * `open()` o'rnini o'lchab menyuni ochadi. Chaqiruvchida darhol
 * destrukturlang — ref bilan bir obyektda o'qish React Compiler'ni chalg'itadi.
 */
export function usePopoverAnchor() {
  const anchorRef = useRef<View>(null);
  const [rect, setRect] = useState<PopoverRect | null>(null);
  const open = () => anchorRef.current?.measureInWindow((left, top, width, height) => setRect({ top, left, width, height }));
  const close = () => setRect(null);
  return { anchorRef, rect, open, close };
}

export interface PopoverMenuProps {
  rect: PopoverRect | null;
  onClose: () => void;
  /** Menyu kengligi (vebdagi `w-80` -> 320). */
  width?: number;
  /** Tugmaning qaysi chetiga tekislanadi (veb `align`). */
  align?: "start" | "end";
  /** Tugmadan masofa (veb `sideOffset`). */
  offset?: number;
  /** Menyuning taxminiy balandligi — ostida joy yetmasa tugma ustida ochiladi. */
  height: number;
  children: ReactNode;
}

/**
 * Ochiladigan menyu — veb `DropdownMenu` ning o'rni: shaffof fon ustida
 * tugma ostida (joy bo'lmasa ustida) `rounded-xl bg-surface shadow-lg`
 * karta. Tashqariga bosilsa yopiladi.
 *
 * Balandlik o'lchab olinmaydi (`onLayout` + holat): kirish animatsiyasi
 * paytidagi qayta chizish Modal ichida cheksiz siklga tushib, ilovani
 * qotirib qo'ygan edi — shuning uchun taxminiy `height` beriladi.
 */
export function PopoverMenu({ rect, onClose, width = 220, align = "end", offset = 8, height, children }: PopoverMenuProps) {
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const maxWidth = Math.min(width, screenWidth - 32);
  const left = rect
    ? Math.max(16, Math.min(align === "end" ? rect.left + rect.width - maxWidth : rect.left, screenWidth - 16 - maxWidth))
    : 0;
  const below = rect ? rect.top + rect.height + offset : 0;
  const fits = below + height <= screenHeight - insets.bottom - 12;
  const top = rect ? (fits ? below : Math.max(insets.top + 12, rect.top - offset - height)) : 0;

  return (
    <Modal visible={Boolean(rect)} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      {rect ? (
        <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(90)} style={styles.fill}>
          <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={onClose} />
          <View
            accessibilityRole="menu"
            style={[styles.menu, { top, left, width: maxWidth, backgroundColor: ds.c.surface, boxShadow: ds.shadow.lg }]}
          >
            {children}
          </View>
        </Animated.View>
      ) : null}
    </Modal>
  );
}

/** Oddiy menyu qatori — veb `DropdownItem` (`destructive` qizil). */
export function PopoverMenuItem({ label, danger = false, onPress }: { label: ReactNode; danger?: boolean; onPress: () => void }) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && { backgroundColor: danger ? ds.c["danger-bg"] : ds.c.subtle }]}
    >
      <DsText c={danger ? "error-text" : "ink"} numberOfLines={1}>
        {label}
      </DsText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  menu: { position: "absolute", overflow: "hidden", padding: 6, borderRadius: dsRadius.xl },
  item: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: dsRadius.md },
});
