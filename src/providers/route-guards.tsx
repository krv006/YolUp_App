import type { ReactNode } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/modules/auth";
import { hasRole } from "@/modules/permission";
import { ROUTES } from "@/shared/config";
import type { Role } from "@/shared/constants";
import { Screen, ScreenLoading } from "@/shared/ui";

/**
 * Veb `src/app/router/protected-route.tsx` va `role-route.tsx` ning o'rni.
 *
 * Joylashuvi `src/providers/` da, chunki Expo Router `src/app/` dagi har
 * fayldan marshrut yasaydi va guard komponentlari u yerda tura olmaydi.
 *
 * MUHIM: bu — QULAYLIK guard'i, XAVFSIZLIK emas. Haqiqiy ruxsat tekshiruvi
 * backend RBAC'ida (`apps/core/permissions.py`). Bu yerda faqat foydalanuvchi
 * ko'rmasligi kerak bo'lgan ekranga tushib qolmasligi ta'minlanadi.
 */

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <Screen>
        <ScreenLoading label="Sessiya tekshirilmoqda…" />
      </Screen>
    );
  }

  if (!isAuthenticated) return <Redirect href={ROUTES.auth.login} />;

  return <>{children}</>;
}

export interface RoleRouteProps {
  allowedRoles: readonly Role[];
  children: ReactNode;
}

export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { user } = useAuth();

  // Rolga to'g'ri kelmasa — o'z bosh sahifasiga, "ruxsat yo'q" ekraniga emas:
  // foydalanuvchi bu yerga ataylab emas, eski havola orqali tushgan bo'ladi.
  if (!hasRole(user, allowedRoles)) return <Redirect href={ROUTES.root} />;

  return <>{children}</>;
}

/** Kirgan foydalanuvchi login ekranini qayta ko'rmasin. */
export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Redirect href={ROUTES.root} />;
  return <>{children}</>;
}
