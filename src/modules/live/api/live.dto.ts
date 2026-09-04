/** `POST /api/v1/live/token/` javobi. */
export interface RoomTokenDto {
  token: string;
  url: string;
  room: string;
  is_teacher: boolean;
  /**
   * Server hisoblagan FIFO ulanish navbati kechikishi (millisekund) —
   * o'qituvchida har doim 0. Bir darsga qisqa vaqtda ko'p o'quvchi
   * ulanganda LiveKit'da CPU portlashini yumshatish uchun (2026-09-02).
   */
  join_delay_ms?: number;
}

/** `GET /api/v1/live/attention/` javobi — tekshiruv bo'lmasa `check` null. */
export interface AttentionResponseDto {
  check: { id: string | number; due_at: string } | null;
}

export interface AttentionAnswerDto {
  answered_at: string;
}

/** Fokus jurnali hodisasi: oynadan chiqish / qaytish. */
export type FocusKind = "exit" | "return";

/**
 * `POST /api/v1/live/focus/` javobi (docs/COMPLETED_WORK.md §3).
 *
 * `kind=return` da hisoblagichga ta'sir qilinmaydi va maydonlar bo'sh keladi.
 * Eski backend faqat `{ok: true}` qaytaradi — shuning uchun hammasi ixtiyoriy.
 */
export interface FocusResponseDto {
  ok?: boolean;
  kind?: FocusKind;
  /** Shu darsda jami necha marta oynadan chiqqani. */
  exit_count?: number;
  /** Ota-onaga signal yuboriladigan chegara (default 3). */
  threshold?: number;
  /** Chegaradan oshgan — ota-onaga signal yaratilgan. */
  parent_notified?: boolean;
}

export interface FocusResult {
  exitCount: number;
  threshold: number;
  parentNotified: boolean;
  /** Backend eskirgan bo'lsa (`exit_count` yubormasa) — ogohlantirish ko'rsatilmaydi. */
  tracked: boolean;
}

// ─── Domen ko'rinishlari ────────────────────────────────────────────────────
export interface RoomToken {
  token: string;
  serverUrl: string;
  roomName: string;
  isTeacher: boolean;
  /** Serverning FIFO navbati kechikishi (ms) — `LiveKitRoom`ga ulanishdan oldin shuncha kutiladi. */
  joinDelayMs: number;
}

export interface AttentionCheck {
  id: string;
  dueAt: string;
}
