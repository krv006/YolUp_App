import { ForgotPasswordPage } from "@/pages/auth/password-reset-pages";
import { PublicRoute } from "@/providers/route-guards";

export default function Route() {
  return (
    <PublicRoute>
      <ForgotPasswordPage />
    </PublicRoute>
  );
}
