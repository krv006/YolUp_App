import { apiClient, type RequestOptions } from "@/shared/api";
import type { Submission } from "@/shared/types";
import { homeworkEndpoints } from "./homework.endpoints";
import type {
  AssignmentDto,
  AssignmentFormInput,
  HomeworkReportDto,
  SubmissionDto,
  SubmissionReviewInput,
} from "./homework.dto";
import {
  mapAssignmentDto,
  mapAssignmentRequest,
  mapHomeworkReportDto,
  mapSubmissionDto,
} from "../lib/homework.mappers";
import { validateHomeworkFile } from "../lib/homework-validation";

export const homeworkApi = {
  async getAssignments(courseId: string | null, options: RequestOptions = {}) {
    const items = await apiClient.get<AssignmentDto[]>(homeworkEndpoints.assignments, {
      ...options,
      query: { course: courseId },
    });
    return items.map(mapAssignmentDto);
  },
  async getAssignment(id: string, options?: RequestOptions) {
    return mapAssignmentDto(await apiClient.get<AssignmentDto>(homeworkEndpoints.assignment(id), options));
  },
  async createAssignment(form: AssignmentFormInput) {
    if (form.file) validateHomeworkFile(form.file, { assignment: true });
    return mapAssignmentDto(
      await apiClient.post<AssignmentDto>(homeworkEndpoints.assignments, mapAssignmentRequest(form))
    );
  },
  async deleteAssignment(id: string) {
    await apiClient.delete(homeworkEndpoints.assignment(id));
    return id;
  },
  /** Fayllar auth talab qiladi — /media/ URL to‘g‘ridan-to‘g‘ri ishlatilmaydi. */
  async downloadAssignment(id: string, options?: RequestOptions) {
    return apiClient.get<Blob>(homeworkEndpoints.assignmentFile(id), { ...options, responseType: "blob" });
  },
  async submit(assignmentId: string, file: File | null, skillKey?: string): Promise<Submission | null> {
    validateHomeworkFile(file, { speaking: skillKey === "speaking" });
    const body = new FormData();
    body.set("file", file as File);
    return mapSubmissionDto(
      await apiClient.post<SubmissionDto>(homeworkEndpoints.submit(assignmentId), body)
    );
  },
  async getSubmission(id: string, options?: RequestOptions) {
    return mapSubmissionDto(await apiClient.get<SubmissionDto>(homeworkEndpoints.submission(id), options));
  },
  async downloadSubmission(id: string, options?: RequestOptions) {
    return apiClient.get<Blob>(homeworkEndpoints.submissionFile(id), { ...options, responseType: "blob" });
  },
  async recheck(id: string) {
    return mapSubmissionDto(await apiClient.post<SubmissionDto>(homeworkEndpoints.recheck(id), {}));
  },
  /**
   * O‘qituvchi AI bahosini tuzatadi. Faqat berilgan maydonlar yuboriladi:
   * bo‘sh qoldirilgani serverdagi qiymatni o‘chirib yubormasligi kerak.
   */
  async review(id: string, input: SubmissionReviewInput) {
    const body: Record<string, unknown> = {};
    if (input.overallScore !== undefined) body.overall_score = input.overallScore;
    if (input.grade !== undefined) body.grade = input.grade;
    if (input.result !== undefined) body.result = input.result;
    return mapSubmissionDto(await apiClient.post<SubmissionDto>(homeworkEndpoints.review(id), body));
  },
  /**
   * Reyting: har kurs bo'yicha berilgan/topshirilgan/o'rtacha ball.
   * `studentId` — ota-ona bog'langan bolasinikini so'raganda; o'quvchi
   * o'zinikini so'rasa berilmaydi (backend joriy foydalanuvchini oladi).
   */
  async getReport(studentId?: string | null, options: RequestOptions = {}) {
    const dto = await apiClient.get<HomeworkReportDto>(homeworkEndpoints.report, {
      ...options,
      query: studentId ? { student: studentId } : undefined,
    });
    return mapHomeworkReportDto(dto);
  },
};
