/*
 * 🟡 MOBIL FARQI (DECISIONS §13): veb bu yerda toast matnlarini i18n dan
 * oladi (`useTranslation("mocktest")`). Mobilda i18n hali yo'q, shuning
 * uchun matnlar literal. Mantiq, kalitlar va kesh yangilash tartibi
 * AYNAN bir xil.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mockTestApi } from "../api/mock-test.api";
import type { MockSubmitInput, MockTestFormValues } from "../api/mock-test.dto";

export const mockTestKeys = Object.freeze({
  all: ["mock-tests"] as const,
  list: ["mock-tests", "list"] as const,
  detail: (id: string) => ["mock-tests", "detail", id] as const,
});

export function useMockTests(enabled = true) {
  return useQuery({
    queryKey: mockTestKeys.list,
    queryFn: ({ signal }) => mockTestApi.getAll({ signal, query: { page_size: 100 } }),
    select: (page) => page.items,
    enabled,
  });
}

export function useMockTest(id: string | null) {
  return useQuery({
    queryKey: mockTestKeys.detail(id ?? ""),
    queryFn: ({ signal }) => mockTestApi.getOne(id as string, { signal }),
    enabled: Boolean(id),
  });
}

export function useCreateMockTest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: MockTestFormValues) => mockTestApi.create(form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: mockTestKeys.all });
      toast.success("Mock test yaratildi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteMockTest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockTestApi.remove(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: mockTestKeys.all });
      toast.success("Mock test o'chirildi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useStartMockTest() {
  return useMutation({
    mutationFn: (id: string) => mockTestApi.start(id),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSubmitMockTest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, attemptId, payload }: { id: string; attemptId: string; payload: MockSubmitInput }) =>
      mockTestApi.submit(id, attemptId, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: mockTestKeys.all }),
    onError: (error: Error) => toast.error(error.message),
  });
}
