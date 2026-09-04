import type { BoardState, BoardStateDto } from "../api/board.dto";

export function mapBoardDto(dto: BoardStateDto): BoardState {
  return {
    sheets: (dto.sheets ?? []).map((sheet) => ({
      index: Number(sheet.index),
      strokes: sheet.strokes ?? [],
    })),
    canDraw: Boolean(dto.can_draw),
    isTeacher: Boolean(dto.is_teacher),
    width: Number(dto.size?.[0] ?? 1200),
    height: Number(dto.size?.[1] ?? 800),
    subject: dto.subject || "",
    mathEnabled: Boolean(dto.math_enabled),
    awayStudents: (dto.away_students ?? []).map((item) => ({
      id: String(item.student_id),
      name: item.name || "O‘quvchi",
    })),
    pendingMicRequests: (dto.pending_mic_requests ?? []).map((item) => ({
      id: String(item.student_id),
      name: item.name || "O‘quvchi",
    })),
    pendingCameraRequests: (dto.pending_camera_requests ?? []).map((item) => ({
      id: String(item.student_id),
      name: item.name || "O‘quvchi",
    })),
  };
}
