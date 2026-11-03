import { forwardRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, View, type StyleProp, type TextInput, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DsText, dsRadius, Icon, MobileInput, useDs, type DsColor, type IconName, type MobileInputProps } from "@/shared/ui";

/**
 * Farzand oynalarining umumiy bo'laklari — veb `modules/parent/ui/child-dialog-parts.tsx`
 * va `child-dialog-styles.ts`.
 */

const TILE_TONES: Record<"brand" | "green", { bg: DsColor; fg: DsColor }> = {
  brand: { bg: "brand-subtle", fg: "brand" },
  green: { bg: "accent-green-bg", fg: "accent-green-fg" },
};

/** `size-12 rounded-2xl` belgi. */
export function IconTile({ icon, tone = "brand" }: { icon: IconName; tone?: keyof typeof TILE_TONES }) {
  const ds = useDs();
  const colors = TILE_TONES[tone];
  return (
    <View style={[styles.tile, { backgroundColor: ds.c[colors.bg] }]}>
      <Icon name={icon} size={24} color={ds.c[colors.fg]} />
    </View>
  );
}

/* Halqa atrofidagi rangli nuqtalar — `absolute rounded-full` (top/left/right/bottom, o'lcham, rang). */
const DOTS: Array<{ style: ViewStyle; size: number; color: DsColor }> = [
  { style: { top: 4, left: 24 }, size: 6, color: "brand" },
  { style: { top: 28, left: -4 }, size: 10, color: "saffron" },
  { style: { top: 20, right: 0 }, size: 8, color: "accent-violet-fg" },
  { style: { bottom: 48, right: -14 }, size: 12, color: "brand" },
  { style: { bottom: 36, left: -8 }, size: 8, color: "danger" },
  { style: { bottom: 4, right: 24 }, size: 6, color: "success" },
];

export type CelebrationTone = "teal" | "green" | "brand" | "violet" | "danger";

const CELEBRATION_TONES: Record<CelebrationTone, { ring: DsColor; core: DsColor }> = {
  teal: { ring: "accent-teal-bg", core: "accent-teal-fg" },
  green: { ring: "accent-green-bg", core: "success" },
  brand: { ring: "brand-subtle", core: "brand" },
  violet: { ring: "accent-violet-bg", core: "accent-violet-fg" },
  danger: { ring: "danger-bg", core: "danger" },
};

/**
 * `size-[150px]` halqa, ichida `size-[88px]` rangli doira va belgi, atrofida
 * nuqtalar. Ota-ona holat ekranlari (`parent-state-screen.tsx`) ham shu
 * rasmni ishlatadi — u yerda doira ostida soya (`shadow-lg`).
 */
export function Celebration({ icon, tone, shadow = false }: { icon: IconName; tone: CelebrationTone; shadow?: boolean }) {
  const ds = useDs();
  const colors = CELEBRATION_TONES[tone];
  return (
    <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.ring, { backgroundColor: ds.c[colors.ring] }]}>
        <View style={[styles.core, { backgroundColor: ds.c[colors.core] }, shadow && { boxShadow: ds.shadow.lg }]}>
          <Icon name={icon} size={40} color={ds.c["on-action"]} />
        </View>
      </View>
      {DOTS.map((dot, index) => (
        <View
          key={index}
          style={[styles.dot, dot.style, { width: dot.size, height: dot.size, borderRadius: dot.size / 2, backgroundColor: ds.c[dot.color] }]}
        />
      ))}
    </View>
  );
}

export interface ChildButtonProps {
  label: ReactNode;
  onPress: () => void;
  /** `link` — telefondagi matnli tugma (`h-11 text-title-sm font-semibold text-brand`). */
  variant?: "primary" | "secondary" | "link";
  /** `h-13 flex-1 text-title-sm` (pastki qatordagi yonma-yon tugmalar). */
  wide?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

/** `CHILD_BUTTON` — `h-11 rounded-full px-5 text-button`; asosiysi `disabled:opacity-40`. */
export function ChildButton({ label, onPress, variant = "primary", wide = false, disabled = false, icon, style }: ChildButtonProps) {
  const ds = useDs();
  const primary = variant === "primary";
  const link = variant === "link";
  const color: DsColor = primary ? "on-action" : link ? "brand" : "ink";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        wide && styles.buttonWide,
        primary
          ? { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }
          : link
            ? { opacity: pressed ? 0.7 : 1 }
            : { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={20} color={ds.c[color]} /> : null}
      <DsText v={wide || link ? "title-sm" : "button"} c={color} numberOfLines={1}>
        {label}
      </DsText>
    </Pressable>
  );
}

