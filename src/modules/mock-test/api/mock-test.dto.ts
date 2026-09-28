export interface MockTestSummary {
  id: string;
  courseId: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  sectionCount: number;
  createdAt: string;
}

export interface MockTestSection {
  order: number;
  quizId: string;
  quizTitle: string;
  questionCount: number;
}

export interface MockTestDetail extends MockTestSummary {
  sections: MockTestSection[];
}

export interface MockAttemptOption {
  id: string;
  text: string;
}

export interface MockAttemptQuestion {
  id: string;
  text: string;
  points: number;
  options: MockAttemptOption[];
}

export interface MockAttemptSection {
  order: number;
  quizId: string;
  quizTitle: string;
  questions: MockAttemptQuestion[];
}

export interface MockAttempt {
  id: string;
  mockTestId: string;
  startedAt: string;
  deadline: string;
  sections: MockAttemptSection[];
}

export interface MockAttemptResult {
  id: string;
  mockTestId: string;
  startedAt: string;
  submittedAt: string;
  totalScore: number;
  totalMaxScore: number;
}

export interface MockSubmitInput {
  sections: Array<{
    quiz: string;
    answers: Array<{ question: string; selected_option: string }>;
  }>;
}

export interface MockTestFormValues {
  courseId: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  quizIds: string[];
}
