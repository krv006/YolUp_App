import { useLocalSearchParams } from "expo-router";
import { ParentChildPermissionsPage } from "@/pages/parent/children/parent-child-permissions-page";

export default function ParentChildPermissionsRoute() {
  const { childId = "" } = useLocalSearchParams<{ childId: string }>();
  return <ParentChildPermissionsPage key={childId} childId={childId} />;
}
