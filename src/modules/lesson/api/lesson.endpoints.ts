export const lessonEndpoints = Object.freeze({
  list: "/api/v1/lessons/",
  detail: (id: string) => `/api/v1/lessons/${id}/`,
  finish: (id: string) => `/api/v1/lessons/${id}/finish/`,
  /** Yozuv holati (GET) va o'qituvchi tomonidan o'chirish (DELETE). */
  recording: (id: string) => `/api/v1/lessons/${id}/recording/`,
  /** O‘qituvchi brauzerida yozilgan audio bo‘laklari. */
  recordingAudio: (id: string) => `/api/v1/lessons/${id}/recording/audio/`,
  /** Barcha audio bo‘laklari yuklangach video bilan birlashtirishni boshlaydi. */
  finalizeRecordingAudio: (id: string) => `/api/v1/lessons/${id}/recording/audio/finalize/`,
  /** O‘qituvchi brauzerida (`getDisplayMedia`) yozilgan ekran bo‘laklari. */
  recordingVideo: (id: string) => `/api/v1/lessons/${id}/recording/video/`,
  /** Barcha video bo‘laklari yuklangach audio bilan birlashtirishni boshlaydi. */
  finalizeRecordingVideo: (id: string) => `/api/v1/lessons/${id}/recording/video/finalize/`,
  /**
   * Haftalik jadval bo'yicha ko'plab dars yaratish.
   * Yo'l kurs ostida turadi, lekin natija — darslar, shuning uchun shu yerda.
   */
  schedule: (courseId: string) => `/api/v1/courses/${courseId}/schedule/`,
  /** O'quvchi tugagan darsga baho qo'yadi (POST). */
  rate: (id: string) => `/api/v1/lessons/${id}/rate/`,
  /** Shu darsga qo'yilgan baholar ro'yxati (GET). */
  ratings: (id: string) => `/api/v1/lessons/${id}/ratings/`,
});
