import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { mapUserDto } from "../lib/auth.mappers";

export const authKeys = Object.freeze({
  all: ["auth"] as const,
  logins: (studentId: string | null) => ["auth", "logins", studentId] as const,
  teachers: ["auth", "teachers"] as const,
  teachersPending: ["auth", "teachers", "pending"] as const,
});

/**
 * Kirishlar tarixi. `studentId` — ota-ona bolasining tarixini ko'rmoqchi bo'lganda.
 * Dialog yopiq turganda so'rov yuborilmasligi uchun `enabled` bilan boshqariladi.
 */
export function useLoginHistory(studentId: string | null = null, enabled = true) {
  return useQuery({
    queryKey: authKeys.logins(studentId),
    queryFn: ({ signal }) => authApi.getLogins(studentId, { signal }),
    enabled,
    staleTime: 30_000,
  });
}

/** Admin: barcha o'qituvchilar, reyting bilan. */
export function useTeachers() {
  return useQuery({
    queryKey: authKeys.teachers,
    queryFn: async ({ signal }) => (await authApi.getTeachers({ signal })).map(mapUserDto),
  });
}

/** Admin: hali tasdiqlanmagan o'qituvchilar. */
export function usePendingTeachers() {
  return useQuery({
    queryKey: authKeys.teachersPending,
    queryFn: async ({ signal }) => (await authApi.getPendingTeachers({ signal })).map(mapUserDto),
  });
}

export function useApproveTeacher() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authApi.approveTeacher(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: authKeys.teachers });
      client.invalidateQueries({ queryKey: authKeys.teachersPending });
      toast.success("O‘qituvchi tasdiqlandi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
