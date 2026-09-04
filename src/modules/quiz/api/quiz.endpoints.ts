export const quizEndpoints = Object.freeze({
  list: "/api/v1/quizzes/",
  detail: (id: string) => `/api/v1/quizzes/${id}/`,
  /** GET — urinishlar tarixi, POST — javob topshirish (natija darhol keladi). */
  attempts: (id: string) => `/api/v1/quizzes/${id}/attempts/`,
});
