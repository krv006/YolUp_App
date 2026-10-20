/**
 * `quiz` modulining mobil barrel'i.
 *
 * Veb `src/modules/quiz/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export type { ImportedQuiz, QuizExportMode, QuizExportType } from "./api/quiz.api";
export { quizApi } from "./api/quiz.api";
export { quizEndpoints } from "./api/quiz.endpoints";
export type {
  QuizAttemptAnswerDto,
  QuizAttemptResultDto,
  QuizAttemptSummaryDto,
  QuizDto,
  QuizImportPreviewDto,
  QuizOptionDto,
  QuizQuestionDto,
  QuizSummaryDto,
} from "./api/quiz.dto";
export {
  mapQuizAttemptAnswerDto,
  mapQuizAttemptResultDto,
  mapQuizAttemptSummaryDto,
  mapAttemptAnswerRequest,
  mapQuizDto,
  mapQuizImportPreviewDto,
  quizDisplayTitle,
  toQuestionType,
  mapQuizGroupDto,
  mapQuizOptionDto,
  mapQuizQuestionDto,
  mapQuizRequest,
  mapQuizSummaryDto,
} from "./lib/quiz.mappers";
export {
  quizKeys,
  useAiQuizJobs,
  useAssignQuizToCourse,
  useCreateQuiz,
  useDeleteQuiz,
  useDownloadQuizTemplate,
  useExportQuiz,
  useImportGoogleLink,
  useImportQuizDocx,
  usePublishQuiz,
  useQuiz,
  useQuizAttempts,
  useQuizDetailLoader,
  useQuizzes,
  useRemoveGroupAudio,
  useStartAiQuiz,
  useSubmitQuizAttempt,
  useUploadGroupAudio,
  useUpdateQuiz,
} from "./model/quiz.queries";
export { blankTextForDisplay, emptyAnswer, stableShuffle } from "./lib/answer-value";
export { groupQuestions } from "./lib/group-questions";
export type { QuestionBlock } from "./lib/group-questions";
export type { QuizAttemptAnswerInput } from "./lib/quiz.mappers";
export { quizErrorMessage } from "./lib/quiz-errors";

// --- Mobil UI ---
export { QuestionAnswerInput } from "./ui/question-answer-input";
export type { QuestionAnswerInputProps } from "./ui/question-answer-input";
export { AddQuizSheet } from "./ui/add-quiz-sheet";
export type { AddQuizSheetProps } from "./ui/add-quiz-sheet";
export { ImportResultSheet } from "./ui/import-result-sheet";
export type { ImportResultSheetProps } from "./ui/import-result-sheet";

export { QuizPreviewSheet } from "./ui/quiz-preview-sheet";
export type { QuizPreviewSheetProps } from "./ui/quiz-preview-sheet";
export { Choice } from "./ui/question-answer-input";
export { SubjectFilterSheet } from "./ui/subject-filter-sheet";
export type { SubjectFilterSheetProps } from "./ui/subject-filter-sheet";
export { AssignQuizSheet } from "./ui/assign-quiz-sheet";
export type { AssignQuizSheetProps } from "./ui/assign-quiz-sheet";
export { QuizExportSheet } from "./ui/quiz-export-sheet";
export type { QuizExportSheetProps } from "./ui/quiz-export-sheet";
export { QuizAttemptsSheet } from "./ui/quiz-attempts-sheet";
export type { QuizAttemptsSheetProps } from "./ui/quiz-attempts-sheet";
