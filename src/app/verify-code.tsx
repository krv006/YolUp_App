import { Redirect } from "expo-router";
import { VerifyCodePage } from "@/pages/auth/password-reset-pages";
import { PublicRoute } from "@/providers/route-guards";
import { FEATURES, ROUTES } from "@/shared/config";

export default function Route() {
  // SMS bilan tasdiqlash hozircha o'chirilgan (`FEATURES`) — eski havola kirishga qaytaradi.
  if (!FEATURES.smsVerification) return <Redirect href={ROUTES.auth.login as never} />;
  return (
    <PublicRoute>
      <VerifyCodePage />
    </PublicRoute>
  );
}
