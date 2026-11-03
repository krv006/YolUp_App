/**
 * `parent` modulining mobil barrel'i.
 *
 * Veb `src/modules/parent/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { parentApi } from "./api/parent.api";
export type {
  Consent,
  ConsentDto,
  ConsentKind,
  LinkStatus,
  ParentChild,
  ParentDashboard,
  ParentLink,
  ParentLinkDto,
  SetConsentInput,
} from "./api/parent.dto";
export { createParentDashboard, mapChildFromLink, mapParentLinkDto } from "./lib/parent.mappers";
export {
  parentKeys,
  useParentDashboard,
  useParentChildren,
  useParentHomework,
  useParentLinks,
  useParentConsents,
  useRequestChildLink,
  useCreateChild,
  useRespondParentLink,
  useSetParentConsent,
  useCancelLink,
  useChildExams,
  useChildRank,
  useChildSessions,
  useChildSummary,
  useChildrenSummary,
  useEndAllChildSessions,
  useEndChildSession,
  useRecognizeLogin,
  useRemindChildHomework,
  useRemindLink,
  useUnlinkChild,
  useUsernameAvailability,
} from "./model/parent.queries";
export { useSelectedChild, useSelectedChildStore } from "./model/selected-child.store";
export type { UseSelectedChildResult } from "./model/selected-child.store";
export * as parentHome from "./lib/parent-home";
export type { AttentionItem, HeroState, LessonOutcome, WeekSummary } from "./lib/parent-home";
export * as parentFamily from "./lib/parent-family";
export type { ChildPeriodSummary, CourseSchedule, FamilyPeriod } from "./lib/parent-family";
export * as parentAttendance from "./lib/parent-attendance";
export type { AttendanceEntry, AttendancePeriod, AttendanceStats, AttendanceStatus } from "./lib/parent-attendance";
export * as parentLogins from "./lib/parent-logins";
export type { DeviceKind, LoginEntry, LoginPeriod, LoginTab } from "./lib/parent-logins";
export * as parentHomework from "./lib/parent-homework";
export type { HomeworkFilter, HomeworkState } from "./lib/parent-homework";
export * as parentResults from "./lib/parent-results";
export type { MonthHomework, SubjectRow } from "./lib/parent-results";
export { passwordStrength } from "./lib/password-strength";
export { isConsentRequired, retryMinutes } from "./lib/parent-errors";
export type { ChildRankDto, ChildSessionDto, ChildSummaryDto, ChildrenSummaryDto, UsernameAvailability } from "./api/parent.dto";

// --- Mobil fayl yordamchilari (veb `download-file` / `print-table` — DOM o'rnida fayl va ulashish) ---
export { downloadFile } from "./lib/download-file";
export { printTable } from "./lib/print-table";
export type { PrintableTable } from "./lib/print-table";

// --- Mobil UI ---
export { ParentAppBar } from "./ui/parent-app-bar";
export { AddChildDialog } from "./ui/add-child-dialog";
export type { AddChildDialogProps } from "./ui/add-child-dialog";
export { LinkChildDialog } from "./ui/link-child-dialog";
export type { LinkChildDialogProps } from "./ui/link-child-dialog";
export { CreateChildDialog } from "./ui/create-child-dialog";
export type { CreateChildDialogProps } from "./ui/create-child-dialog";
export { Celebration } from "./ui/child-dialog-parts";
export type { CelebrationTone } from "./ui/child-dialog-parts";
