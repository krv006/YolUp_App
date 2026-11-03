import type { DsColor, IconName } from "@/shared/ui";

/** Veb `mock-styles.ts` — Tailwind sinflari o'rnida `ds` rang tokenlari. */

export function sectionIcon(key: string, title: string): IconName {
  const name = `${key} ${title}`.toLowerCase();
  if (/listen|tingla/.test(name)) return "volume-up";
  if (/read|o.qish/.test(name)) return "menu-book";
  if (/writ|yoz/.test(name)) return "edit-note";
  if (/speak|gapir/.test(name)) return "mic";
  return "quiz";
}

export function band(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

export function bandTone(value: number): { bg: DsColor; fg: DsColor } {
  if (value >= 6.5) return { bg: "success-bg", fg: "success-text" };
  if (value >= 5.5) return { bg: "warning-bg", fg: "warning-text" };
  return { bg: "danger-bg", fg: "error-text" };
}
