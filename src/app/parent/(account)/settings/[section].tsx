import { useLocalSearchParams } from "expo-router";
import { ParentSettingsPage } from "@/pages/parent/settings/parent-settings-page";

export default function ParentSettingsSectionRoute() {
  const { section } = useLocalSearchParams<{ section: string }>();
  return <ParentSettingsPage section={section} />;
}
