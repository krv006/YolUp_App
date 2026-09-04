import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/shared/constants";

export type LessonView = "list" | "calendar";

interface LessonViewState {
  view: LessonView;
  setView: (view: LessonView) => void;
}

/**
 * Darslar bo'limidagi ko'rinish tanlovi.
 *
 * Foydalanuvchi har safar qayta tanlamasligi uchun saqlanadi; global holat
 * bo'lgani sababli zustand'da turadi (loyihada React Context ishlatilmaydi).
 */
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
