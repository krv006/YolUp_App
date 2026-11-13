import { Redirect } from "expo-router";
import { StudentAiPage } from "@/pages/student/workspace/student-ai-page";
import { FEATURES, ROUTES } from "@/shared/config";

// "AI yordamchi" vaqtincha yashirin — manzil Workspace'ga qaytaradi (veb `app-router.tsx`).
export default function StudentAiRoute() {
  return FEATURES.aiAssistant ? <StudentAiPage /> : <Redirect href={ROUTES.student.workspace as never} />;
}
