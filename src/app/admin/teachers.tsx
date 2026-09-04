import { AdminTeachersPage } from "@/pages/admin/admin-teachers-page";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { ROLES } from "@/shared/constants";

export default function AdminTeachersRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
        <AdminTeachersPage />
      </RoleRoute>
    </ProtectedRoute>
  );
}
