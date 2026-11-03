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

// --- Mobil UI ---
export { ParentAppBar } from "./ui/parent-app-bar";
