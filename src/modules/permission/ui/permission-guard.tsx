import type { ReactNode } from "react";
import { can } from "../lib/can";
import type { Permission } from "../constants/permission-map";

export interface PermissionGuardProps {
  user: { role?: string } | null | undefined;
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Ruxsatga qarab ko'rsatish — veb `permission-guard.tsx` bilan bir xil.
 *
 * Bu MARSHRUT qorovuli emas (u `providers/route-guards.tsx` da): bu blok
 * ichidagi tugma yoki bo'lim ko'rinishini hal qiladi. Xavfsizlik emas —
 * qulaylik: backend baribir har so'rovni qayta tekshiradi.
 */
export function PermissionGuard({
  user,
  permission,
  fallback = null,
  children,
}: PermissionGuardProps) {
  return can(user, permission) ? <>{children}</> : <>{fallback}</>;
}
