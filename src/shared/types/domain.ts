/**
 * Modul mapper'lari qaytaradigan domen modellari.
 *
 * Bular qatlamlararo shartnoma: `widgets` va `pages` shu tiplarga tayanadi,
 * `modules/*_/lib/*.mappers` esa aynan shu shaklni ishlab chiqaradi.
 * Modullar TS'ga ko'chgach, mapper'lar shu tiplarni qaytish qiymati sifatida e'lon qiladi.
 */

export type AvatarTone = "violet" | "blue" | "emerald" | "amber" | "rose";

/** Chat qobig‘i qaysi rol uchun render qilinayotgani. */
export type ConversationRole = "teacher" | "student";

// ─── Foydalanuvchi ──────────────────────────────────────────────────────────
export interface DomainUser {
  id: string;
  username: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string | null;
  inviteCode?: string | null;
  avatarTone?: string;
  status?: string;
}

// ─── Suhbat / xabar ─────────────────────────────────────────────────────────
/** Backend `DirectStatusEnum`: pending | active | blocked. */
export type DirectStatus = "pending" | "active" | "blocked";

export interface ConversationParticipant {
  id: string;
  username: string;
  name: string;
  phone: string | null;
}

export type PresenceStatus = "online" | "offline";

export interface Conversation {
  id: string;
  type: "group" | "direct";
  kind: "course" | "direct";
  courseId: string | null;
  title: string;
  participantId: string | null;
  participant: ConversationParticipant | null;
  directStatus: DirectStatus | null;
  lastMessage: string;
  lastSender: string | null;
  updatedAt: string;
  unreadCount: number;
  status: PresenceStatus;
  typing: boolean;
  typingName?: string | null;
  avatarTone: string;
  memberCount: number;
  /** Guruh chat rasmi — o'qituvchi o'rnatadi, bo'lmasa `null` (harfli avatar). */
  imageUrl: string | null;
  /** `GroupWorkspace` kurs ma'lumoti bilan to'ldiradi. */
  subject?: string;
  description?: string;
}

export interface MessageReply {
  author: string;
  text: string;
}

export interface SendMessagePayload {
  text: string;
  replyTo?: MessageReply;
  attachment?: unknown;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

/**
 * Xabarga biriktirilgan fayl. Havola emas, `messageId` saqlanadi: fayl
 * `/api/v1/chat/files/<messageId>/` dan Authorization header bilan olinadi,
 * shuning uchun uni to'g'ridan-to'g'ri `<a href>` ga qo'yib bo'lmaydi.
 */
export interface MessageAttachment {
  messageId: string;
  name: string;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  text: string;
  replyTo?: MessageReply;
  type: string;
  createdAt: string;
  status: string;
  pending: boolean;
  failed: boolean;
  editedAt?: string | null;
  retryPayload?: SendMessagePayload;
  /** Doska PDF'i kabi biriktirmalar — backend dars tugagach yuboradi. */
  attachment?: MessageAttachment;
  /** Backend hozircha reaksiyani qo‘llamaydi — maydon kelajak uchun ochiq qoldirilgan. */
  reactions?: MessageReaction[];
}

// ─── Kurs ───────────────────────────────────────────────────────────────────
export interface Course {
  id: string;
  title: string;
  subject: string;
  description: string;
  teacher: string;
  teacherUser: DomainUser | null;
  students: number;
  studentCount: number;
  status: string;
  enrollmentStatus: string | null;
  isActive: boolean;
  /** Til fani — faqat shunda vazifaga "tekshiruv turi" tanlovi beriladi. */
  isLanguageSubject: boolean;
  createdAt: string | null;
  color: string;
}

export type EnrollmentStatus = "pending" | "approved" | "declined";

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  student: DomainUser;
  status: EnrollmentStatus;
  createdAt: string;
}

/** `search-students` natijasi — kursdagi holati bilan. */
export interface CourseStudentSearchResult extends DomainUser {
  enrollStatus: EnrollmentStatus | null;
}

