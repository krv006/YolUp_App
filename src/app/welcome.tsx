import { WelcomePage } from "@/pages/auth/welcome-page";
import { PublicRoute } from "@/providers/route-guards";

export default function WelcomeRoute() {
  return (
    <PublicRoute>
      <WelcomePage />
    </PublicRoute>
  );
}
