import { AppError } from "@/shared/api";

/**
 * Admin hali tasdiqlamagan (`is_approved: false`) o'qituvchi kurs/dars kabi
 * amallarni bajarmoqchi bo'lsa backend `403` qaytaradi — bu xabar shuni
 * boshqa server xatolaridan ajratib ko'rsatadi.
 */
export function describeCreateError(error: unknown): string {
  if (error instanceof AppError && error.status === 403) {
    return "Bu amal uchun administrator tasdig‘i kerak — hisobingiz hali tasdiqlanmagan.";
  }
  return error instanceof Error ? error.message : "Xatolik yuz berdi";
}
