import type { ConversationRole } from "@/shared/types";

export const messageKeys = Object.freeze({
  all: (conversationId: string, role: ConversationRole = "teacher") =>
    ["conversations", role, conversationId, "messages"] as const,
});