// ─── Dars ───────────────────────────────────────────────────────────────────
export type LessonStatus = "scheduled" | "live" | "finished" | "cancelled";

/** `recording` — egress hali dars davomida yozmoqda (docs/COMPLETED_WORK.md §1). */
export type LessonRecordingStatus = "recording" | "merging" | "completed" | "failed";

/**
 * Dars video yozuvi. `streamUrl` — 3 soatlik imzolangan havola, doimiy URL emas:
 * saqlab qo'yib bo'lmaydi, har safar qayta so'raladi.
 */
export interface LessonRecording {
  status: LessonRecordingStatus;
  /** Faqat shu bayroq `true` bo'lganda `streamUrl` keladi. */
  ready: boolean;
  title: string;
  streamUrl: string | null;
  createdAt: string | null;
  endedAt: string | null;
  error: string | null;
}

export interface Lesson {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  topic: string;
  startsAt: string;
  durationMinutes: number;
  duration: number;
  status: LessonStatus;
  roomName: string;
  createdAt: string;
  date: string;
  time: string;
  /** O'rtacha baho (1–5). Hali hech kim baholamagan bo'lsa — `null`. */
  avgRating: number | null;
  ratingCount: number;
}

/**
 * O'quvchining tugagan darsga qo'ygan bahosi (docs/COMPLETED_WORK.md — baholash API).
 * Anonim emas: kim qo'yganini o'qituvchi ko'radi.
 */
export interface LessonRating {
  id: string;
  lessonId: string;
  /** 1 dan 5 gacha. */
  stars: number;
  description: string;
  studentId: string | null;
  studentName: string;
  createdAt: string;
}

export interface LessonFormValues {
  topic: string;
  date: string;
  time: string;
  duration: number;
}

// ─── Uy vazifasi ────────────────────────────────────────────────────────────
export type SubmissionStatus = "checking" | "done" | "error";

export interface AiQuestion {
  questionNumber?: number;
  question?: string;
  studentAnswer?: string;
  expectedSolution?: string;
  analysis?: string;
  mistakes?: unknown[];
  errorCategories?: unknown[];
  correctAnswer?: string;
  suggestions?: unknown[];
  difficulty?: string;
  score?: number | null;
}

export interface AiSummary {
  strengths: unknown[];
  weaknesses: unknown[];
  topicsToReview: unknown[];
  recommendations: unknown[];
}

export interface AiResult {
  overallScore: number | null;
  grade: string;
  questions: AiQuestion[];
  summary: AiSummary | null;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  fileName: string;
  status: SubmissionStatus;
  overallScore: number | null;
  grade: string;
  error: string;
  isLate: boolean;
  createdAt: string;
  checkedAt: string | null;
  result: AiResult | null;
  /**
   * Serverdan kelgan AI natijasining ASL JSON’i.
   *
   * O‘qituvchi bahoni tuzatganda shu obyekt tahrirlanib qaytariladi. Domen
   * ko‘rinishidan qayta yig‘sak, mapper bilmaydigan maydonlar (AI yangi
   * kalit qo‘shsa) jimgina yo‘qolib ketardi.
   */
  rawResult: Record<string, unknown> | null;
}

export interface AssignmentStats {
  studentsCount: number | null;
  submittedCount: number | null;
  averageScore: number | null;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseTitle: string;
  subject: string;
  title: string;
  description: string;
  body: string;
  attachmentName: string;
  hasAttachment: boolean;
  dueAt: string | null;
  skillKey: string;
  /** Vazifa bog'langan tugagan dars — bog'lanmagan bo'lsa `null`. */
  lessonId: string | null;
  lessonTitle: string;
  createdAt: string;
  submissionsCount: number | null;
  mySubmission: Submission | null;
  submissions: Submission[];
  stats: AssignmentStats | null;
}

export interface AssignmentFormValues {
  title: string;
  description: string;
  body?: string;
  dueAt?: string;
  skillKey?: string;
  extraInstructions?: string;
  file?: File | null;
}

