import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { NotificationBell } from "@/modules/notification";
import { AppBar, AppBarAction, Screen } from "@/shared/ui";
import { HomeworkWorkspace } from "@/widgets/homework-workspace";

const WORKSPACE_PATH = "/teacher/workspace";

/**
 * Vazifalar — veb `pages/homework/assignments-page.tsx` porti. Tepa panel
 * vebdagidek: orqaga, "Vazifalar", qidiruv, "+" (vazifa berish), qo'ng'iroq.
 */
export function AssignmentsPage() {
  const { t: tn } = useTranslation("nav");
  const { t: tw } = useTranslation("workspace");
  const { t } = useTranslation("homework");
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace(WORKSPACE_PATH);
        return true;
      });
      return () => subscription.remove();
    }, [router])
  );

  return (
    <Screen padded={false}>
      <AppBar title={tn("titles.assignments")} back={{ label: tw("searchBack"), onPress: () => router.replace(WORKSPACE_PATH) }}>
        <AppBarAction name="search" label={tw("searchAria")} onPress={() => router.push("/teacher/search")} />
        <AppBarAction name="add" variant="primary" label={t("form.title")} onPress={() => setCreateOpen(true)} />
        <NotificationBell />
      </AppBar>
      <HomeworkWorkspace createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </Screen>
  );
}
