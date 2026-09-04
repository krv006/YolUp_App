import { apiClient, type RequestOptions } from "@/shared/api";
import { liveEndpoints } from "./live.endpoints";
import type {
  AttentionAnswerDto,
  AttentionResponseDto,
  FocusKind,
  FocusResponseDto,
  RoomTokenDto,
} from "./live.dto";
import { mapAttentionDto, mapFocusDto, mapRoomTokenDto } from "../lib/live.mappers";

export const liveApi = {
  async getToken(lessonId: string) {
    return mapRoomTokenDto(await apiClient.post<RoomTokenDto>(liveEndpoints.token, { lesson_id: lessonId }));
  },
  async leave(lessonId: string) {
    return apiClient.post(liveEndpoints.leave, { lesson_id: lessonId });
  },
  async getAttention(lessonId: string, options?: RequestOptions) {
    return mapAttentionDto(
      await apiClient.get<AttentionResponseDto>(liveEndpoints.attention, {
        ...options,
        query: { lesson_id: lessonId },
      })
    );
  },
  async answerAttention(checkId: string) {
    const dto = await apiClient.post<AttentionAnswerDto>(liveEndpoints.attention, { check_id: checkId });
    return { answeredAt: dto.answered_at };
  },
  async sendFocus(lessonId: string, kind: FocusKind) {
    return mapFocusDto(
      await apiClient.post<FocusResponseDto>(liveEndpoints.focus, { lesson_id: lessonId, kind })
    );
  },
  async allowShare(lessonId: string, identity: string) {
    return apiClient.post(liveEndpoints.allowShare, { lesson_id: lessonId, identity });
  },

  /**
   * Mikrofon so'rovi (MIC_REQUEST_GRANT.md). O'quvchi darsga mikrofonsiz kiradi;
   * so'rov o'qituvchi ekraniga doska kanali orqali chiqadi.
   */
  async requestMic(lessonId: string) {
    return apiClient.post(liveEndpoints.requestMic, { lesson_id: lessonId });
  },

  /** O'qituvchi ruxsati — LiveKit darajasida o'quvchi gapira oladigan bo'ladi. */
  async grantMic(lessonId: string, studentId: string) {
    await apiClient.post(liveEndpoints.grantMic, { lesson_id: lessonId, student_id: studentId });
    return studentId;
  },

  /**
   * So'rovni rad etish: mikrofon berilmaydi, so'rov navbatdan chiqadi.
   * `denied:false` — navbatda bunday so'rov topilmadi (allaqachon yopilgan).
   */
  async denyMic(lessonId: string, studentId: string) {
    const dto = await apiClient.post<{ denied?: boolean } | null>(liveEndpoints.denyMic, {
      lesson_id: lessonId,
      student_id: studentId,
    });
    return Boolean(dto?.denied);
  },

  /**
   * Kamera so'rovi — mikrofon bilan aynan bir xil naqsh
   * (FRONTEND_TODO_CAMERA_BOARD.md §1). O'quvchi tokeni kamera nashr qilish
   * huquqisiz keladi, o'qituvchi ruxsat berguncha kamera yoqilmaydi.
   */
  async requestCamera(lessonId: string) {
    return apiClient.post(liveEndpoints.requestCamera, { lesson_id: lessonId });
  },

  async grantCamera(lessonId: string, studentId: string) {
    await apiClient.post(liveEndpoints.grantCamera, { lesson_id: lessonId, student_id: studentId });
    return studentId;
  },

  async denyCamera(lessonId: string, studentId: string) {
    const dto = await apiClient.post<{ denied?: boolean } | null>(liveEndpoints.denyCamera, {
      lesson_id: lessonId,
      student_id: studentId,
    });
    return Boolean(dto?.denied);
  },

  async invite(lessonId: string, studentId?: string) {
    const dto = await apiClient.post<{ invited?: number } | null>(liveEndpoints.invite, {
      lesson_id: lessonId,
      ...(studentId ? { student_id: studentId } : {}),
    });
    return Number(dto?.invited ?? 0);
  },

  /** Darsdan chetlashtirish: xonadan uzadi va qayta kirishni bloklaydi. */
  async ban(lessonId: string, studentId: string) {
    await apiClient.post(liveEndpoints.ban, { lesson_id: lessonId, student_id: studentId });
    return studentId;
  },

  async unban(lessonId: string, studentId: string) {
    const dto = await apiClient.post<{ unbanned?: boolean } | null>(liveEndpoints.unban, {
      lesson_id: lessonId,
      student_id: studentId,
    });
    return Boolean(dto?.unbanned);
  },
};
