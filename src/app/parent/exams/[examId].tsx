import { useLocalSearchParams } from "expo-router";
import { ParentExamResultPage } from "@/pages/parent/exams/parent-exam-result-page";

export default function ParentExamResultRoute() {
  const { examId = "" } = useLocalSearchParams<{ examId: string }>();
  return <ParentExamResultPage key={examId} examId={examId} />;
}
