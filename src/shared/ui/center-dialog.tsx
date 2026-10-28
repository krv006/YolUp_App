import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { DsText, dsRadius, useDs } from "./ds";
import { Icon, type IconName } from "./icon";

interface CenterDialogShellProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Karta kengligi chegarasi — `max-w-82.5` (330) yoki to'liq `w-[calc(100%-48px)]`. */
  maxWidth?: number;
  /** Chetlardan masofa (`w-[calc(100%-32px)]` -> 16). */
  inset?: number;
}

/**
 * Markazdagi oyna qobig'i — veb `DialogPrimitive` (`bg-scrim`, markazda
 * `rounded-2xl bg-surface shadow-2xl`, ochilishda `fade-in zoom-in-95`).
 * Vebda karta markazdan 22px yuqorida (`top-[calc(50%-22px)]`).
 */
function CenterDialogShell({ open, onClose, children, maxWidth, inset = 16 }: CenterDialogShellProps) {
  const ds = useDs();
  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      {open ? (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)} style={[styles.scrim, { backgroundColor: ds.c.scrim }]}>
          <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View
            entering={ZoomIn.duration(160).withInitialValues({ transform: [{ scale: 0.95 }] })}
            style={[styles.card, { marginHorizontal: inset, maxWidth, backgroundColor: ds.c.surface, boxShadow: ds.shadow["2xl"] }]}
          >
            <ScrollView bounces={false} contentContainerStyle={styles.cardScroll}>
              {children}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      ) : null}
    </Modal>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: IconName;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel: ReactNode;
  pending?: boolean;
  tone?: "danger" | "brand";
  confirmIcon?: IconName;
  onConfirm: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

/**
 * Tasdiqlash oynasi — veb `shared/ui/confirm-dialog.tsx` ning tor ekran
 * varianti: markazda doira belgi, sarlavha, izoh, to'liq kenglikdagi
 * asosiy tugma va ostida "Bekor qilish" havolasi.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pending = false,
  tone = "danger",
  confirmIcon,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const ds = useDs();
  const danger = tone === "danger";

  function cancel() {
    onOpenChange(false);
    onCancel?.();
  }

  // Fon yoki "orqaga" — faqat yopish (vebdagi `onOpenChange(false)`); `onCancel`
  // faqat pastdagi tugmada (masalan "Faqat chiqish" darsdan chiqaradi).
  return (
    <CenterDialogShell open={open} onClose={() => onOpenChange(false)} maxWidth={330}>
      <View style={styles.confirm}>
        <View style={[styles.confirmIcon, { backgroundColor: danger ? ds.c["danger-bg"] : ds.c["brand-subtle"] }]}>
          <Icon name={icon} size={24} color={danger ? ds.c["error-text"] : ds.c.brand} />
        </View>
        <DsText v="title-lg" w="600" style={styles.confirmTitle}>
          {title}
        </DsText>
        {description ? (
          <DsText v="body-sm" c="ink-secondary" style={styles.confirmDescription}>
            {description}
          </DsText>
        ) : null}
        {children ? <View style={styles.confirmChildren}>{children}</View> : null}
        <Pressable
          accessibilityRole="button"
          disabled={pending}
          onPress={onConfirm}
          style={({ pressed }) => [
            styles.confirmButton,
            { backgroundColor: danger ? ds.c["danger-bg"] : ds.c.brand, opacity: pending ? 0.5 : pressed ? 0.85 : 1 },
          ]}
        >
          {confirmIcon ? <Icon name={confirmIcon} size={20} color={danger ? ds.c.danger : ds.c["on-action"]} /> : null}
          <DsText v="title" w="600" c={danger ? "danger" : "on-action"}>
            {confirmLabel}
          </DsText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={cancel} style={({ pressed }) => [styles.confirmCancel, pressed && styles.pressed]}>
          <DsText v="title" w="600" c="brand-strong">
            {cancelLabel}
          </DsText>
        </Pressable>
      </View>
    </CenterDialogShell>
  );
}

export interface MobileAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: IconName;
  tone?: "brand" | "danger";
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
  cancelLabel: ReactNode;
  confirmLabel: ReactNode;
  confirmTone?: "primary" | "danger";
  pending?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Ogohlantirish oynasi — veb `shared/ui/mobile-alert-dialog.tsx`: chapga
 * tekislangan, `size-13 rounded-lg` belgi, `font-heading text-h2` sarlavha,
 * pastda yonma-yon ikki tugma.
 */
