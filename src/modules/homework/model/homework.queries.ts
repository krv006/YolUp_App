import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { downloadBlob } from "@/shared/lib";
import type { Submission } from "@/shared/types";
import { homeworkApi } from "../api/homework.api";
import type { AssignmentFormInput, SubmissionReviewInput } from "../api/homework.dto";

const POLL_INTERVAL_MS = 2500;
const DEFAULT_MAX_POLLING_MS = 5 * 60_000;

export const homeworkKeys = Object.freeze({
  all: ["homework"] as const,
  assignments: (courseId: string | null) => ["homework", "assignments", courseId] as const,
  assignment: (id: string) => ["homework", "assignment", id] as const,
  submission: (id: string) => ["homework", "submission", id] as const,
  report: (studentId?: string | null) => ["homework", "report", studentId ?? "me"] as const,
});

/** AI tekshiruvi `checking` holatida ekan polling davom etadi, ammo cheklangan vaqt ichida. */
export function getHomeworkPollingInterval(
  submission: Submission | undefined,
  elapsedMs: number,
  maxPollingMs: number
): number | false {
  return submission?.status === "checking" && elapsedMs < maxPollingMs ? POLL_INTERVAL_MS : false;
}

export function useAssignments(courseId: string | null, enabled = true) {
  return useQuery({
    queryKey: homeworkKeys.assignments(courseId),
    queryFn: ({ signal }) => homeworkApi.getAssignments(courseId, { signal }),
    enabled: Boolean(courseId) && enabled,
  });
}

export function useAssignment(id: string | null | undefined) {
  return useQuery({
    queryKey: homeworkKeys.assignment(id ?? ""),
    queryFn: ({ signal }) => homeworkApi.getAssignment(id as string, { signal }),
    enabled: Boolean(id),
  });
}

export interface UseSubmissionOptions {
  poll?: boolean;
  maxPollingMs?: number;
}

export function useSubmission(
  id: string | null | undefined,
  { poll = true, maxPollingMs = DEFAULT_MAX_POLLING_MS }: UseSubmissionOptions = {}
) {
  const [startedAt] = useState(Date.now);
  return useQuery({
    queryKey: homeworkKeys.submission(id ?? ""),
    queryFn: ({ signal }) => homeworkApi.getSubmission(id as string, { signal }),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      poll
        ? getHomeworkPollingInterval(
            query.state.data ?? undefined,
            Date.now() - startedAt,
            maxPollingMs
          )
        : false,
    refetchOnWindowFocus: true,
  });
}

/**
 * O'quvchining reytingi. `studentId` berilmasa backend joriy foydalanuvchini
 * oladi (o'quvchi o'zinikini ko'radi); ota-ona bog'langan bolasi uchun
 * `enabled` odatda `selectedChildId` borligiga qarab beriladi.
 */
export function useHomeworkReport(studentId?: string | null, enabled = true) {
  return useQuery({
    queryKey: homeworkKeys.report(studentId),
    queryFn: ({ signal }) => homeworkApi.getReport(studentId, { signal }),
    enabled,
  });
}

export function useCreateAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: AssignmentFormInput) => homeworkApi.createAssignment(form),
    onSuccess: (item) => {
      client.invalidateQueries({ queryKey: homeworkKeys.assignments(item.courseId) });
      toast.success("Vazifa yuborildi");
    },
  });
}

export function useSubmitHomework() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      file,
      skillKey,
    }: {
      assignmentId: string;
      file: File | null;
      skillKey?: string;
    }) => homeworkApi.submit(assignmentId, file, skillKey),
    onSuccess: (submission) => {
      if (submission) client.setQueryData(homeworkKeys.submission(submission.id), submission);
      client.invalidateQueries({ queryKey: homeworkKeys.all });
      toast.success("Vazifa topshirildi, AI tekshiruvi boshlandi");
    },
  });
}

export function useDeleteAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homeworkApi.deleteAssignment(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: homeworkKeys.all });
      toast.success("Vazifa o‘chirildi");
    },
  });
}

export function useRecheckSubmission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homeworkApi.recheck(id),
    onSuccess: (submission) => {
      if (submission) client.setQueryData(homeworkKeys.submission(submission.id), submission);
      client.invalidateQueries({ queryKey: homeworkKeys.all });
      toast.success("Qayta tekshirish boshlandi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/**
 * O‘qituvchi AI bahosini tuzatadi.
 *
 * Javob — yangilangan topshiriq, shuning uchun keshga to‘g‘ridan-to‘g‘ri
 * yoziladi: oyna qayta so‘rov kutmasdan yangi bahoni ko‘rsatadi.
 */
export function useReviewSubmission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubmissionReviewInput }) =>
      homeworkApi.review(id, input),
    onSuccess: (submission) => {
      if (submission) client.setQueryData(homeworkKeys.submission(submission.id), submission);
      client.invalidateQueries({ queryKey: homeworkKeys.all });
      toast.success("Baho yangilandi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// Fayllar auth talab qiladi — to‘g‘ridan-to‘g‘ri /media/ URL ishlatilmaydi
// (docs/README §Frontend integratsiyasi).
export function useDownloadAssignmentFile() {
  return useMutation({
    mutationFn: async ({ id, fileName }: { id: string; fileName?: string }) =>
      downloadBlob(await homeworkApi.downloadAssignment(id), fileName),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDownloadSubmissionFile() {
  return useMutation({
    mutationFn: async ({ id, fileName }: { id: string; fileName?: string }) =>
      downloadBlob(await homeworkApi.downloadSubmission(id), fileName),
    onError: (error: Error) => toast.error(error.message),
  });
}
