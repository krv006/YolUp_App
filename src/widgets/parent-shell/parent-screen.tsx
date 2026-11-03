import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DsGradient, PullRefresh, useDs } from "@/shared/ui";

/** Suzuvchi panel: ekran pastidan `max(24px, safe-area)`, balandligi `h-17`. */
const TAB_BOTTOM = 24;
const TAB_HEIGHT = 68;

/**
 * Panel ostida qoladigan joy — veb `pb-32` (128px: panel 24 + 68 va 36
 * bo'shliq). Xavfsiz hudud kattaroq telefonda panel bilan birga ko'tariladi.
 */
export function useParentTabInset(): number {
  const insets = useSafeAreaInsets();
  return Math.max(TAB_BOTTOM, insets.bottom) + TAB_HEIGHT + 36;
}

export interface ParentScreenProps {
  children: ReactNode;
  /** Bo'lim bosh sahifasi — pastda suzuvchi panel turadi (`pb-32`). */
  tabs?: boolean;
  onRefresh?: () => Promise<unknown>;
  /** Kontent bo'shliqlari; standart `flex flex-col gap-4 px-4 pt-5`. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Ota-ona sahifasi qobig'i — veb `parent-mobile-shell.tsx` dagi
 * `main.overflow-y-auto.bg-auth-gradient` (+ tab sahifalarida `pb-32`) va
 * sahifalarning `px-4 pt-5` o'rami.
 */
export function ParentScreen({ children, tabs = false, onRefresh, style }: ParentScreenProps) {
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const tabInset = useParentTabInset();
  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: tabs ? tabInset : insets.bottom + 24 }, style]}
        refreshControl={onRefresh ? <PullRefresh onRefresh={onRefresh} /> : undefined}
      >
        <DsGradient name="auth" />
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: { flexGrow: 1, gap: 16, paddingHorizontal: 16 },
});
