import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { dsRadius, MobileEmptyCard, useDs } from "@/shared/ui";

/** Jadval yuklanayotganda — veb `MobileScheduleSkeleton`: 4 ta `h-[72px]` karta. */
export function MobileScheduleSkeleton() {
  const ds = useDs();
  return (
    <View style={styles.list}>
      {Array.from({ length: 4 }, (_, index) => (
        <View key={index} style={[styles.card, { backgroundColor: ds.c.surface }]}>
          <View style={[styles.bar, { width: 143, height: 14, backgroundColor: ds.c.skeleton }]} />
          <View style={[styles.bar, { width: 250, maxWidth: "100%", backgroundColor: ds.c.skeleton }]} />
          <View style={[styles.bar, { width: 195, backgroundColor: ds.c.skeleton }]} />
        </View>
      ))}
    </View>
  );
}

/** Yuklanmadi — veb `ScheduleError` (`MobileEmptyCard` + "Qayta urinish"). */
export function ScheduleError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("lesson");
  return (
    <MobileEmptyCard
      icon="warning-fill"
      title={t("scheduleState.errorTitle")}
      description={t("scheduleState.errorHint")}
      action={{ label: t("scheduleState.retry"), icon: "refresh", onPress: onRetry }}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: { height: 72, overflow: "hidden", gap: 12, paddingHorizontal: 16, paddingTop: 16, borderRadius: dsRadius.xl },
  bar: { height: 12, borderRadius: 6 },
});
