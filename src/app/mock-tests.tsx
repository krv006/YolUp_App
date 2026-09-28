import { MockTestPage } from "@/pages/mock-test/mock-test-page";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { ROLES } from "@/shared/constants";

/*
 * Faqat O'QUVCHIGA — vebda ham shunday (`app-router.tsx:187`, mock-tests
 * marshruti student guruhida). O'qituvchi mock test yechmaydi.
 */
export default function MockTestsRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.STUDENT]}>
        <MockTestPage />
      </RoleRoute>
    </ProtectedRoute>
  );
}
