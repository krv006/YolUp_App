import { AppError, API_ERROR_CODES } from "@/shared/api";
import {
  ASSIGNMENT_EXTENSIONS,
  HOMEWORK_EXTENSIONS,
  HOMEWORK_MAX_FILE_SIZE,
} from "../constants/homework.constants";

const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "ogg"];

export interface ValidateHomeworkFileOptions {
  /** O‘qituvchi biriktiradigan fayl — boshqa kengaytmalar ro‘yxati. */
  assignment?: boolean;
  /** Speaking vazifasi — audio ham qabul qilinadi. */
  speaking?: boolean;
}

export function validateHomeworkFile(
  file: File | null | undefined,
  { assignment = false, speaking = false }: ValidateHomeworkFileOptions = {}
): true {
  if (!file) {
    throw new AppError({
      code: API_ERROR_CODES.VALIDATION_ERROR,
      message: "Faylni tanlang",
      fields: { file: "Fayl majburiy" },
    });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowed: readonly string[] = assignment ? ASSIGNMENT_EXTENSIONS : HOMEWORK_EXTENSIONS;

  if (!allowed.includes(extension)) {
    throw new AppError({
      code: API_ERROR_CODES.VALIDATION_ERROR,
      message: "Fayl turi qo‘llab-quvvatlanmaydi",
      fields: { file: "Mumkin: " + allowed.join(", ") },
    });
  }

  if (AUDIO_EXTENSIONS.includes(extension) && !speaking) {
    throw new AppError({
      code: API_ERROR_CODES.VALIDATION_ERROR,
      message: "Audio faqat Speaking vazifasi uchun",
    });
  }

  if (file.size > HOMEWORK_MAX_FILE_SIZE) {
    throw new AppError({ code: API_ERROR_CODES.FILE_TOO_LARGE, message: "Fayl 25 MB dan katta" });
  }

  return true;
}
