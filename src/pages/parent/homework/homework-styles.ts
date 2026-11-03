import type { HomeworkState } from "@/modules/parent";
import type { DsColor, IconName } from "@/shared/ui";

/** Veb `homework-styles.ts` — Tailwind sinflari o'rnida `ds` rang tokenlari. */
type Tone = { bg: DsColor; fg: DsColor };

export const STATE_TILE: Record<HomeworkState, { icon: IconName } & Tone> = {
  pending: { icon: "assignment", bg: "accent-saffron-bg", fg: "accent-saffron-fg" },
  overdue: { icon: "assignment", bg: "danger-bg", fg: "error-text" },
  resubmit: { icon: "refresh", bg: "accent-saffron-bg", fg: "accent-saffron-fg" },
  checking: { icon: "assignment", bg: "accent-teal-bg", fg: "accent-teal-fg" },
  error: { icon: "auto-awesome", bg: "accent-violet-bg", fg: "accent-violet-fg" },
  graded: { icon: "check-circle", bg: "accent-green-bg", fg: "accent-green-fg" },
  done: { icon: "check-circle", bg: "accent-green-bg", fg: "accent-green-fg" },
};

export const STATE_CHIP: Record<HomeworkState, { icon: IconName | null } & Tone> = {
  pending: { icon: "hourglass-empty", bg: "warning-bg", fg: "warning-text" },
  overdue: { icon: "warning-fill", bg: "danger-bg", fg: "error-text" },
  resubmit: { icon: "refresh", bg: "warning-bg", fg: "warning-text" },
  checking: { icon: "pending", bg: "accent-teal-bg", fg: "accent-teal-fg" },
  error: { icon: "warning-fill", bg: "danger-bg", fg: "error-text" },
  graded: { icon: null, bg: "success-bg", fg: "success-text" },
  done: { icon: "check-circle", bg: "success-bg", fg: "success-text" },
};