/** `CHILD_INPUT` — `h-13 rounded-2xl bg-subtle`, xatoda `bg-error-bg` va o'ngda ogohlantirish belgisi. */
export const ChildInput = forwardRef<TextInput, MobileInputProps>(function ChildInput({ invalid, style, ...props }, ref) {
  const ds = useDs();
  return (
    <View>
      <MobileInput
        ref={ref}
        invalid={invalid}
        style={[styles.input, invalid ? { backgroundColor: ds.c["error-bg"], borderColor: ds.c["line-danger"], paddingRight: 48 } : null, style]}
        {...props}
      />
      {invalid ? (
        <View pointerEvents="none" style={styles.inputIcon}>
          <Icon name="warning-fill" size={20} color={ds.c["error-text"]} />
        </View>
      ) : null}
    </View>
  );
});

/** Maydon yorlig'i — `text-body-sm font-medium`, ixtiyoriy kulrang qo'shimcha. */
export function ChildLabel({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return (
    <DsText v="body-sm" w="500">
      {children}
      {extra ? (
        <DsText v="body-sm" c="ink-tertiary">
          {" "}
          {extra}
        </DsText>
      ) : null}
    </DsText>
  );
}

/** Izoh qutisi — `flex gap-3 rounded-2xl px-4 py-3 text-body-sm` (`info` / `warning`). */
export function ChildNote({ tone, icon, children }: { tone: "info" | "warning"; icon: IconName; children: ReactNode }) {
  const ds = useDs();
  const fg: DsColor = tone === "info" ? "info-text" : "warning-text";
  return (
    <View style={[styles.note, { backgroundColor: ds.c[tone === "info" ? "info-bg" : "warning-bg"] }]}>
      <Icon name={icon} size={20} color={ds.c[fg]} />
      <DsText v="body-sm" c={fg} style={styles.grow}>
        {children}
      </DsText>
    </View>
  );
}

/**
 * Natija ekrani — veb `AppDialog variant="fullscreen"` (telefon): oq fon,
 * o'ngda yopish tugmasi, markazda tabrik va pastda tugmalar.
 */
export function ChildSuccessScreen({ open, onClose, children, footer }: { open: boolean; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  const { t } = useTranslation("common");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={[styles.fill, { backgroundColor: ds.c.surface, paddingTop: insets.top }]}>
        <View style={styles.successHead}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("actions.close")}
            onPress={onClose}
            style={({ pressed }) => [styles.close, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }]}
          >
            <Icon name="close" size={18} color={ds.c.ink} />
          </Pressable>
        </View>
        <ScrollView style={styles.fill} contentContainerStyle={[styles.successBody, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.spacer} />
          {children}
          <View style={styles.spacer} />
          <View style={styles.successFooter}>{footer}</View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  spacer: { flexGrow: 1 },
  tile: { width: 48, height: 48, borderRadius: dsRadius["2xl"], alignItems: "center", justifyContent: "center" },
  art: { width: 150, height: 150, alignSelf: "center" },
  ring: { width: 150, height: 150, borderRadius: 75, alignItems: "center", justifyContent: "center" },
  core: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute" },
  button: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20, borderRadius: dsRadius.full },
  buttonWide: { height: 52, flex: 1 },
  disabled: { opacity: 0.4 },
  input: { borderRadius: dsRadius["2xl"] },
  inputIcon: { position: "absolute", right: 16, top: 0, bottom: 0, justifyContent: "center" },
  note: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  /* `flex gap-3 px-4 pt-4` — sarlavha yashirin, faqat yopish tugmasi */
  successHead: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 16, paddingTop: 16 },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  /* `flex-1 flex-col items-center gap-4 px-3 text-center` (+ AppDialog `px-5`) */
  successBody: { flexGrow: 1, alignItems: "center", gap: 16, paddingHorizontal: 32, paddingTop: 18 },
  successFooter: { alignSelf: "stretch", gap: 12, marginTop: 8 },
});
