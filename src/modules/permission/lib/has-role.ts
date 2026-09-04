import type { Role } from "@/shared/constants";

/** Backend rollarni kichik harfda qaytaradi (teacher), frontend esa TEACHER bilan solishtiradi. */
export function normalizeRole(role: unknown): string {
  return typeof role === "string" ? role.trim().toUpperCase() : "";
}

export function hasRole(
  user: { role?: string } | null | undefined,
  allowedRoles: readonly (Role | string)[]
): boolean {
  if (!user || !Array.isArray(allowedRoles) || allowedRoles.length === 0) return false;
  const currentRole = normalizeRole(user.role);
  return allowedRoles.some((role) => normalizeRole(role) === currentRole);
}
