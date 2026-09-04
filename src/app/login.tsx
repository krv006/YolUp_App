import { LoginPage } from "@/pages/auth/login-page";
import { PublicRoute } from "@/providers/route-guards";

export default function LoginRoute() {
  return (
    <PublicRoute>
      <LoginPage />
    </PublicRoute>
  );
}
