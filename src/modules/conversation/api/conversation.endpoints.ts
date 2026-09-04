export const conversationEndpoints = Object.freeze({
  rooms: "/api/v1/chat/rooms/", detail: (id: string) => `/api/v1/chat/rooms/${id}/`,
  teachers: "/api/v1/chat/rooms/teachers/", directRequest: "/api/v1/chat/rooms/direct/request/",
  directRespond: "/api/v1/chat/rooms/direct/respond/",
  /** O'qituvchi guruh chat rasmini o'rnatadi (multipart: `image`). */
  roomImage: (id: string) => `/api/v1/chat/rooms/${id}/image/`,
});
