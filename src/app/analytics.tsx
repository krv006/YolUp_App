import { AnalyticsPage } from "@/pages/analytics/analytics-page";
import { ProtectedRoute } from "@/providers/route-guards";

export default function AnalyticsRoute() {
  return (
    <ProtectedRoute>
      <AnalyticsPage />
    </ProtectedRoute>
  );
}
