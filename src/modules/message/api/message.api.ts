import { AppError, API_ERROR_CODES, apiClient, type RequestOptions } from "@/shared/api";
import type { ChatMessage, SendMessagePayload } from "@/shared/types";
import { messageEndpoints } from "./message.endpoints";
import type { MessageDto } from "./message.dto";
import { mapMessageDto } from "../lib/message.mappers";

/** Backendda mavjud bo‘lmagan amallar mock bilan yashirilmaydi — ochiq xato qaytaradi. */
const unsupported = (label: string): Promise<never> =>
  Promise.reject(
    new AppError({ code: API_ERROR_CODES.NOT_FOUND, message: label + " backend API’da mavjud emas" })
  );

export const messageApi = {
  async getAll(roomId: string, options: RequestOptions = {}): Promise<ChatMessage[]> {
    const items = await apiClient.get<MessageDto[]>(messageEndpoints.history(roomId), options);
    return items.map(mapMessageDto);
  },
  async getAfter(roomId: string, after: string, options: RequestOptions = {}): Promise<ChatMessage[]> {
    const items = await apiClient.get<MessageDto[]>(messageEndpoints.history(roomId), {
      ...options,
      query: { after },
    });
    return items.map(mapMessageDto);
  },
  async send(roomId: string, payload: SendMessagePayload): Promise<ChatMessage> {
    if (payload.attachment) {
      throw new AppError({
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: "Chat fayl yuborish backendda mavjud emas",
      });
    }
    // Backendda reply_to maydoni yo‘q — javob matn ichiga prefiks bilan yoziladi.
    const text = payload.replyTo
      ? `↪ ${payload.replyTo.author}: ${payload.replyTo.text.replace(/\n/g, " ")}\n${payload.text}`
      : payload.text;
    return mapMessageDto(await apiClient.post<MessageDto>(messageEndpoints.send(roomId), { text }));
  },
  /** Biriktirma auth talab qiladi, shuning uchun blob sifatida olinadi. */
  downloadFile(messageId: string, options?: RequestOptions) {
    return apiClient.get<Blob>(messageEndpoints.file(messageId), {
      ...options,
      responseType: "blob",
    });
  },
  update: () => unsupported("Xabarni tahrirlash"),
  remove: () => unsupported("Xabarni o‘chirish"),
  toggleReaction: () => unsupported("Reaksiya"),
};
