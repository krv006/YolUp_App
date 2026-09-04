import { NotificationsPage } from "@/pages/notifications/notifications-page";
import { ProtectedRoute } from "@/providers/route-guards";

export default function NotificationsRoute() {
  return (
    <ProtectedRoute>
      <NotificationsPage />
    </ProtectedRoute>
  );
}
