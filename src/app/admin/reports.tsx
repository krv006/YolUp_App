import { AdminReportsPage } from "@/pages/admin/reports/admin-reports-page";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { ROLES } from "@/shared/constants";

export default function AdminReportsRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
        <AdminReportsPage />
      </RoleRoute>
    </ProtectedRoute>
  );
}
