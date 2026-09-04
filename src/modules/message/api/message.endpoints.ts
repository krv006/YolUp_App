export const messageEndpoints = Object.freeze({
  history: (roomId: string) => `/api/v1/chat/rooms/${roomId}/messages/`,
  send: (roomId: string) => `/api/v1/chat/rooms/${roomId}/send/`,
  /** Xabarga biriktirilgan fayl (doska PDF'i va h.k.) — Authorization talab qiladi. */
  file: (messageId: string) => `/api/v1/chat/files/${messageId}/`,
});
