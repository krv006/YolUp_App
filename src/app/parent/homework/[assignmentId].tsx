import { useLocalSearchParams } from "expo-router";
import { ParentHomeworkItemPage } from "@/pages/parent/homework/parent-homework-item-page";

export default function ParentHomeworkItemRoute() {
  const { assignmentId = "" } = useLocalSearchParams<{ assignmentId: string }>();
  return <ParentHomeworkItemPage key={assignmentId} assignmentId={assignmentId} />;
}
