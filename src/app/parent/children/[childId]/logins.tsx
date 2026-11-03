import { useLocalSearchParams } from "expo-router";
import { ChildLoginsMobile } from "@/pages/parent/children/child-logins-mobile";

export default function ParentChildLoginsRoute() {
  const { childId = "" } = useLocalSearchParams<{ childId: string }>();
  return <ChildLoginsMobile key={childId} childId={childId} />;
}