/** `GET /api/v1/homework/report/` — bitta kurs yoki umumiy qator uchun ko'rsatkichlar. */
export interface HomeworkReportSummary {
  assignedCount: number;
  submittedCount: number;
  /** 0-100, `assignedCount` bo'lmasa 0. */
  submissionRate: number;
  /** Faqat o'qituvchi tasdiqlagan (DONE) baholarning o'rtachasi — `null` hali baho yo'q bo'lsa. */
  averageScore: number | null;
}

// ─── Test (Quiz) ────────────────────────────────────────────────────────────
export interface QuizOption {
  id: string;
  text: string;
  /** Faqat o'qituvchi/adminga keladi — o'quvchida `undefined` (javob kaliti yashiringan). */
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  points: number;
  order: number;
  options: QuizOption[];
}

/** `GET /quizzes/` ro'yxat elementi — savollarsiz, faqat soni. */
export interface QuizSummary {
  id: string;
  courseId: string;
  lessonId: string | null;
  title: string;
  description: string;
  dueAt: string | null;
  /** Kelajakda bo'lsa, o'quvchi/ota-ona bu testni umuman ko'rmaydi (backend filtrlaydi). */
  opensAt: string | null;
  createdAt: string;
  questionCount: number;
}

/** `GET /quizzes/{id}/` — to'liq, savollari bilan. */
export interface QuizDetail extends QuizSummary {
  questions: QuizQuestion[];
}

export interface QuizAttemptAnswer {
  questionId: string;
  questionText: string;
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  isCorrect: boolean;
  /** HAR DOIM keladi — o'quvchi xato qilgan bo'lsa ham to'g'ri javobni ko'rsatadi. */
  correctOption: { id: string; text: string } | null;
}

/** `GET /quizzes/{id}/attempts/` ro'yxat elementi — javoblarsiz. */
export interface QuizAttemptSummary {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  createdAt: string;
}

/** `POST /quizzes/{id}/attempts/` javobi — darhol natija, har savol tafsiloti bilan. */
export interface QuizAttemptResult extends QuizAttemptSummary {
  answers: QuizAttemptAnswer[];
}

export interface QuizQuestionFormValues {
  text: string;
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
}

export interface QuizFormValues {
  courseId: string;
  lessonId?: string | null;
  title: string;
  description?: string;
  dueAt?: string | null;
  opensAt?: string | null;
  questions: QuizQuestionFormValues[];
}

export interface CourseHomeworkReport extends HomeworkReportSummary {
  courseId: string;
  courseTitle: string;
}

/** O'quvchining reytingi: har bir kurs bo'yicha va barcha fanlar bo'yicha yagona ko'rsatkich. */
export interface HomeworkReport {
  courses: CourseHomeworkReport[];
  overall: HomeworkReportSummary;
}

// ─── Davomat ────────────────────────────────────────────────────────────────

/** O'quvchi dars oynasidan chiqib turgan bitta oraliq. */
export interface FocusExit {
  leftAt: string;
  /** `null` — dars tugaguncha qaytmagan. */
  returnedAt: string | null;
  seconds: number;
}

/**
 * Fokus jurnali (docs/PROJECT.md §10) — ota-ona "necha marta chiqdi va
 * har safar qancha turdi" degan savolga shu yerdan javob oladi.
 */
export interface FocusJournal {
  exits: number;
  awaySeconds: number;
  longestSeconds: number;
  timeline: FocusExit[];
  /** Chegaradan oshgan — ota-onaga signal ketgan (docs/COMPLETED_WORK.md §3). */
  alert: boolean;
}

export interface AttendanceRow {
  id: string;
  lessonId: string;
  lesson: string;
  studentId: string;
  student: DomainUser;
  child: string;
  joinedAt: string | null;
  leftAt: string | null;
  entered: string;
  exited: string;
  minutes: number;
  duration: string;
  attentionTotal: number;
  attentionAnswered: number;
  focus: FocusJournal;
  status: "completed" | "active";
}
