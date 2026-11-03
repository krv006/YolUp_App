import { useLocalSearchParams } from "expo-router";
import { ChildProfileMobile } from "@/pages/parent/children/child-profile-mobile";

export default function ParentChildProfileRoute() {
  const { childId = "" } = useLocalSearchParams<{ childId: string }>();
  return <ChildProfileMobile key={childId} childId={childId} />;
}
