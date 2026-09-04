import { AppError, API_ERROR_CODES, apiClient, type RequestOptions } from "@/shared/api";
import { courseApi, type CourseFormInput } from "@/modules/course";
import type { Conversation } from "@/shared/types";
import { conversationEndpoints } from "./conversation.endpoints";
import type { ChatRoomDto, DirectAction, DirectTeacherDto } from "./conversation.dto";
import { mapConversationDto, mapConversationPage, mapTeacherDto } from "../lib/conversation.mappers";

export const conversationApi = {
  async getAll(options: RequestOptions = {}) {
    return mapConversationPage(
      await apiClient.get(conversationEndpoints.rooms, {
        ...options,
        query: { page_size: 100, ...options.query },
      }),
      options.query
    );
  },
  async getById(id: string, options?: RequestOptions) {
    return mapConversationDto(await apiClient.get<ChatRoomDto>(conversationEndpoints.detail(id), options));
  },
  /** Backend kurs yaratilganda guruh chatini avtomatik ochadi — shu sabab kurs orqali yaratamiz. */
  async createGroup(payload: CourseFormInput): Promise<Conversation> {
    const course = await courseApi.create(payload);
    const rooms = await this.getAll();
    const room = rooms.items.find((item) => item.courseId === course.id);
    if (!room) {
      throw new AppError({
        code: API_ERROR_CODES.NOT_FOUND,
        message: "Kurs yaratildi, chat xonasi hali tayyor emas",
      });
    }
    return room;
  },
  /** Guruh chat rasmi — faqat o'qituvchi, faqat o'z kurs guruhida. */
  async setRoomImage(roomId: string, image: File): Promise<Conversation> {
    const body = new FormData();
    body.set("image", image);
    return mapConversationDto(
      await apiClient.post<ChatRoomDto>(conversationEndpoints.roomImage(roomId), body)
    );
  },
  async getTeachers(options?: RequestOptions) {
    const items = await apiClient.get<DirectTeacherDto[]>(conversationEndpoints.teachers, options);
    return items.map(mapTeacherDto);
  },
  async requestDirect(teacher: string) {
    return mapConversationDto(
      await apiClient.post<ChatRoomDto>(conversationEndpoints.directRequest, { teacher })
    );
  },
  async respondDirect(roomId: string, action: DirectAction) {
    return mapConversationDto(
      await apiClient.post<ChatRoomDto>(conversationEndpoints.directRespond, { room_id: roomId, action })
    );
  },
  async createDirect(): Promise<never> {
    throw new AppError({
      code: API_ERROR_CODES.FORBIDDEN,
      message: "Shaxsiy chat so‘rovini o‘quvchi yuboradi",
    });
  },
};
