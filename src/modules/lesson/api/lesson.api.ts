import { API_ERROR_CODES, apiClient, AppError, type RequestOptions } from "@/shared/api";
import type { Lesson } from "@/shared/types";
import { lessonEndpoints } from "./lesson.endpoints";
import type {
  LessonDto,
  LessonFormInput,
  LessonRatingDto,
  LessonRatingInput,
  LessonRecordingDto,
  LessonScheduleRequestDto,
  LessonScheduleResponseDto,
} from "./lesson.dto";
import {
  mapLessonDto,
  mapLessonPage,
  mapLessonRatingDto,
  mapLessonRatingList,
  mapLessonRatingRequest,
  mapLessonRecordingDto,
  mapLessonRequest,
} from "../lib/lesson.mappers";

/**
 * Baholash API hali barcha muhitlarga chiqarilmagan — o'sha yerda Django
 * marshrutni topa olmaydi va HTML 404 qaytaradi. Bu server xatosi emas,
 * shuning uchun UI baholashni butunlay yashiradi.
 */
function isMissingRatingApi(error: unknown): boolean {
  return (
    error instanceof AppError &&
    (error.status === 404 || error.code === API_ERROR_CODES.NOT_FOUND)
  );
}

export const lessonApi = {
  async getAll(options: RequestOptions = {}) {
    return mapLessonPage(await apiClient.get(lessonEndpoints.list, options), options.query);
  },
  async getById(id: string, options?: RequestOptions) {
    return mapLessonDto(await apiClient.get<LessonDto>(lessonEndpoints.detail(id), options));
  },
  async create(form: LessonFormInput) {
    return mapLessonDto(await apiClient.post<LessonDto>(lessonEndpoints.list, mapLessonRequest(form)));
  },
  async update(id: string, form: LessonFormInput) {
    return mapLessonDto(await apiClient.patch<LessonDto>(lessonEndpoints.detail(id), mapLessonRequest(form)));
  },
  /**
   * Takrorlanuvchi jadval — har sana uchun alohida `POST /lessons/`.
   *
   * Backendda ommaviy yaratish endpointi yo'q, shuning uchun so'rovlar shu
   * yerdan yuboriladi. Ular 4 tadan guruhlanadi: 40 ta darsni ketma-ket
   * yuborish ~16 soniya olardi, hammasini birdan yuborish esa serverni
   * keraksiz yuklaydi.
   *
   * Amal ATOMIK EMAS — bir nechtasi muvaffaqiyatsiz bo'lsa, qolganlari
   * yaratilgan holicha qoladi, shuning uchun natijada xatolar ham qaytadi.
   */
  /**
   * Haftalik jadval — server tomonda (docs/STAFF_API.md §2).
   *
   * Server amalni atomik bajaradi va o'qituvchining BARCHA kurslari bo'yicha
   * vaqt to'qnashuvini tekshiradi — bu mijoz tomonida umuman imkonsiz, chunki
   * `GET /lessons/` boshqa o'qituvchining darslarini ko'rsatmaydi.
   *
   * Endpoint hali barcha muhitlarga chiqarilmagan: 404 kelsa, chaqiruvchi
   * eski (mijoz tomonidagi) usulga qaytadi, shuning uchun `null` qaytariladi.
   */
  async createSchedule(
    courseId: string,
    payload: LessonScheduleRequestDto
  ): Promise<{ count: number; lessons: Lesson[] } | null> {
    try {
      const dto = await apiClient.post<LessonScheduleResponseDto>(
        lessonEndpoints.schedule(courseId),
        payload
      );
      const lessons = (dto?.lessons ?? []).map(mapLessonDto);
      return { count: Number(dto?.count ?? lessons.length), lessons };
    } catch (error) {
      if (error instanceof AppError && error.status === 404) return null;
      throw error;
    }
  },
  async createMany(dates: readonly string[], form: LessonFormInput) {
    const created: Lesson[] = [];
    const failed: Array<{ date: string; message: string }> = [];
    const CHUNK = 4;

    for (let index = 0; index < dates.length; index += CHUNK) {
      const chunk = dates.slice(index, index + CHUNK);
      const results = await Promise.allSettled(
        chunk.map((date) =>
          apiClient
            .post<LessonDto>(lessonEndpoints.list, mapLessonRequest({ ...form, date }))
            .then(mapLessonDto)
        )
      );
      results.forEach((result, offset) => {
        if (result.status === "fulfilled") created.push(result.value);
        else
          failed.push({
            date: chunk[offset],
            message: result.reason instanceof Error ? result.reason.message : "Xatolik",
          });
      });
    }

    return { created, failed };
  },
  async remove(id: string) {
    await apiClient.delete(lessonEndpoints.detail(id));
    return id;
  },
  /** `recordingTitle` — o'qituvchi video yozuvga beradigan nom (bo'sh bo'lsa dars nomi olinadi). */
  async finish(id: string, recordingTitle?: string) {
    const title = recordingTitle?.trim();
    return mapLessonDto(
      await apiClient.post<LessonDto>(
        lessonEndpoints.finish(id),
        title ? { recording_title: title } : {}
      )
    );
  },
  /** Yozuv yo'q bo'lsa backend 404 qaytaradi — bu xato emas, shunchaki `null`. */
  async getRecording(id: string, options?: RequestOptions) {
    try {
      const dto = await apiClient.get<LessonRecordingDto>(lessonEndpoints.recording(id), options);
      return mapLessonRecordingDto(dto);
    } catch (error) {
      if (error instanceof AppError && error.status === 404) return null;
      if (error instanceof AppError && error.code === API_ERROR_CODES.NOT_FOUND) return null;
      throw error;
    }
  },
  async removeRecording(id: string) {
    await apiClient.delete(lessonEndpoints.recording(id));
    return id;
  },
  async uploadRecordingAudio(id: string, chunk: Blob, startedAt?: string) {
    const formData = new FormData();
    formData.append("chunk", chunk, `lesson-${id}-${Date.now()}.webm`);
    if (startedAt) formData.append("started_at", startedAt);
    await apiClient.post<void>(lessonEndpoints.recordingAudio(id), formData, {
      // 10 MB gacha bo‘lgan chunk sekin tarmoqda standart so‘rovdan uzoqroq ketishi mumkin.
      timeoutMs: 60_000,
    });
  },
  async finalizeRecordingAudio(id: string) {
    await apiClient.post<void>(lessonEndpoints.finalizeRecordingAudio(id));
  },
  async uploadRecordingVideo(id: string, chunk: Blob, startedAt?: string) {
    const formData = new FormData();
    formData.append("chunk", chunk, `lesson-${id}-${Date.now()}.webm`);
    if (startedAt) formData.append("started_at", startedAt);
    await apiClient.post<void>(lessonEndpoints.recordingVideo(id), formData, {
      // Video bo‘lagi (50 MB gacha) audio bo‘lagidan sezilarli katta bo‘lishi mumkin.
      timeoutMs: 120_000,
    });
  },
  async finalizeRecordingVideo(id: string) {
    await apiClient.post<void>(lessonEndpoints.finalizeRecordingVideo(id));
  },
  /**
   * Dars bahosi. Backend faqat tugagan darsni va faqat shu kursga yozilgan
   * o'quvchini qabul qiladi — qolgan hollarda 400/403 keladi va xabar formada
   * ko'rsatiladi.
   */
  async rate(id: string, input: LessonRatingInput) {
    try {
      const dto = await apiClient.post<LessonRatingDto | null>(
        lessonEndpoints.rate(id),
        mapLessonRatingRequest(input)
      );
      // Javob shakli hujjatlashtirilmagan: baho obyekti kelsa ishlatamiz, aks holda
      // ro'yxat baribir qayta so'raladi.
      return dto && typeof dto === "object" && "stars" in dto ? mapLessonRatingDto(dto) : null;
    } catch (error) {
      if (isMissingRatingApi(error)) {
        throw new AppError({
          code: API_ERROR_CODES.NOT_FOUND,
          status: 404,
          message: "Baholash serverda hali yoqilmagan.",
          originalError: error,
        });
      }
      throw error;
    }
  },
  /** `null` — baholash API bu muhitda mavjud emas (chaqiruvchi bo'limni yashiradi). */
  async getRatings(id: string, options?: RequestOptions) {
    try {
      return mapLessonRatingList(await apiClient.get(lessonEndpoints.ratings(id), options));
    } catch (error) {
      if (isMissingRatingApi(error)) return null;
      throw error;
    }
  },
};
