import { AppearancePage } from "@/pages/settings/appearance-page";
import { ProtectedRoute } from "@/providers/route-guards";

export default function AppearanceRoute() {
  return (
    <ProtectedRoute>
      <AppearancePage />
    </ProtectedRoute>
  );
}
