import { HomePlaceholderPage } from "@/pages/home-placeholder-page";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { ROLES } from "@/shared/constants";

export default function StudentDashboardRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.STUDENT]}>
        <HomePlaceholderPage area="O'quvchi bo'limi" />
      </RoleRoute>
    </ProtectedRoute>
  );
}
