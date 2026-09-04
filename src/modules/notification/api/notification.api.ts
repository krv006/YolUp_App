import { API_ERROR_CODES, apiClient, AppError, type RequestOptions } from "@/shared/api";
import type { UserDto } from "@/shared/types";
import { notificationEndpoints } from "./notification.endpoints";
import type { SendNotificationInput } from "./notification.dto";
import {
  mapInboxPage,
  mapRecipientRows,
  mapSendRequest,
  mapSentPage,
} from "../lib/notification.mappers";

/**
 * Bildirishnoma moduli hali barcha muhitlarga chiqarilmagan (docs/COMPLETED_WORK.md §2)
 * — u yerda endpoint 404 qaytaradi. Bu xato emas: qo'ng'iroq shunchaki ko'rinmaydi.
 */
function isMissingModule(error: unknown): boolean {
  return (
    error instanceof AppError &&
    (error.status === 404 || error.code === API_ERROR_CODES.NOT_FOUND)
  );
}

export const notificationApi = {
  async getInbox(options: RequestOptions = {}) {
    return mapInboxPage(await apiClient.get(notificationEndpoints.list, options), options.query);
  },

  /** Modul mavjud bo'lmasa `null` — chaqiruvchi badge'ni yashiradi. */
  async getUnreadCount(options?: RequestOptions): Promise<number | null> {
    try {
      const dto = await apiClient.get<{ count?: number }>(
        notificationEndpoints.unreadCount,
        options
      );
      return Number(dto?.count ?? 0);
    } catch (error) {
      if (isMissingModule(error)) return null;
      throw error;
    }
  },

  /**
   * Diqqat: backend XABAR id'sini kutadi (`notification.id`), inbox qatorining
   * id'sini emas. Ikkalasi ham UUID, shuning uchun adashish oson — noto'g'risi
   * yuborilsa 404 keladi.
   */
  async markRead(notificationId: string) {
    await apiClient.post(notificationEndpoints.read(notificationId), {});
    return notificationId;
  },

  async send(input: SendNotificationInput) {
    return apiClient.post(notificationEndpoints.send, mapSendRequest(input));
  },

  async getSent(options: RequestOptions = {}) {
    return mapSentPage(await apiClient.get(notificationEndpoints.sent, options), options.query);
  },

  async getRecipients(notificationId: string, options?: RequestOptions) {
    return mapRecipientRows(
      await apiClient.get(notificationEndpoints.recipients(notificationId), options)
    );
  },

  /** Admin: xabar yuborishda foydalanuvchi qidirish (2+ belgidan, 10 tagacha). */
  async searchUsers(query: string, options?: RequestOptions) {
    const dto = await apiClient.get<UserDto[]>(notificationEndpoints.searchUsers, {
      ...options,
      query: { q: query },
    });
    return (Array.isArray(dto) ? dto : []).map((user) => ({
      id: String(user.id),
      name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username,
      username: user.username,
      role: user.role ?? "",
    }));
  },
};
