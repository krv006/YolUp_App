export const messageEndpoints = Object.freeze({
  history: (roomId: string) => `/api/v1/chat/rooms/${roomId}/messages/`,
  send: (roomId: string) => `/api/v1/chat/rooms/${roomId}/send/`,
  file: (messageId: string) => `/api/v1/chat/files/${messageId}/`,
});
