import type { UserDto } from "@/shared/types";

/** Fokus jurnalidagi bitta chiqish-qaytish oralig'i. */
export interface FocusExitDto {
  left_at: string;
  returned_at: string | null;
  seconds: number;
}

/** `focus` — dars oynasidan chiqib-kirish tahlili (docs/PROJECT.md §10). */
export interface FocusJournalDto {
  exits?: number;
  away_seconds?: number;
  longest_seconds?: number;
  timeline?: FocusExitDto[];
}

/** `GET /api/v1/attendance/` — bitta davomat yozuvi. */
export interface AttendanceDto {
  id: string | number;
  lesson: string | number;
  lesson_title: string;
  student: UserDto;
  joined_at: string | null;
  left_at: string | null;
  minutes: number;
  attention_total: number;
  attention_answered: number;
  /** Eski, tekis maydon — `focus` kelmasa zaxira sifatida ishlatiladi. */
  focus_exits: number;
  focus?: FocusJournalDto | null;
  /**
   * Chegaradan oshib chiqqan va ota-onaga signal ketgan
   * (docs/COMPLETED_WORK.md §3). Eski backendda bu maydon yo'q.
   */
  focus_alert?: boolean | null;
}
