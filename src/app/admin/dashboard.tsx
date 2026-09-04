import { HomePlaceholderPage } from "@/pages/home-placeholder-page";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { ROLES } from "@/shared/constants";

export default function AdminDashboardRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
        <HomePlaceholderPage area="Administrator bo'limi" />
      </RoleRoute>
    </ProtectedRoute>
  );
}
