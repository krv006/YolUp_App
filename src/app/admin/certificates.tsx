import { AdminCertificatesPage } from "@/pages/admin/admin-certificates-page";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { ROLES } from "@/shared/constants";

export default function AdminCertificatesRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
        <AdminCertificatesPage />
      </RoleRoute>
    </ProtectedRoute>
  );
}
