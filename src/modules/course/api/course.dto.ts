import type { EnrollmentStatus, UserDto } from "@/shared/types";

/** `GET /api/v1/courses/` — bitta kurs. */
export interface CourseDto {
  id: string | number;
  title: string;
  subject?: string;
  description?: string;
  teacher?: UserDto;
  student_count?: number;
  /** Katalogda: joriy foydalanuvchining shu kursdagi yozilish holati. */
  my_status?: EnrollmentStatus | null;
  is_active?: boolean;
  /**
   * Kurs fani til fanimi (`subject` dan avtomatik aniqlanadi, docs/STAFF_API.md §2).
   * Faqat shunda vazifaga "tekshiruv turi" (writing/reading/…) beriladi.
   */
  is_language_subject?: boolean;
  created_at?: string | null;
}

export interface EnrollmentDto {
  id: string | number;
  course?: string | number;
  course_title: string;
  student?: UserDto;
  status: EnrollmentStatus;
  created_at: string;
}

/** `GET /api/v1/courses/<id>/search-students/` — kursdagi holati bilan. */
export interface CourseStudentSearchDto extends UserDto {
  enroll_status?: EnrollmentStatus | null;
}

/** `POST/PATCH /api/v1/courses/` tanasi. */
export interface CourseRequestDto {
  title: string;
  subject: string;
  description: string;
}

/** Kurs formasi — `NewConversationDialog` va `ConversationInfoPanel` yuboradi. */
export interface CourseFormInput {
  name?: string;
  title?: string;
  subject?: string;
  description?: string;
}

/** `POST /api/v1/courses/<id>/enroll/` tanasi — o'quvchi o'zi yozilsa bo'sh. */
export interface EnrollPayload {
  student_id?: string;
}

export type EnrollmentAction = "approve" | "decline";
