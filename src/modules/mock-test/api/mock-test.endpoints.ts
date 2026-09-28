export const mockTestEndpoints = Object.freeze({
  list: "/api/v1/quizzes/mock-tests/",
  detail: (id: string) => `/api/v1/quizzes/mock-tests/${id}/`,
  start: (id: string) => `/api/v1/quizzes/mock-tests/${id}/start/`,
  attempts: (id: string) => `/api/v1/quizzes/mock-tests/${id}/attempts/`,
  submit: (id: string, attemptId: string) =>
    `/api/v1/quizzes/mock-tests/${id}/attempts/${attemptId}/submit/`,
});
