import { NewPasswordPage } from "@/pages/auth/password-reset-pages";
import { PublicRoute } from "@/providers/route-guards";

export default function Route() {
  return (
    <PublicRoute>
      <NewPasswordPage />
    </PublicRoute>
  );
}
