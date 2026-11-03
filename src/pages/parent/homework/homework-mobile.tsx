import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import type { HomeworkFilter } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { useOnlineStatus } from "@/shared/model";
import { MobileEmptyCard, MobileTitleHeader, useDs } from "@/shared/ui";
import { ParentErrorBanner, ParentScreen } from "@/widgets/parent-shell";
import { MobileConnect } from "../dashboard/parent-home-mobile";
import { HomeworkList } from "./homework-list";
import { useHomeworkView } from "./use-homework-view";

/** Vazifalar — veb `homework-mobile.tsx`: ko'rsatkichlar, filtr va ro'yxat; bosilganda tafsilot sahifasi. */
export function HomeworkMobile() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const online = useOnlineStatus();
  const view = useHomeworkView();
  const [filter, setFilter] = useState<HomeworkFilter>("all");

  return (
    <ParentScreen tabs onRefresh={async () => view.retry()}>
      <MobileTitleHeader eyebrow={t("homeworkView.eyebrow")} title={t("homeworkView.title")} />
      {online && view.failed ? <ParentErrorBanner onRetry={view.retry} /> : null}
      {view.loading ? (
        <View style={styles.stack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.tiles}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={[styles.tile, { backgroundColor: ds.c.surface }]} />
            ))}
          </View>
          <View style={[styles.block, { backgroundColor: ds.c.surface }]} />
          <View style={[styles.block, { backgroundColor: ds.c.surface }]} />
        </View>
      ) : !view.child ? (
        <MobileConnect />
      ) : !view.assignments.length ? (
        <MobileEmptyCard icon="assignment" title={t("homeworkView.empty.title")} description={t("homeworkView.empty.text")} />
      ) : (
        <HomeworkList
          assignments={view.assignments}
          now={view.now}
          filter={filter}
          onFilter={setFilter}
          onSelect={(id) => router.push(ROUTES.parent.homeworkItem(id) as never)}
        />
      )}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  tiles: { flexDirection: "row", gap: 12 },
  tile: { flex: 1, height: 60, borderRadius: 24 },
  block: { height: 150, borderRadius: 20 },
});
