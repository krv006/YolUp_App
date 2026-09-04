import type {
  QuizAttemptAnswer,
  QuizAttemptResult,
  QuizAttemptSummary,
  QuizDetail,
  QuizFormValues,
  QuizOption,
  QuizQuestion,
  QuizSummary,
} from "@/shared/types";
import type {
  QuizAttemptAnswerDto,
  QuizAttemptResultDto,
  QuizAttemptSummaryDto,
  QuizDto,
  QuizOptionDto,
  QuizQuestionDto,
  QuizSummaryDto,
} from "../api/quiz.dto";

export function mapQuizOptionDto(dto: QuizOptionDto): QuizOption {
  return { id: String(dto.id), text: dto.text, isCorrect: dto.is_correct };
}

export function mapQuizQuestionDto(dto: QuizQuestionDto): QuizQuestion {
  return {
    id: String(dto.id),
    text: dto.text,
    points: dto.points,
    order: dto.order,
    options: (dto.options ?? []).map(mapQuizOptionDto),
  };
}

export function mapQuizSummaryDto(dto: QuizSummaryDto): QuizSummary {
  return {
    id: String(dto.id),
    courseId: String(dto.course),
    lessonId: dto.lesson == null ? null : String(dto.lesson),
    title: dto.title,
    description: dto.description || "",
    dueAt: dto.due_at,
    opensAt: dto.opens_at,
    createdAt: dto.created_at,
    questionCount: dto.question_count,
  };
}

export function mapQuizDto(dto: QuizDto): QuizDetail {
  return {
    ...mapQuizSummaryDto(dto),
    questions: (dto.questions ?? []).map(mapQuizQuestionDto),
  };
}

export function mapQuizAttemptAnswerDto(dto: QuizAttemptAnswerDto): QuizAttemptAnswer {
  return {
    questionId: String(dto.question),
    questionText: dto.question_text,
    selectedOptionId: dto.selected_option == null ? null : String(dto.selected_option),
    selectedOptionText: dto.selected_option_text,
    isCorrect: dto.is_correct,
    correctOption: dto.correct_option
      ? { id: String(dto.correct_option.id), text: dto.correct_option.text }
      : null,
  };
}

export function mapQuizAttemptSummaryDto(dto: QuizAttemptSummaryDto): QuizAttemptSummary {
  return {
    id: String(dto.id),
    quizId: String(dto.quiz),
    studentId: String(dto.student),
    studentName: dto.student_name,
    score: dto.score,
    maxScore: dto.max_score,
    createdAt: dto.created_at,
  };
}

export function mapQuizAttemptResultDto(dto: QuizAttemptResultDto): QuizAttemptResult {
  return {
    ...mapQuizAttemptSummaryDto(dto),
    answers: (dto.answers ?? []).map(mapQuizAttemptAnswerDto),
  };
}

/** `POST /quizzes/` uchun JSON body — bo'sh `lesson`/sanalar `null` sifatida yuboriladi. */
export function mapQuizRequest(form: QuizFormValues): Record<string, unknown> {
  return {
    course: form.courseId,
    lesson: form.lessonId || null,
    title: form.title,
    description: form.description || "",
    due_at: form.dueAt || null,
    opens_at: form.opensAt || null,
    questions: form.questions.map((question) => ({
      text: question.text,
      points: question.points,
      options: question.options.map((option) => ({
        text: option.text,
        is_correct: option.isCorrect,
      })),
    })),
  };
}

/** `POST /quizzes/{id}/attempts/` uchun JSON body. */
export function mapQuizAttemptRequest(
  answers: Array<{ questionId: string; selectedOptionId: string | null }>
): Record<string, unknown> {
  return {
    answers: answers.map((answer) => ({
      question: answer.questionId,
      selected_option: answer.selectedOptionId,
    })),
  };
}
