import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { storage } from "@/shared/lib";
import { DsText, dsRadius, useDs } from "@/shared/ui";

const STEPS = ["home", "workspace"] as const;

/**
 * Birinchi kirishdagi tanishuv — veb `mobile-onboarding.tsx`: xira fon,
 * pastdagi tab panel atrofida punktir ramka va ustida ikki qadamli karta
 * ("Keyingi" / "O'tkazib yuborish"). Ko'rilgani foydalanuvchi bo'yicha
 * eslab qolinadi.
 *
 * Qatlamlar vebdagidek: xira fon panel OSTIDA (panel yorug' qoladi),
 * ramka va karta esa ustida.
 */
export function MobileOnboarding({ userId }: { userId: string }) {
  const { t } = useTranslation("dashboard");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const key = `yolup:onboarding:${userId}`;
  const [step, setStep] = useState<number | null>(() => (storage.get(key) ? null : 0));

  if (step === null) return null;

  const id = STEPS[step]!;
  const last = step === STEPS.length - 1;
  const barBottom = Math.max(30, insets.bottom);

  function finish() {
    storage.set(key, "1");
    setStep(null);
  }

  return (
    <View accessibilityViewIsModal style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: ds.c.scrim }]} />
      {/* `inset-x-2.5 bottom-[calc(max(30px,safe)-6px)] h-20 rounded-[34px] border-2 border-dashed` */}
      <View pointerEvents="none" style={[styles.outline, { bottom: barBottom - 6, borderColor: ds.c["on-action"] }]} />
      {/* `inset-x-4 bottom-[calc(max(30px,safe)+86px)] rounded-xl bg-surface p-4 pt-[17px]` */}
      <View style={[styles.card, { bottom: barBottom + 86, backgroundColor: ds.c.surface }]}>
        <DsText v="caption-strong" c="brand">
          {t("mobile.tour.step", { current: step + 1, total: STEPS.length })}
        </DsText>
        <DsText v="title-lg" style={styles.title}>
          {t(`mobile.tour.${id}.title`)}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" style={styles.text}>
          {t(`mobile.tour.${id}.text`)}
        </DsText>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={finish} style={styles.skip}>
            <DsText v="button" c="brand">
              {t("mobile.tour.skip")}
            </DsText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => (last ? finish() : setStep(step + 1))}
            style={({ pressed }) => [styles.next, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
          >
            <DsText v="button" c="on-action">
              {t(last ? "mobile.tour.start" : "mobile.tour.next")}
            </DsText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outline: { position: "absolute", left: 10, right: 10, height: 80, borderWidth: 2, borderStyle: "dashed", borderRadius: 34 },
  card: { position: "absolute", left: 16, right: 16, padding: 16, paddingTop: 17, borderRadius: dsRadius.xl },
  title: { marginTop: 8 },
  text: { marginTop: 8, marginRight: -4 },
  actions: { marginTop: 15, flexDirection: "row", gap: 8 },
  skip: { height: 44, justifyContent: "center", paddingHorizontal: 15 },
  next: { flex: 1, minWidth: 0, height: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderRadius: dsRadius.full },
});
