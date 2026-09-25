/*
 * 🟡 MOBIL FARQI (DECISIONS §13): veb bu yerda toast matnlarini i18n dan
 * oladi (`useTranslation("quiz")`). Mobilda i18n hali yo'q, shuning uchun
 * matnlar literal. Mantiq, kalitlar va kesh yangilash tartibi AYNAN bir xil.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { downloadBlob } from "@/shared/lib";
import type { QuizEditValues, QuizFormValues } from "@/shared/types";
import type { QuizAttemptAnswerInput } from "../lib/quiz.mappers";
import { quizApi } from "../api/quiz.api";
import type { QuizImportRequest } from "../api/quiz.dto";

export const quizKeys = Object.freeze({
  all: ["quizzes"] as const,
  list: (courseId: string | null) => ["quizzes", "list", courseId] as const,
  detail: (id: string) => ["quizzes", "detail", id] as const,
  attempts: (id: string) => ["quizzes", "attempts", id] as const,
});

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

export function useQuizDetailLoader() {
  const client = useQueryClient();
  return (id: string) =>
    client.fetchQuery({
      queryKey: quizKeys.detail(id),
      queryFn: ({ signal }) => quizApi.getById(id, { signal }),
    });
}

export function useCreateQuiz() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: QuizFormValues) => quizApi.create(form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      toast.success("Test yaratildi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateQuiz() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: QuizEditValues }) => quizApi.update(id, values),
    onSuccess: (quiz) => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      client.setQueryData(quizKeys.detail(quiz.id), quiz);
      toast.success("Test yangilandi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useImportQuizDocx() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ file, request }: { file: File; request: QuizImportRequest }) =>
      quizApi.importDocx(file, request),
    onSuccess: (result) => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      toast.success(`${result.quiz.questions.length} ta savol topildi — tekshirib chiqing`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useImportGoogleLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      source,
      url,
      request,
    }: {
      source: "google_doc" | "google_form";
      url: string;
      request: QuizImportRequest;
    }) => quizApi.importGoogleLink(source, url, request),
    onSuccess: (result) => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      toast.success(`${result.quiz.questions.length} ta savol topildi — tekshirib chiqing`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function usePublishQuiz() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizApi.publish(id),
    onSuccess: (quiz) => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      client.setQueryData(quizKeys.detail(quiz.id), quiz);
      toast.success("Test e'lon qilindi");
    },
  });
}

export function useDownloadQuizTemplate() {
  return useMutation({
    mutationFn: ({ type, count }: { type: "docx" | "xlsx"; count: number }) =>
      quizApi.downloadTemplate(type, count).then((blob) =>
        downloadBlob(blob, `test-shabloni.${type}`)
      ),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteQuiz() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizApi.remove(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: quizKeys.all });
      toast.success("Test o'chirildi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSubmitQuizAttempt() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      quizId,
      answers,
    }: {
      quizId: string;
      answers: QuizAttemptAnswerInput[];
    }) => quizApi.submitAttempt(quizId, answers),
    onSuccess: (result) => {
      client.invalidateQueries({ queryKey: quizKeys.attempts(result.quizId) });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useQuizAttempts(quizId: string | null, enabled = true) {
  return useQuery({
    queryKey: quizKeys.attempts(quizId ?? ""),
    queryFn: ({ signal }) => quizApi.getAttempts(quizId as string, { signal }),
    enabled: Boolean(quizId) && enabled,
  });
}
