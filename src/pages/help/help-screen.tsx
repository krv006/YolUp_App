import { forwardRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DsGradient, MobilePageHeader, useDs } from "@/shared/ui";
import { useHelpPaths } from "./use-help";

export interface MobileHelpScreenProps {
  title: ReactNode;
  onBack?: () => void;
  action?: ReactNode;
  /** Pastki qator — `px-4 pt-3 pb-[safe+16]` (tugma yoki yozish maydoni). */
  footer?: ReactNode;
  /** Pastki qator foni (murojaat suhbatida `bg-surface`). */
  footerSurface?: boolean;
  children: ReactNode;
}

/**
 * Yordam markazining mobil sahifasi — veb `help-screen.tsx` (`MobileHelpScreen`):
 * auth gradienti, `px-4 pt-5 pb-6`, sarlavha, bo'limlar `mt-5 gap-5`,
 * ixtiyoriy pastki qator. Klaviatura ochilganda pastki qator u bilan ko'tariladi.
 */
export const MobileHelpScreen = forwardRef<ScrollView, MobileHelpScreenProps>(function MobileHelpScreen(
  { title, onBack, action, footer, footerSurface = false, children },
  ref
) {
  const { t } = useTranslation("account");
  const ds = useDs();
  const router = useRouter();
  const paths = useHelpPaths();
  const insets = useSafeAreaInsets();

  function goBack() {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace(paths.home as never);
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <DsGradient name="auth" />
      <ScrollView
        ref={ref}
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: footer ? 24 : insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <MobilePageHeader title={title} backLabel={t("page.back")} onBack={goBack} action={action} />
        <View style={styles.body}>{children}</View>
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }, footerSurface && { backgroundColor: ds.c.surface, paddingTop: 0, paddingHorizontal: 0 }]}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: { paddingHorizontal: 16 },
  body: { marginTop: 20, gap: 20 },
  /* Qator — `MobileButton` (`flex-1`) shu yo'nalishga mo'ljallangan. */
  footer: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 12 },
});
