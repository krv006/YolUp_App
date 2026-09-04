import type { ConversationRole } from "@/shared/types";

export const conversationKeys = Object.freeze({
  all: ["conversations"] as const,
  list: (role: ConversationRole = "teacher") => ["conversations", role] as const,
  detail: (id: string, role: ConversationRole = "teacher") => ["conversations", role, id] as const,
});
