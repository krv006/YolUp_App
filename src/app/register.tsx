import { RegisterPage } from "@/pages/auth/register-page";
import { PublicRoute } from "@/providers/route-guards";

export default function RegisterRoute() {
  return (
    <PublicRoute>
      <RegisterPage />
    </PublicRoute>
  );
}
