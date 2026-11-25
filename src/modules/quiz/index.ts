/**
 * `quiz` modulining mobil barrel'i.
 *
 * Veb `src/modules/quiz/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { copiesBySource } from "./lib/quiz-copies";
export { AI_MATERIAL_ACCEPT, AI_MATERIAL_MAX_FILES, checkAiMaterials } from "./lib/ai-material";
export {
  AI_DEFAULT_QUESTIONS,
  AI_EXAM_FORMATS,
  AI_MAX_QUESTIONS,
  AI_MIN_QUESTIONS,
  aiJobStep,
  checkAiForm,
  isAiJobActive,
} from "./lib/ai-form";
export {
  QUESTION_IMAGE_ACCEPT,
  QUESTION_IMAGE_MAX_MB,
  checkQuestionImage,
  pickImageFile,
} from "./lib/question-image";
export {
  cloneDraft,
  createBlankDrafts,
  draftStatus,
  insertAfter,
  insertDraft,
  moveDraft,
  retypeDrafts,
  summarizeDrafts,
} from "./lib/bulk-draft";
export type { DraftState, DraftStatus } from "./lib/bulk-draft";
export { applySuggestions, needsAnswer, unansweredCount } from "./lib/answer-suggestions";
export type { AnswerSuggestion, AnswerSuggestionResult, SuggestionConfidence } from "./lib/answer-suggestions";
export type { AiMaterialProblem } from "./lib/ai-material";
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
  QuizAssignInput,
  QuizAudience,
  QuizAudienceStudent,
} from "./api/quiz.dto";
export type { AiQuizJob, AiQuizRequest, AiQuizStandard } from "./api/quiz.dto";
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
  mapQuizAudienceDto,
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
  useQuizDraft,
  useShareQuizResults,
  useGenerateQuizFromBank,
  useQuizDetailLoader,
  useQuizQuestionStats,
  useQuizzes,
  useRemoveGroupAudio,
  useStartAiMiniQuiz,
  useStartAiQuiz,
  useSubmitQuizAttempt,
  useUploadGroupAudio,
  useUpdateQuiz,
  useStartQuiz,
  useQuizAudience,
  useSetQuizAudience,
  useImportQuizText,
  useSuggestQuizAnswers,
  useUploadQuestionImage,
} from "./model/quiz.queries";
export { useQuizLimitsText } from "./model/use-quiz-limits-text";
export { useQuizCountdown } from "./model/use-quiz-countdown";
export { useQuizSessionsLeft } from "./model/use-quiz-sessions";
export { formatCountdown } from "./lib/countdown";
export { usePaidTestGate } from "./model/use-paid-test-gate";
export { blankTextForDisplay, emptyAnswer, stableShuffle } from "./lib/answer-value";
export { groupQuestions } from "./lib/group-questions";
export {
  DEFAULT_POINTS,
  MAX_OPTIONS,
  MAX_POINTS,
  MIN_POINTS,
  QUESTION_TYPE_ORDER,
  changeDraftType,
  createDraft,
  draftToFormValues,
  draftToStudentQuestion,
  hasDraftContent,
  optionLetter,
  questionToDraft,
  validateDraft,
} from "./lib/question-draft";
export type { DraftError, GroupDraft, KeyFactory, QuestionDraft } from "./lib/question-draft";
export type { QuestionBlock } from "./lib/group-questions";
export type { QuizAttemptAnswerInput } from "./lib/quiz.mappers";
export { quizErrorMessage } from "./lib/quiz-errors";

// --- Mobil UI ---
export { QuestionAnswerInput, QuestionPrompt } from "./ui/question-answer-input";
export { QuizGroupPanel } from "./ui/quiz-group-panel";
export { MathText } from "./ui/math-text";
export type { MathTextProps } from "./ui/math-text";
export type { QuizGroupPanelProps } from "./ui/quiz-group-panel";
export type { QuestionAnswerInputProps } from "./ui/question-answer-input";

export { Choice } from "./ui/question-answer-input";
export { QuizAttemptsSheet } from "./ui/quiz-attempts-sheet";
export type { QuizAttemptsSheetProps } from "./ui/quiz-attempts-sheet";
export { AssignQuizDialog } from "./ui/assign-quiz-dialog";
export type { AssignQuizDialogProps } from "./ui/assign-quiz-dialog";
export { QuizAttemptsDrawer } from "./ui/quiz-attempts-drawer";
export type { QuizAttemptsDrawerProps } from "./ui/quiz-attempts-drawer";
export { QuizExportDialog } from "./ui/quiz-export-dialog";
export type { QuizExportDialogProps } from "./ui/quiz-export-dialog";
export { QuizImportDialog } from "./ui/quiz-import-dialog";
export type { QuizImportDialogProps } from "./ui/quiz-import-dialog";
export type { QuizImportSource } from "./ui/quiz-import-dialog";
export { QuizAudienceCard } from "./ui/quiz-audience-card";
export type { QuizAudienceCardProps } from "./ui/quiz-audience-card";
export { PaidTestDialog } from "./ui/paid-test-dialog";
export type { PaidTestDialogProps } from "./ui/paid-test-dialog";
export { AddQuizDialog } from "./ui/quiz-create-dialog";
export type { AddQuizDialogProps } from "./ui/quiz-create-dialog";
export { QuizPreview } from "./ui/quiz-preview";
export type { QuizPreviewProps } from "./ui/quiz-preview";
export { QuestionEditor } from "./ui/question-editor";
export type { QuestionEditorProps } from "./ui/question-editor";
export { QuestionGroupEditor } from "./ui/question-group-editor";
export type { QuestionGroupEditorProps } from "./ui/question-group-editor";
export { QUIZ_RADIUS, useQuizColors } from "./ui/quiz-colors";
