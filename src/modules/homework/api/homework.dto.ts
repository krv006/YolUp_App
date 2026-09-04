import type { SubmissionStatus } from "@/shared/types";

/** Gemini savolma-savol tahlili (docs/PROJECT.md §6) — barcha matnlar o'zbekcha. */
export interface AiQuestionDto {
  question_number?: number;
  question?: string;
  student_answer?: string;
  expected_solution?: string;
  analysis?: string;
  mistakes?: unknown[];
  error_categories?: unknown[];
  correct_answer?: string;
  suggestions?: unknown[];
  difficulty?: string;
  score?: number | null;
}

export interface AiSummaryDto {
  strengths?: unknown[];
  weaknesses?: unknown[];
  topics_to_review?: unknown[];
  recommendations?: unknown[];
}

export interface AiResultDto {
  overall_score?: number | null;
  grade?: string;
  questions?: AiQuestionDto[];
  summary?: AiSummaryDto | null;
}

export interface SubmissionDto {
  id: string | number;
  assignment_id: string | number;
  student_id: string | number;
  student_name: string;
  file_name: string;
  status: SubmissionStatus;
  overall_score: number | null;
  grade: string;
  error?: string;
  is_late?: boolean;
  created_at: string;
  checked_at: string | null;
  result?: AiResultDto | null;
}

/**
 * O‘qituvchining AI bahosini tuzatishi
 * (`POST /homework/submissions/{id}/review/`). Har uchala maydon ixtiyoriy —
 * faqat o‘zgartirilgani yuboriladi.
 */
export interface SubmissionReviewInput {
  overallScore?: number | null;
  grade?: string;
  /** AI natijasining TO‘LIQ tahrirlangan JSON’i (serverdan kelgan shaklda). */
  result?: Record<string, unknown> | null;
}

export interface AssignmentStatsDto {
  students_count?: number | null;
  submitted_count?: number | null;
  avg_score?: number | null;
}

export interface AssignmentDto {
  id: string | number;
  course_id: string | number;
  course_title: string;
  subject: string;
  title: string;
  description?: string;
  body?: string;
  attachment_name?: string;
  has_attachment?: boolean;
  due_at: string | null;
  skill_key?: string;
  /** Vazifa qaysi TUGAGAN darsga tegishli (docs/STAFF_API.md §8). Bo'lmasligi mumkin. */
  lesson_id?: string | number | null;
  lesson_title?: string | null;
  created_at: string;
  submissions_count?: number | null;
  my_submission?: SubmissionDto | null;
  submissions?: SubmissionDto[];
  stats?: AssignmentStatsDto | null;
}

/**
 * `GET /api/v1/homework/report/` javobi — backend bu shaklni hujjatlashtirmagan,
 * shuning uchun bir nechta ehtimoliy maydon nomi (alias) qabul qilinadi
 * (`lib/homework.mappers.ts#mapHomeworkReportDto`). Haqiqiy javobni ko'rgach
 * ortiqcha aliaslarni olib tashlang.
 */
export interface HomeworkCourseReportDto {
  course_id?: string | number;
  id?: string | number;
  course_title?: string;
  title?: string;
  course_name?: string;
  assigned_count?: number | null;
  assignments_count?: number | null;
  total_assignments?: number | null;
  submitted_count?: number | null;
  submissions_count?: number | null;
  avg_score?: number | null;
  average_score?: number | null;
}

export type HomeworkReportDto =
  | HomeworkCourseReportDto[]
  | {
      courses?: HomeworkCourseReportDto[];
      results?: HomeworkCourseReportDto[];
      overall?: HomeworkCourseReportDto;
      summary?: HomeworkCourseReportDto;
      total?: HomeworkCourseReportDto;
    };

/** `AddAssignmentDialog` yuboradigan forma. */
export interface AssignmentFormInput {
  courseId: string | null;
  title: string;
  description?: string;
  body?: string;
  dueAt?: string;
  skillKey?: string;
  /** Tugagan darsga bog'lash — ixtiyoriy. */
  lessonId?: string | null;
  extraInstructions?: string;
  file?: File | null;
}
