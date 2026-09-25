import { AppError } from "@/shared/api";

export function describeCreateError(error: unknown): string {
  if (error instanceof AppError && error.status === 403) {
    return "Bu amal uchun administrator tasdig‘i kerak — hisobingiz hali tasdiqlanmagan.";
  }
  return error instanceof Error ? error.message : "Xatolik yuz berdi";
}
