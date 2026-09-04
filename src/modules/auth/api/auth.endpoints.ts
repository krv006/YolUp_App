export const authEndpoints = Object.freeze({
  login: "/api/v1/auth/login/",
  logout: "/api/v1/auth/logout/",
  refresh: "/api/v1/auth/token/refresh/",
  me: "/api/v1/auth/me/",
  register: "/api/v1/auth/register/",
  children: "/api/v1/auth/children/",
  links: "/api/v1/auth/links/",
  requestLink: "/api/v1/auth/links/request/",
  respondLink: (id: string) => `/api/v1/auth/links/${id}/respond/`,
  consents: "/api/v1/auth/consents/",
  logins: "/api/v1/auth/logins/",
  /** Admin: barcha o'qituvchilar, `avg_rating`/`rating_count` bilan. */
  teachers: "/api/v1/auth/teachers/",
  /** Admin: hali tasdiqlanmagan (`is_approved=false`) o'qituvchilar. */
  teachersPending: "/api/v1/auth/teachers/pending/",
  teacherApprove: (id: string) => `/api/v1/auth/teachers/${id}/approve/`,
  meCertificates: "/api/v1/auth/me/certificates/",
  meCertificate: (id: string) => `/api/v1/auth/me/certificates/${id}/`,
});
