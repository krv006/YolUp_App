import { apiClient, type RequestOptions } from "@/shared/api";
import { boardEndpoints } from "./board.endpoints";
import type { BoardStateDto, FormulaSolutionDto, StrokeInput } from "./board.dto";
import { mapBoardDto } from "../lib/board.mappers";

export const boardApi = {
  async getState(lessonId: string, options?: RequestOptions) {
    return mapBoardDto(await apiClient.get<BoardStateDto>(boardEndpoints.state(lessonId), options));
  },
  addStroke: (lessonId: string, sheet: number, stroke: StrokeInput) =>
    apiClient.post(boardEndpoints.stroke(lessonId), { sheet, stroke }),
  addSheet: (lessonId: string) => apiClient.post(boardEndpoints.sheet(lessonId), {}),
  /** O‘chirish sababi majburiy — audit jurnaliga yoziladi. */
  erase: (lessonId: string, sheet: number, strokeIds: string[], reason: string) =>
    apiClient.post(boardEndpoints.erase(lessonId), { sheet, stroke_ids: strokeIds, reason }),
  grant: (lessonId: string, studentId: string) =>
    apiClient.post(boardEndpoints.grant(lessonId), { student_id: studentId }),
  solve: (lessonId: string, expression: string) =>
    apiClient.post<FormulaSolutionDto>(boardEndpoints.solve(lessonId), { expr: expression }),
  downloadPdf: (lessonId: string, options?: RequestOptions) =>
    apiClient.get<Blob>(boardEndpoints.pdf(lessonId), { ...options, responseType: "blob" }),
};
