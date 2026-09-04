/**
 * `notification` modulining mobil barrel'i.
 *
 * Veb `src/modules/notification/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { notificationApi } from "./api/notification.api";
export { notificationEndpoints } from "./api/notification.endpoints";
export type {
  InboxNotification,
  NotificationLink,
  NotificationDto,
  NotificationRecipientDto,
  NotificationRecipientRow,
  NotificationSender,
  NotificationTarget,
  SendNotificationInput,
  SentNotification,
} from "./api/notification.dto";
export {
  mapInboxNotificationDto,
  mapInboxPage,
  mapRecipientRows,
  mapSendRequest,
  mapSentNotificationDto,
  mapSentPage,
} from "./lib/notification.mappers";
export {
  NotificationSocketManager,
  parseNotificationEvent,
} from "./lib/notification-socket-manager";
export type { LiveNotification } from "./lib/notification-socket-manager";
export {
  notificationKeys,
  useMarkNotificationRead,
  useNotificationInbox,
  useNotificationRecipients,
  useSendNotification,
  useSentNotifications,
  useUnreadNotificationCount,
  useUserSearch,
} from "./model/notification.queries";
export { useNotificationFeed } from "./model/use-notification-feed";
