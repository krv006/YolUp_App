export const notificationEndpoints = Object.freeze({
  /** O'zining inbox'i (paginatsiyalangan). */
  list: "/api/v1/notifications/",
  send: "/api/v1/notifications/send/",
  /** `notificationId` — inbox qatorining id'si emas (u yuborilsa 404 keladi). */
  read: (notificationId: string) => `/api/v1/notifications/${notificationId}/read/`,
  unreadCount: "/api/v1/notifications/unread-count/",
  /** Admin: o'zi yuborganlari. */
  sent: "/api/v1/notifications/sent/",
  /** Admin: aynan kim o'qidi. */
  recipients: (id: string) => `/api/v1/notifications/${id}/recipients/`,
  /** Admin: xabar yuborishda foydalanuvchi qidirish. */
  searchUsers: "/api/v1/auth/users/search/",
});
