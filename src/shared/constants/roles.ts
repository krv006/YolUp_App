export const ROLES = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
});

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES: readonly Role[] = Object.freeze(Object.values(ROLES));
