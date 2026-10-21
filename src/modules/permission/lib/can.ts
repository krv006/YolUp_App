import { ROLE_PERMISSIONS, type Permission } from "../constants/permission-map";
import { normalizeRole } from "./has-role";

export function can(
  user: { role?: string } | null | undefined,
  permission: Permission | null | undefined
): boolean {
  if (!user || !permission) return false;
  const permissions = ROLE_PERMISSIONS[normalizeRole(user.role)] ?? [];
  return permissions.includes("*") || permissions.includes(permission);
}
