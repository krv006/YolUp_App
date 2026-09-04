/**
 * Doska stroke turlari — docs/PROJECT.md §5.3.
 *
 * Backend `type` maydonini faqat shakl/matn bloklarida yuboradi; qalam va marker
 * uchun u yo'q (`points` bilan aniqlanadi), marker esa `opacity < 1` bilan farqlanadi.
 */
export type StrokeKind = "pen" | "marker" | "line" | "rect" | "ellipse" | "text" | "math";

export type Point = [number, number];

interface StrokeBase {
  color?: string;
  width?: number;
}

/** Qalam va marker: farqi faqat `opacity` da. */
export interface FreehandStrokeDto extends StrokeBase {
  type?: undefined;
  points: Point[];
  opacity?: number;
}

export interface LineStrokeDto extends StrokeBase {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  arrow?: boolean;
}

export interface RectStrokeDto extends StrokeBase {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EllipseStrokeDto extends StrokeBase {
  type: "ellipse";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextStrokeDto extends StrokeBase {
  type: "text";
  text: string;
  x: number;
  y: number;
  size?: number;
}

/** Faqat `math_enabled` kurslarda — boshqasida server 400 qaytaradi. */
export interface MathStrokeDto extends StrokeBase {
  type: "math";
  latex: string;
  x: number;
  y: number;
  size?: number;
}

export type StrokeShapeDto =
  | FreehandStrokeDto
  | LineStrokeDto
  | RectStrokeDto
  | EllipseStrokeDto
  | TextStrokeDto
  | MathStrokeDto;

/** Server saqlagan stroke — `id` bilan. */
export type StrokeDto = StrokeShapeDto & { id: string };

/** Yangi chizma yuborishda `id` hali yo'q. */
export type StrokeInput = StrokeShapeDto;

export interface BoardSheetDto {
  index: number | string;
  strokes?: StrokeDto[];
}

/** `GET /api/v1/board/<lesson_id>/` javobi. */
export interface BoardStateDto {
  sheets?: BoardSheetDto[];
  can_draw?: boolean;
  is_teacher?: boolean;
  /** [kenglik, balandlik] */
  size?: [number, number];
  subject?: string;
  /** Faqat matematika kurslarida `true` — formula vositasi shunga qarab ko'rsatiladi. */
  math_enabled?: boolean;
  /**
   * Hozir dars oynasidan chiqib ketgan o'quvchilar (docs/STAFF_API.md §7).
   * Faqat `is_teacher: true` bo'lganda keladi.
   */
  away_students?: Array<{ student_id: string | number; name: string }>;
  /**
   * Mikrofon so‘ragan va hali javob olmagan o‘quvchilar, FIFO tartibida
   * (FRONTEND_TODO.md §"Yangi maydon"). Faqat `is_teacher: true` bo‘lganda
   * keladi: sahifa ochilganda navbat shundan tiklanadi, aks holda WS
   * ulanishidan oldin kelgan so‘rovlar yo‘qolib ketardi.
   */
  pending_mic_requests?: Array<{ student_id: string | number; name: string }>;
  /** Kamera so‘ragan va hali javob olmagan o‘quvchilar — `pending_mic_requests` bilan bir xil naqsh. */
  pending_camera_requests?: Array<{ student_id: string | number; name: string }>;
}

/** `POST /api/v1/board/<lesson_id>/solve/` javobi (SymPy). */
export interface FormulaSolutionDto {
  pretty: string;
  result: string;
  steps?: string[];
}

// ─── Domen ko'rinishi ───────────────────────────────────────────────────────
export interface BoardSheet {
  index: number;
  strokes: StrokeDto[];
}

/** Dars oynasidan chiqib ketgan o'quvchi — o'qituvchiga ko'rsatiladi. */
export interface AwayStudent {
  id: string;
  name: string;
}

/** Mikrofon so‘rovi navbatidagi o‘quvchi (FIFO). */
export interface PendingMicRequest {
  id: string;
  name: string;
}

/** Kamera so‘rovi navbatidagi o‘quvchi (FIFO) — `PendingMicRequest` bilan bir xil shakl. */
export interface PendingCameraRequest {
  id: string;
  name: string;
}

export interface BoardState {
  sheets: BoardSheet[];
  canDraw: boolean;
  isTeacher: boolean;
  width: number;
  height: number;
  subject: string;
  mathEnabled: boolean;
  /** Faqat o'qituvchida to'ladi; boshqalarda bo'sh massiv. */
  awayStudents: AwayStudent[];
  /** Mikrofon navbatida turgan o‘quvchi — faqat o’qituvchida to’ladi. */
  pendingMicRequests: PendingMicRequest[];
  /** Kamera navbatida turgan o‘quvchi — faqat o’qituvchida to’ladi. */
  pendingCameraRequests: PendingCameraRequest[];
}
