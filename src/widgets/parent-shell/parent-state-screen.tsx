import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Celebration, type CelebrationTone } from "@/modules/parent";
import { DsText, dsRadius, useDs, type IconName } from "@/shared/ui";

export interface StateAction {
  label: string;
  onPress: () => void;
}

/**
 * Ota-ona holat ekrani — veb `widgets/parent-shell/parent-state-screen.tsx`
 * ning telefon shoxi: butun ekranni (panel ustidan ham) qoplaydi
 * (`fixed inset-0 z-40 bg-canvas`), markazda kod, halqa rasmi, sarlavha va
 * matn, pastda matnli ikkinchi va to'liq kenglikdagi asosiy tugma.
 */
export function ParentStateScreen({
  icon,
  tone,
  code,
  title,
  text,
  primary,
  secondary,
}: {
  icon: IconName;
  tone: Extract<CelebrationTone, "brand" | "violet" | "danger" | "teal">;
  code?: string;
  title: string;
  text: string;
  primary?: StateAction;
  secondary?: StateAction;
}) {
  const ds = useDs();
  const insets = useSafeAreaInsets();
  return (
    <View style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 40, paddingBottom: Math.max(24, insets.bottom) }]}
      >
        <View style={styles.art}>
          {code ? (
            <DsText v="h1" heading c="brand" style={styles.code}>
              {code}
            </DsText>
          ) : null}
          <Celebration icon={icon} tone={tone} shadow />
          <DsText v="h1" heading style={styles.title}>
            {title}
          </DsText>
          <DsText v="body" c="ink-secondary" style={styles.center}>
            {text}
          </DsText>
        </View>
        {secondary ? (
          <Pressable accessibilityRole="button" onPress={secondary.onPress} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <DsText v="title-sm" c="brand">
              {secondary.label}
            </DsText>
          </Pressable>
        ) : null}
        {primary ? (
          <Pressable
            accessibilityRole="button"
            onPress={primary.onPress}
            style={({ pressed }) => [styles.primary, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
          >
            <DsText v="title-sm" c="on-action">
              {primary.label}
            </DsText>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 40 },
  fill: { flex: 1 },
  center: { textAlign: "center" },
  /* `flex flex-col px-4 pt-10 pb-[max(24px,safe-area)] text-center` */
  page: { flexGrow: 1, paddingHorizontal: 16 },
  /* `flex flex-1 flex-col items-center justify-center gap-4` */
  art: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  /* `font-heading text-[30px]/9 font-semibold` */
  code: { fontSize: 30, lineHeight: 36 },
  /* `font-heading text-[26px]/9 font-semibold` */
  title: { fontSize: 26, lineHeight: 36, textAlign: "center" },
  /* `mx-auto mb-4 h-11 px-4 text-title-sm font-semibold text-brand` */
  secondary: { alignSelf: "center", height: 44, justifyContent: "center", paddingHorizontal: 16, marginBottom: 16 },
  pressed: { opacity: 0.7 },
  /* `STATE_BUTTON.primary h-13 w-full` */
  primary: { height: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, borderRadius: dsRadius.full },
});
