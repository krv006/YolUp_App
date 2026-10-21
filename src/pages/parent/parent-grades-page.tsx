import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Trophy } from "lucide-react-native";
import { HomeworkReportView, useHomeworkReport } from "@/modules/homework";
import { useSelectedChild } from "@/modules/parent";
import { ParentAppBar } from "@/modules/parent/ui/parent-app-bar";
import { useBackTo } from "@/shared/lib";
import {
  PortalEmpty,
  PortalHeading,
  portalPage,
  PullRefresh,
  Screen,
  ScreenError,
  ScreenLoading,
  useTheme,
} from "@/shared/ui";

const WORKSPACE_PATH = "/parent/workspace";

/**
 * Farzandning reytingi — veb `parent-report-page.tsx`: "REYTING",
 * farzand ismi va uy vazifasi hisoboti.
 */
export function ParentGradesPage() {
  const { t } = useTranslation("parent");
  const { t: tn } = useTranslation("nav");
  const { t: ts } = useTranslation("mobile");
  const { palette } = useTheme();
  const router = useRouter();
  useBackTo(WORKSPACE_PATH);
  const { selectedChild, selectedChildId } = useSelectedChild();
  const report = useHomeworkReport(selectedChildId, Boolean(selectedChildId));

  const appBar = (
    <ParentAppBar
      a11yTitle={tn("parent.grades")}
      back={{ label: ts("shared.orqaga"), onPress: () => router.replace(WORKSPACE_PATH) }}
    />
  );

  if (!selectedChild) {
    return (
      <Screen padded={false}>
        {appBar}
        <View style={portalPage}>
          <PortalEmpty icon={Trophy} title={t("report.noChildTitle")} description={t("report.noChildDescription")} />
        </View>
      </Screen>
    );
  }

  if (report.isLoading) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenLoading label={t("report.loading")} />
      </Screen>
    );
  }

  if (report.isError || !report.data) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenError message={report.error?.message ?? t("report.loadError")} onRetry={() => void report.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      {appBar}
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={portalPage}
        refreshControl={
          <PullRefresh onRefresh={() => report.refetch()} />
        }
      >
        <PortalHeading eyebrow={t("report.eyebrow")} title={selectedChild.name} description={t("report.subtitle")} />
        <HomeworkReportView report={report.data} />
      </ScrollView>
    </Screen>
  );
}
