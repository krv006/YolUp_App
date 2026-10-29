import { AdminSupportPage } from "@/pages/admin/admin-support-page";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { ROLES } from "@/shared/constants";

export default function AdminSupportRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
        <AdminSupportPage />
      </RoleRoute>
    </ProtectedRoute>
  );
}
