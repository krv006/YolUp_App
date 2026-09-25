/**
 * `quiz` modulining mobil barrel'i.
 *
 * Veb `src/modules/quiz/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export type { ImportedQuiz } from "./api/quiz.api";
export { quizApi } from "./api/quiz.api";
export { quizEndpoints } from "./api/quiz.endpoints";
export type {
  QuizAttemptAnswerDto,
  QuizAttemptResultDto,
  QuizAttemptSummaryDto,
  QuizDto,
  QuizOptionDto,
  QuizQuestionDto,
  QuizSummaryDto,
} from "./api/quiz.dto";
export {
  mapQuizAttemptAnswerDto,
  mapQuizAttemptResultDto,
  mapQuizAttemptSummaryDto,
  mapQuizDto,
  mapQuizOptionDto,
  mapQuizQuestionDto,
  mapQuizRequest,
  mapQuizSummaryDto,
} from "./lib/quiz.mappers";
export {
  quizKeys,
  useCreateQuiz,
  useDeleteQuiz,
  useDownloadQuizTemplate,
  useImportGoogleLink,
  useImportQuizDocx,
  usePublishQuiz,
  useQuiz,
  useQuizAttempts,
  useQuizDetailLoader,
  useQuizzes,
  useSubmitQuizAttempt,
  useUpdateQuiz,
} from "./model/quiz.queries";
export { blankTextForDisplay, emptyAnswer, stableShuffle } from "./lib/answer-value";
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
