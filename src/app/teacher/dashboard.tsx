import { HomePlaceholderPage } from "@/pages/home-placeholder-page";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { ROLES } from "@/shared/constants";

export default function TeacherDashboardRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.TEACHER]}>
        <HomePlaceholderPage area="O'qituvchi bo'limi" />
      </RoleRoute>
    </ProtectedRoute>
  );
}
