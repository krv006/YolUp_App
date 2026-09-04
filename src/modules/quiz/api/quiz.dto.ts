export interface QuizOptionDto {
  id: string | number;
  text: string;
  /** Faqat o'qituvchi/adminga keladi. */
  is_correct?: boolean;
  order?: number;
}

export interface QuizQuestionDto {
  id: string | number;
  text: string;
  points: number;
  order: number;
  options: QuizOptionDto[];
}

export interface QuizSummaryDto {
  id: string | number;
  course: string | number;
  lesson: string | number | null;
  title: string;
  description?: string;
  due_at: string | null;
  opens_at: string | null;
  question_count: number;
  created_at: string;
}

export interface QuizDto extends QuizSummaryDto {
  questions: QuizQuestionDto[];
}

export interface QuizAttemptAnswerDto {
  question: string | number;
  question_text: string;
  selected_option: string | number | null;
  selected_option_text: string | null;
  is_correct: boolean;
  correct_option: { id: string | number; text: string } | null;
}

export interface QuizAttemptSummaryDto {
  id: string | number;
  quiz: string | number;
  student: string | number;
  student_name: string;
  score: number;
  max_score: number;
  created_at: string;
}

export interface QuizAttemptResultDto extends QuizAttemptSummaryDto {
  answers: QuizAttemptAnswerDto[];
}
