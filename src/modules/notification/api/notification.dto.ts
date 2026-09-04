import type { UserDto } from "@/shared/types";

/** Kimga yuborilgani: bitta foydalanuvchiga yoki hammaga. */
export type NotificationTarget = "user" | "all";

/** Xabarning o'zi (yuboruvchi ko'rinishi). */
export interface NotificationDto {
  id: string;
  sender?: UserDto | null;
  /** `nh3` bilan tozalangan HTML — faqat formatlash teglari. */
  description: string;
  target_type: NotificationTarget;
  /** Xabar nimaga tegishli: "assignment" — uy vazifasi. Bo‘lmasligi mumkin. */
  link_type?: string | null;
  link_id?: string | null;
  created_at: string;
}

/** `GET /notifications/` — inbox qatori (`id` — recipient yozuvi id'si). */
export interface NotificationRecipientDto {
  id: string;
  notification: NotificationDto;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/** `GET /notifications/sent/` — admin yuborgan xabar + o'qish statistikasi. */
export interface SentNotificationDto {
  id: string;
  description: string;
  target_type: NotificationTarget;
  created_at: string;
  read_count: number;
  total_count: number;
}

/** `GET /notifications/{id}/recipients/` — kim o'qidi, kim yo'q. */
export interface NotificationRecipientRowDto {
  user: UserDto;
  read_at: string | null;
}

/** `POST /notifications/send/` tanasi. */
export interface SendNotificationDto {
  description: string;
  target_type: NotificationTarget;
  /** Faqat `target_type: "user"` bo'lganda kerak. */
  user_id?: string;
}

// ─── Domen ko'rinishlari ────────────────────────────────────────────────────

export interface NotificationSender {
  id: string;
  name: string;
  username: string;
  role: string;
}

/** Xabar bosilganda ochiladigan obyekt. */
export interface NotificationLink {
  type: string;
  id: string;
}

export interface InboxNotification {
  /** Inbox qatorining (`NotificationRecipient`) id'si — ro'yxat kaliti uchun. */
  id: string;
  /** Xabarning o'zining id'si — "o'qildi" AYNAN shu id bilan yuboriladi. */
  notificationId: string;
  sender: NotificationSender | null;
  /** Tozalangan HTML. */
  html: string;
  targetType: NotificationTarget;
  isRead: boolean;
  readAt: string | null;
  /** `null` — xabar hech qayerga olib bormaydi. */
  link: NotificationLink | null;
  createdAt: string;
}

export interface SentNotification {
  id: string;
  html: string;
  targetType: NotificationTarget;
  createdAt: string;
  readCount: number;
  totalCount: number;
}

export interface NotificationRecipientRow {
  id: string;
  name: string;
  username: string;
  role: string;
  readAt: string | null;
}

/** Admin xabar yuborish formasi. */
export interface SendNotificationInput {
  description: string;
  targetType: NotificationTarget;
  userId?: string | null;
}
