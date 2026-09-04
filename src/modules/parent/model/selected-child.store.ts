import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/shared/constants";
import type { ParentChild } from "../api/parent.dto";
import { useParentChildren } from "./parent.queries";

interface SelectedChildState {
  selectedChildId: string | null;
  selectChild: (id: string) => void;
}

/** Faqat tanlangan farzand ID'si — ro'yxatning o'zi server holati (react-query). */
export const useSelectedChildStore = create<SelectedChildState>()(
  persist(
    (set) => ({
      selectedChildId: null,
      selectChild: (id) => set({ selectedChildId: id }),
    }),
    { name: STORAGE_KEYS.PARENT_SELECTED_CHILD }
  )
);

export interface UseSelectedChildResult {
  children: ParentChild[];
  childrenQuery: ReturnType<typeof useParentChildren>;
  selectedChild: ParentChild | null;
  selectedChildId: string | null;
  selectChild: (id: string) => void;
}

/**
 * Global tanlov (zustand) + farzandlar ro'yxati (react-query) birlashtiriladi.
 * Saqlangan ID endi mavjud bo'lmasa, birinchi farzandga qaytamiz.
 */
export function useSelectedChild(): UseSelectedChildResult {
  const childrenQuery = useParentChildren();
  const storedId = useSelectedChildStore((state) => state.selectedChildId);
  const selectChild = useSelectedChildStore((state) => state.selectChild);

  const children = childrenQuery.data ?? [];
  const selectedChildId = children.some((item) => item.id === storedId)
    ? storedId
    : (children[0]?.id ?? null);
  const selectedChild = children.find((item) => item.id === selectedChildId) ?? null;

  return { children, childrenQuery, selectedChild, selectedChildId, selectChild };
}
