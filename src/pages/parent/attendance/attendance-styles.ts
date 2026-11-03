import type { AttendanceStatus } from "@/modules/parent";
import type { DsColor, IconName } from "@/shared/ui";

/**
 * Veb `pages/parent/attendance/attendance-styles.ts` — Tailwind sinflari
 * o'rnida `ds` rang tokenlari (fon / matn juftligi).
 */

export const DEFAULT_STATUSES: AttendanceStatus[] = ["attended", "late", "missed"];

export interface ToneLook {
  bg: DsColor;
  fg: DsColor;
}

export const STATUS_TILE: Record<AttendanceStatus, ToneLook> = {
  live: { bg: "danger-bg", fg: "error-text" },
  attended: { bg: "accent-green-bg", fg: "accent-green-fg" },
  late: { bg: "accent-saffron-bg", fg: "accent-saffron-fg" },
  missed: { bg: "danger-bg", fg: "error-text" },
  upcoming: { bg: "accent-teal-bg", fg: "accent-teal-fg" },
};

export const STATUS_DOT: Record<AttendanceStatus, DsColor> = {
  live: "danger",
  attended: "success",
  late: "saffron",
  missed: "danger",
  upcoming: "accent-teal-fg",
};

export function subjectLook(subject: string): { icon: IconName } & ToneLook {
  if (/ingliz|english|ielts|rus|nemis|german|fransuz|french|arab|koreys|korean|turk|language/i.test(subject)) {
    return { icon: "translate", bg: "accent-blue-bg", fg: "accent-blue-fg" };
  }
  if (/mat|algebra|geometr/i.test(subject)) return { icon: "functions", bg: "accent-green-bg", fg: "accent-green-fg" };
  return { icon: "menu-book", bg: "accent-violet-bg", fg: "accent-violet-fg" };
}
