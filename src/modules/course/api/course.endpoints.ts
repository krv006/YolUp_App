export const courseEndpoints = Object.freeze({
  list: "/api/v1/courses/",
  detail: (id: string) => `/api/v1/courses/${id}/`,
  catalog: "/api/v1/courses/catalog/",
  students: (id: string) => `/api/v1/courses/${id}/students/`,
  searchStudents: (id: string) => `/api/v1/courses/${id}/search-students/`,
  enroll: (id: string) => `/api/v1/courses/${id}/enroll/`,
  unenroll: (id: string) => `/api/v1/courses/${id}/unenroll/`,
  requests: "/api/v1/courses/requests/",
  respondRequest: "/api/v1/courses/requests/respond/",
});
