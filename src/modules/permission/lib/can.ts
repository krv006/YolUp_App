import { ROLE_PERMISSIONS, type Permission } from "../constants/permission-map";
import { normalizeRole } from "./has-role";

/** Frontend permission faqat UI/UX guard. Haqiqiy ruxsat backendda ham tekshirilishi shart. */
export function can(
  user: { role?: string } | null | undefined,
  permission: Permission | null | undefined
): boolean {
  if (!user || !permission) return false;
  const permissions = ROLE_PERMISSIONS[normalizeRole(user.role)] ?? [];
  return permissions.includes("*") || permissions.includes(permission);
}
