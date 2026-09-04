/** Backend DirectStatusEnum (/api/schema/): pending | active | blocked. */
export const DIRECT_STATUS = Object.freeze({
  PENDING: "pending",
  ACTIVE: "active",
  BLOCKED: "blocked",
});

export type DirectStatusValue = (typeof DIRECT_STATUS)[keyof typeof DIRECT_STATUS];

export const DIRECT_STATUS_LABELS: Readonly<Record<DirectStatusValue, string>> = Object.freeze({
  [DIRECT_STATUS.PENDING]: "So‘rov kutilmoqda",
  [DIRECT_STATUS.ACTIVE]: "Shaxsiy suhbat",
  [DIRECT_STATUS.BLOCKED]: "Bloklangan",
});

export function directStatusLabel(
  status: DirectStatusValue | null | undefined,
  fallback = "So‘rov yuborilmagan"
): string {
  return (status && DIRECT_STATUS_LABELS[status]) ?? fallback;
}
