import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/shared/constants";
import type { Conversation } from "@/shared/types";

export type ConversationFilter = "all" | "direct" | "group" | "unread";

export function matchesConversationFilter(
  conversation: Conversation,
  filter: ConversationFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "unread") return conversation.unreadCount > 0;
  return conversation.type === filter;
}

interface ConversationFilterState {
  filter: ConversationFilter;
  setFilter: (filter: ConversationFilter) => void;
}

export const useConversationFilterStore = create<ConversationFilterState>()(
  persist(
    (set) => ({
      filter: "all",
      setFilter: (filter) => set({ filter }),
    }),
    { name: STORAGE_KEYS.CONVERSATION_FILTER }
  )
);

export function useConversationFilter() {
  const filter = useConversationFilterStore((state) => state.filter);
  const setFilter = useConversationFilterStore((state) => state.setFilter);
  return { filter, setFilter };
}
