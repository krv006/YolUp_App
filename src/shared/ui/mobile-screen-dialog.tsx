import type { ReactNode } from "react";
import { Modal, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DsGradient, DsText, useDs } from "./ds";
import { MobileActionBar, MobileRoundButton } from "./mobile-page";

export interface MobileScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  closeLabel: string;
  closeIcon?: "close" | "chevron-left";
  /** Berilsa "yopish" va Android "orqaga" shuni chaqiradi (masalan saqlanmagan o'zgarish so'rovi). */
  onClose?: () => void;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
}

/**
 * To'liq ekranli oyna — veb `shared/ui/mobile-screen-dialog.tsx`: auth
 * gradienti, `px-4 pt-5 pb-6`, yopish tugmasi va sarlavha, pastda
 * `MobileActionBar`. Klaviatura ochilganda pastki panel ustiga ko'tariladi.
 */
export function MobileScreenDialog({
  open,
  onOpenChange,
  title,
  closeLabel,
  closeIcon = "close",
  onClose,
  action,
  footer,
  children,
  bodyStyle,
}: MobileScreenDialogProps) {
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const close = () => (onClose ? onClose() : onOpenChange(false));

  return (
    <Modal visible={open} animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
      <KeyboardAvoidingView behavior="padding" style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
        <ScrollView
          style={styles.fill}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.body, { paddingTop: insets.top + 20, paddingBottom: footer ? 24 : insets.bottom + 24 }, bodyStyle]}
        >
          <DsGradient name="auth" />
          <View style={styles.header}>
            <MobileRoundButton icon={closeIcon} label={closeLabel} onPress={close} />
            <DsText v="title-lg" w="600" numberOfLines={1} style={styles.title}>
              {title}
            </DsText>
            {action ?? <View style={styles.spacer} />}
          </View>
          {children}
        </ScrollView>
        {footer ? <MobileActionBar>{footer}</MobileActionBar> : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { flexGrow: 1, paddingHorizontal: 16 },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  title: { flex: 1, minWidth: 0, textAlign: "center" },
  spacer: { width: 44, height: 44 },
});