export function MobileAlertDialog({
  open,
  onOpenChange,
  icon,
  tone = "brand",
  title,
  description,
  children,
  cancelLabel,
  confirmLabel,
  confirmTone = "primary",
  pending = false,
  onConfirm,
  onCancel,
}: MobileAlertDialogProps) {
  const ds = useDs();
  const cancel = () => (onCancel ? onCancel() : onOpenChange(false));
  return (
    <CenterDialogShell open={open} onClose={cancel} inset={24}>
      <View style={styles.alert}>
        <View style={[styles.alertIcon, { backgroundColor: tone === "danger" ? ds.c["danger-bg"] : ds.c["brand-subtle"] }]}>
          <Icon name={icon} size={26} color={tone === "danger" ? ds.c["error-text"] : ds.c.brand} />
        </View>
        <DsText v="h2" heading style={styles.alertTitle}>
          {title}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" style={styles.alertDescription}>
          {description}
        </DsText>
        {children}
        <View style={styles.alertButtons}>
          <Pressable
            accessibilityRole="button"
            onPress={cancel}
            style={({ pressed }) => [
              styles.alertButton,
              { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
            ]}
          >
            <DsText v="button">{cancelLabel}</DsText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={pending}
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.alertButton,
              confirmTone === "danger"
                ? { backgroundColor: ds.c["danger-bg"], opacity: pressed ? 0.85 : 1 }
                : { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
              pending && { opacity: 0.5 },
            ]}
          >
            <DsText v="button" c={confirmTone === "danger" ? "danger" : "on-action"}>
              {confirmLabel}
            </DsText>
          </Pressable>
        </View>
      </View>
    </CenterDialogShell>
  );
}

const styles = StyleSheet.create({
  /* `fixed inset-0 bg-scrim`, karta `top-[calc(50%-22px)]` */
  scrim: { flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 44 },
  card: { width: "100%", maxHeight: "86%", borderRadius: dsRadius["2xl"], overflow: "hidden", alignSelf: "center" },
  cardScroll: { flexGrow: 1 },
  pressed: { opacity: 0.8 },
  /* `items-center px-6 pt-6 pb-6.5 text-center` */
  confirm: { alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 26 },
  confirmIcon: { width: 56, height: 56, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  confirmTitle: { marginTop: 16, paddingHorizontal: 4, textAlign: "center" },
  confirmDescription: { marginTop: 6, paddingHorizontal: 4, textAlign: "center" },
  confirmChildren: { marginTop: 16, alignSelf: "stretch" },
  /* `mt-3.5 h-13 w-full rounded-full` */
  confirmButton: { marginTop: 14, alignSelf: "stretch", height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: dsRadius.full },
  confirmCancel: { marginTop: 12, alignSelf: "stretch", height: 48, alignItems: "center", justifyContent: "center" },
  /* `px-5 pt-6 pb-6` */
  alert: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  alertIcon: { width: 52, height: 52, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  alertTitle: { marginTop: 13 },
  alertDescription: { marginTop: 13 },
  /* `mt-4 grid grid-cols-2 gap-2`; tugma `h-11 rounded-full text-button` */
  alertButtons: { marginTop: 16, flexDirection: "row", gap: 8 },
  alertButton: { flex: 1, height: 44, alignItems: "center", justifyContent: "center", borderRadius: dsRadius.full },
});
