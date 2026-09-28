import { normalizePagination, type Page, type PaginationOptions } from "@/shared/api";
import type {
  MockAttempt,
  MockAttemptResult,
  MockAttemptSection,
  MockTestDetail,
  MockTestFormValues,
  MockTestSummary,
} from "../api/mock-test.dto";

type Raw = Record<string, unknown>;

function mapSummary(dto: Raw): MockTestSummary {
  return {
    id: String(dto.id),
    courseId: String(dto.course ?? ""),
    title: String(dto.title ?? ""),
    description: String(dto.description ?? ""),
    timeLimitMinutes: Number(dto.time_limit_minutes ?? 0),
    sectionCount: Number(dto.section_count ?? (dto.sections as unknown[])?.length ?? 0),
    createdAt: String(dto.created_at ?? ""),
  };
}

export function mapMockTestPage(dto: unknown, options?: PaginationOptions): Page<MockTestSummary> {
  const page = normalizePagination<Raw>(dto, options);
  return { ...page, items: page.items.map(mapSummary) };
}

export function mapMockTestDetail(dto: unknown): MockTestDetail {
  const raw = (dto ?? {}) as Raw;
  return {
    ...mapSummary(raw),
    sections: ((raw.sections as Raw[]) ?? []).map((section) => ({
      order: Number(section.order ?? 0),
      quizId: String(section.quiz_id ?? ""),
      quizTitle: String(section.quiz_title ?? ""),
      questionCount: Number(section.question_count ?? 0),
    })),
  };
}

function mapAttemptSection(section: Raw): MockAttemptSection {
  const quiz = (section.quiz ?? {}) as Raw;
  return {
    order: Number(section.order ?? 0),
    quizId: String(quiz.id ?? section.quiz ?? ""),
    quizTitle: String(quiz.title ?? ""),
    questions: ((quiz.questions as Raw[]) ?? []).map((question) => ({
      id: String(question.id),
      text: String(question.text ?? ""),
      points: Number(question.points ?? 1),
      options: ((question.options as Raw[]) ?? []).map((option) => ({
        id: String(option.id),
        text: String(option.text ?? ""),
      })),
    })),
  };
}

export function mapMockAttempt(dto: unknown): MockAttempt {
  const raw = (dto ?? {}) as Raw;
  return {
    id: String(raw.id),
    mockTestId: String(raw.mock_test ?? ""),
    startedAt: String(raw.started_at ?? ""),
    deadline: String(raw.deadline ?? ""),
    sections: ((raw.sections as Raw[]) ?? []).map(mapAttemptSection),
  };
}

export function mapMockAttemptResult(dto: unknown): MockAttemptResult {
  const raw = (dto ?? {}) as Raw;
  return {
    id: String(raw.id),
    mockTestId: String(raw.mock_test ?? ""),
    startedAt: String(raw.started_at ?? ""),
    submittedAt: String(raw.submitted_at ?? ""),
    totalScore: Number(raw.total_score ?? 0),
    totalMaxScore: Number(raw.total_max_score ?? 0),
  };
}

export function mapMockTestRequest(form: MockTestFormValues): Record<string, unknown> {
  return {
    course: form.courseId,
    title: form.title.trim(),
    description: form.description.trim(),
    time_limit_minutes: form.timeLimitMinutes,
    quizzes: form.quizIds,
  };
}
