/**
 * `permission` modulining mobil barrel'i.
 *
 * Veb `src/modules/permission/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { PERMISSIONS, ROLE_PERMISSIONS } from "./constants/permission-map";
export type { Permission } from "./constants/permission-map";
export { can } from "./lib/can";
export { hasRole, normalizeRole } from "./lib/has-role";
export { PermissionGuard } from "./ui/permission-guard";
export type { PermissionGuardProps } from "./ui/permission-guard";
