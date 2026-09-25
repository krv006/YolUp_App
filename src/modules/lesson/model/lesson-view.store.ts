import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/shared/constants";

export type LessonView = "list" | "calendar";

interface LessonViewState {
  view: LessonView;
  setView: (view: LessonView) => void;
}

export const useLessonViewStore = create<LessonViewState>()(
  persist(
    (set) => ({
      view: "list",
      setView: (view) => set({ view }),
    }),
    { name: STORAGE_KEYS.LESSON_VIEW }
  )
);

export function useLessonView() {
  const view = useLessonViewStore((state) => state.view);
  const setView = useLessonViewStore((state) => state.setView);
  return { view, setView };
}
