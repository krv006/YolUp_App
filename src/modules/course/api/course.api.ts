import {
  API_ERROR_CODES,
  apiClient,
  AppError,
  normalizePagination,
  type Page,
  type RequestOptions,
} from "@/shared/api";
import { authEndpoints, type CreateChildRequestDto } from "@/modules/auth";
import type { CourseStudentSearchResult, Enrollment } from "@/shared/types";
import { courseEndpoints } from "./course.endpoints";
import type {
  CourseDto,
  CourseFormInput,
  CourseStudentSearchDto,
  EnrollmentAction,
  EnrollmentDto,
  EnrollPayload,
} from "./course.dto";
import {
  mapCourseDto,
  mapCoursePage,
  mapCourseRequest,
  mapCourseUserDto,
  mapEnrollmentDto,
} from "../lib/course.mappers";

function mapEnrollmentPage(payload: unknown, options?: RequestOptions["query"]): Page<Enrollment> {
  const page = normalizePagination<EnrollmentDto>(payload, options);
  return { ...page, items: page.items.map(mapEnrollmentDto) };
}

export const courseApi = {
  async getAll(options: RequestOptions = {}) {
    return mapCoursePage(await apiClient.get(courseEndpoints.list, options), options.query);
  },
  async getCatalog(options: RequestOptions = {}) {
    return mapCoursePage(await apiClient.get(courseEndpoints.catalog, options), options.query);
  },
  async getById(id: string, options?: RequestOptions) {
    return mapCourseDto(await apiClient.get<CourseDto>(courseEndpoints.detail(id), options));
  },
  async create(form: CourseFormInput) {
    return mapCourseDto(await apiClient.post<CourseDto>(courseEndpoints.list, mapCourseRequest(form)));
  },
  async update(id: string, form: CourseFormInput) {
    return mapCourseDto(
      await apiClient.patch<CourseDto>(courseEndpoints.detail(id), mapCourseRequest(form))
    );
  },
  async remove(id: string) {
    await apiClient.delete(courseEndpoints.detail(id));
    return id;
  },
  async getStudents(id: string, options: RequestOptions = {}) {
    return mapEnrollmentPage(await apiClient.get(courseEndpoints.students(id), options), options.query);
  },
  /** O'qituvchi username bo'yicha bazadan qidiradi (EduTech.docx talabi). */
  async searchStudents(
    id: string,
    query: string,
    options: RequestOptions = {}
  ): Promise<CourseStudentSearchResult[]> {
    const items = await apiClient.get<CourseStudentSearchDto[]>(courseEndpoints.searchStudents(id), {
      ...options,
      query: { q: query },
    });
    return items.map((item) => ({
      ...mapCourseUserDto(item),
      enrollStatus: item.enroll_status ?? null,
    }));
  },
  async enroll(id: string, payload: EnrollPayload = {}) {
    return mapEnrollmentDto(await apiClient.post<EnrollmentDto>(courseEndpoints.enroll(id), payload));
  },
  /**
   * Yangi o'quvchi hisobini yaratib, darhol shu kursga yozadi.
   *
   * O'quvchi o'zi ro'yxatdan o'ta olmaydi — hisobni ota-ona yoki o'qituvchi
   * yaratadi (`POST /auth/children/`).
   *
   * `POST /auth/children/` javob shakli hujjatlashtirilmagan (schema'da
   * "No response body"), shuning uchun `id` javobdan olinadi, kelmasa —
   * yangi hisob username bo'yicha qidirib topiladi. Ikkalasi ham
   * bo'lmasa, hisob yaratilgani aytiladi: o'qituvchi uni qo'lda qo'sha oladi.
   */
  async createStudent(courseId: string, dto: CreateChildRequestDto): Promise<Enrollment> {
    let created: { id?: string | number } | null;
    try {
      created = await apiClient.post<{ id?: string | number } | null>(authEndpoints.children, dto);
    } catch (error) {
      // Backend bu endpointni hozircha faqat OTA-ONAGA ochgan (sinovda 403).
      // Xom xabar "Sizning rolingizda ruxsat yo'q" — o'qituvchi buni o'z
      // xatosi deb o'ylamasligi uchun sababni ochiq aytamiz.
      if (error instanceof AppError && error.status === 403) {
        throw new AppError({
          code: API_ERROR_CODES.FORBIDDEN,
          status: 403,
          message:
            "O‘quvchi hisobini hozircha faqat ota-ona yarata oladi — serverda o‘qituvchiga ruxsat ochilmagan. Mavjud o‘quvchini «Qidirish» orqali qo‘shing.",
          originalError: error,
        });
      }
      throw error;
    }

    let studentId = created && created.id != null ? String(created.id) : null;
    if (!studentId) {
      const found = await this.searchStudents(courseId, dto.username);
      studentId = found.find((item) => item.username === dto.username)?.id ?? null;
    }

    if (!studentId) {
      throw new AppError({
        code: API_ERROR_CODES.NOT_FOUND,
        message: `“${dto.username}” hisobi yaratildi, lekin kursga qo‘shib bo‘lmadi. Uni qidiruv orqali qo‘shing.`,
      });
    }

    return this.enroll(courseId, { student_id: studentId });
  },
  async unenroll(id: string, studentId?: string) {
    return apiClient.post(courseEndpoints.unenroll(id), studentId ? { student_id: studentId } : {});
  },
  async getRequests(options: RequestOptions = {}) {
    return mapEnrollmentPage(await apiClient.get(courseEndpoints.requests, options), options.query);
  },
  async respondRequest(enrollmentId: string, action: EnrollmentAction) {
    return mapEnrollmentDto(
      await apiClient.post<EnrollmentDto>(courseEndpoints.respondRequest, {
        enrollment_id: enrollmentId,
        action,
      })
    );
  },
};
