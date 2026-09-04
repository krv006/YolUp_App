import { normalizePagination, type Page, type PaginationOptions } from "@/shared/api";
import type { Course, DomainUser, Enrollment, UserDto } from "@/shared/types";
import type { CourseDto, CourseFormInput, CourseRequestDto, EnrollmentDto } from "../api/course.dto";

const TONES = ["violet", "blue", "emerald", "amber", "rose"] as const;

/** ID'ning birinchi belgisidan barqaror rang tanlaydi — har render bir xil chiqadi. */
function toneFor(id: unknown): string {
  return TONES[Math.abs(String(id).charCodeAt(0) || 0) % TONES.length];
}

export function mapCourseDto(dto: CourseDto): Course {
  const teacher = dto?.teacher ?? ({} as UserDto);
  return {
    id: String(dto.id),
    title: dto.title,
    subject: dto.subject || "Umumiy",
    description: dto.description || "",
    teacher:
      [teacher.first_name, teacher.last_name].filter(Boolean).join(" ") ||
      teacher.username ||
      "O‘qituvchi",
    teacherUser: teacher.id ? mapCourseUserDto(teacher) : null,
    students: Number(dto.student_count ?? 0),
    studentCount: Number(dto.student_count ?? 0),
    status: dto.my_status ?? "joined",
    enrollmentStatus: dto.my_status ?? null,
    isActive: dto.is_active !== false,
    // Maydon eski backendda yo'q — bo'lmasa "til fani emas" deb qaraladi.
    isLanguageSubject: Boolean(dto.is_language_subject),
    createdAt: dto.created_at ?? null,
    color: toneFor(dto.id),
  };
}

export function mapCourseUserDto(dto: UserDto = {} as UserDto): DomainUser {
  return {
    id: dto.id ? String(dto.id) : "",
    username: dto.username ?? "",
    name: [dto.first_name, dto.last_name].filter(Boolean).join(" ") || dto.username || "Foydalanuvchi",
    firstName: dto.first_name || "",
    lastName: dto.last_name || "",
    role: dto.role,
    phone: dto.phone ?? null,
    inviteCode: dto.invite_code ?? null,
    avatarTone: toneFor(dto.id),
    status: "offline",
  };
}

export function mapEnrollmentDto(dto: EnrollmentDto): Enrollment {
  return {
    id: String(dto.id),
    courseId: dto.course ? String(dto.course) : "",
    courseTitle: dto.course_title,
    student: mapCourseUserDto(dto.student ?? ({} as UserDto)),
    status: dto.status,
    createdAt: dto.created_at,
  };
}

export function mapCoursePage(dto: unknown, options?: PaginationOptions): Page<Course> {
  const page = normalizePagination<CourseDto>(dto, options);
  return { ...page, items: page.items.map(mapCourseDto) };
}

export function mapCourseRequest(form: CourseFormInput): CourseRequestDto {
  return {
    title: form.name ?? form.title ?? "",
    subject: form.subject ?? "",
    description: form.description ?? "",
  };
}
