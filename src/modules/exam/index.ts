export { examApi } from "./api/exam.api";
export { examEndpoints } from "./api/exam.endpoints";
export type { ExamFormValues, ExamTemplateFormValues } from "./api/exam.dto";
export {
  examKeys,
  useCreateExam,
  useCreateExamTemplate,
  useDeleteExam,
  useDeleteExamTemplate,
  useExam,
  useExamCurrent,
  useExamResults,
  useExamStudentResult,
  useExamTemplates,
  useExams,
  useFinishExam,
  useExamReminder,
  useExamResultPdf,
  useExamMistakesPractice,
  useSaveExamAnswers,
  useSaveManualScores,
  useShareExamResults,
  useNextExamSection,
  useRecordExamFocus,
  useRequestWritingAi,
  useUpdateExam,
} from "./model/exam.queries";
export { formatClock, secondsUntil, serverNow, syncServerTime } from "./lib/server-time";
export {
  templateToForm,
  templateTotalMinutes,
  validateTemplate,
  type TemplateItemDraft,
} from "./lib/template-draft";

// --- Mobil UI ---
export {
  ExamCountdown,
  ExamCreateDialog,
  ExamListeningPlayer,
  ExamRunner,
  ExamResultCard,
  ExamReview,
  ExamScoreDialog,
  ExamWritingAiPanel,
  ExamTemplateDialog,
  ExamTimer,
} from "./ui";
export type {
  ExamCreateDialogProps,
  ExamScoreDialogProps,
  ExamTemplateDialogProps,
  ExamTimerProps,
} from "./ui";
