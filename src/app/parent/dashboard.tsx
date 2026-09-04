import { HomePlaceholderPage } from "@/pages/home-placeholder-page";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { ROLES } from "@/shared/constants";

export default function ParentDashboardRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.PARENT]}>
        <HomePlaceholderPage area="Ota-ona bo'limi" />
      </RoleRoute>
    </ProtectedRoute>
  );
}
