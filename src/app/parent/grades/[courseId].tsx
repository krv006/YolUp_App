import { useLocalSearchParams } from "expo-router";
import { ParentCoursePage } from "@/pages/parent/report/parent-course-page";

export default function ParentCourseRoute() {
  const { courseId = "" } = useLocalSearchParams<{ courseId: string }>();
  return <ParentCoursePage key={courseId} courseId={courseId} />;
}
