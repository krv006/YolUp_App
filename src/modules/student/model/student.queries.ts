import { useQuery } from "@tanstack/react-query";
import { studentApi } from "../api/student.api";

export const studentKeys = Object.freeze({ dashboard: ["student", "dashboard"] as const });

export function useStudentDashboard() {
  return useQuery({ queryKey: studentKeys.dashboard, queryFn: () => studentApi.getDashboard() });
}
