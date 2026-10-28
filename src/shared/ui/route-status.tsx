import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { DsGradient, DsText, useDs, type DsColor } from "./ds";
import { headingFont } from "./fonts";
import { MobileActionBar } from "./mobile-page";

export type RouteStatusTone = "error" | "info" | "warning";

export interface RouteStatusProps {
  tone?: RouteStatusTone;
  /** Katta raqam (404 kabi) — doiraning ichida chiqadi. */
  eyebrow?: string;
  /** Belgi rangi berilgan holda chiziladi (`color` — doira tusi). */
  icon: (color: string) => ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * 404, 403 va kutilmagan xatolik sahifasi — veb `route-status.tsx` ning tor
 * ekran shoxi: gradient fon, `size-30` doira (raqam yoki belgi), sarlavha
 * va izoh; tugmalar pastki panelda.
 */
export function RouteStatus({ tone = "info", eyebrow, icon, title, description, action }: RouteStatusProps) {
  const ds = useDs();
  const circle: Record<RouteStatusTone, { bg: string; fg: DsColor }> = {
    error: { bg: ds.c["danger-bg"], fg: "error-text" },
    info: { bg: ds.c["brand-subtle"], fg: "brand" },
    warning: { bg: ds.c["accent-saffron-bg"], fg: "saffron-strong" },
  };
  const { bg, fg } = circle[tone];
  return (
    <View style={[styles.root, { backgroundColor: ds.c.canvas }]}>
      <DsGradient name="auth" />
      <ScrollView style={styles.root} contentContainerStyle={styles.body}>
        <View style={[styles.circle, { backgroundColor: bg }]}>
          {eyebrow ? (
            <DsText c={fg} style={styles.eyebrow}>
              {eyebrow}
            </DsText>
          ) : (
            icon(ds.c[fg])
          )}
        </View>
        <DsText style={styles.title}>{title}</DsText>
        <DsText v="body-sm" c="ink-secondary" style={styles.description}>
          {description}
        </DsText>
      </ScrollView>
      {action ? <MobileActionBar>{action}</MobileActionBar> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  /* `items-center px-10 pt-[190px] pb-6 text-center` */
  body: { alignItems: "center", paddingHorizontal: 40, paddingTop: 190, paddingBottom: 24 },
  circle: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  /* `font-heading text-[36px] leading-none font-bold` */
  eyebrow: { fontFamily: headingFont("700"), fontSize: 36, lineHeight: 40 },
  /* `mt-[14px] font-heading text-[22px] leading-[30px] font-bold tracking-tight` */
  title: { marginTop: 14, fontFamily: headingFont("700"), fontSize: 22, lineHeight: 30, letterSpacing: -0.55, textAlign: "center" },
  description: { marginTop: 14, textAlign: "center" },
});
