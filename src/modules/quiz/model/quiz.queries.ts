import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { QuizFormValues } from "@/shared/types";
import { quizApi } from "../api/quiz.api";

export const quizKeys = Object.freeze({
  all: ["quizzes"] as const,
  list: (courseId: string | null) => ["quizzes", "list", courseId] as const,
  detail: (id: string) => ["quizzes", "detail", id] as const,
  attempts: (id: string) => ["quizzes", "attempts", id] as const,
});

/** `courseId: null` — foydalanuvchining BARCHA kurslaridagi testlari (rolga qarab backend filtrlaydi). */
export function useQuizzes(courseId: string | null, enabled = true) {
  return useQuery({
    queryKey: quizKeys.list(courseId),
    queryFn: ({ signal }) => quizApi.getAll(courseId, { signal }),
    enabled,
  });
}

export function useQuiz(id: string | null) {
  return useQuery({
    queryKey: quizKeys.detail(id ?? ""),
    queryFn: ({ signal }) => quizApi.getById(id as string, { signal }),
    enabled: Boolean(id),
  });
}

export function useCreateQuiz() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: QuizFormValues) => quizApi.create(form),
    onSuccess: (quiz) => {
      client.invalidateQueries({ queryKey: quizKeys.list(quiz.courseId) });
      toast.success("Test yaratildi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteQuiz() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizApi.remove(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      toast.success("Test o‘chirildi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Natija darhol keladi — polling shart emas (AI kutish yo'q). */
export function useSubmitQuizAttempt() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      quizId,
      answers,
    }: {
      quizId: string;
      answers: Array<{ questionId: string; selectedOptionId: string | null }>;
    }) => quizApi.submitAttempt(quizId, answers),
    onSuccess: (result) => {
      client.invalidateQueries({ queryKey: quizKeys.attempts(result.quizId) });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** O'quvchi faqat o'zinikini, o'qituvchi/admin/ota-ona barchasini ko'radi (backend cheklaydi). */
export function useQuizAttempts(quizId: string | null, enabled = true) {
  return useQuery({
    queryKey: quizKeys.attempts(quizId ?? ""),
    queryFn: ({ signal }) => quizApi.getAttempts(quizId as string, { signal }),
    enabled: Boolean(quizId) && enabled,
  });
}
