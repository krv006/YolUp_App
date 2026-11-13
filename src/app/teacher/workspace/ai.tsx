import { Redirect } from "expo-router";
import { AiAssistantPage } from "@/pages/workspace/ai-assistant-page";
import { FEATURES, ROUTES } from "@/shared/config";

// "AI yordamchi" vaqtincha yashirin — manzil Workspace'ga qaytaradi (veb `app-router.tsx`).
export default function TeacherAiRoute() {
  return FEATURES.aiAssistant ? <AiAssistantPage /> : <Redirect href={ROUTES.teacher.workspace as never} />;
}
