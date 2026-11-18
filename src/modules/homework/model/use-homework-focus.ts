import { useEffect } from "react";
import { onAppFocusChange } from "@/shared/lib";
import { homeworkApi } from "../api/homework.api";

/*
 * 🟡 Veb `use-homework-focus.ts`: `visibilitychange` va `blur`/`focus` o'rniga
 * `onAppFocusChange` (`@/shared/lib/app-state`) — ilova fonga o'tsa "exit",
 * qaytsa "return"; iOS `inactive` qisqa vaqt (bildirishnoma pardasi, tizim
 * oynasi) chiqish emas.
 *
 * Fayl tanlash: vebda `input[type=file]` bosilgandan keyingi blur
 * sanalmaydi. Telefonda tanlash oynasi Android'da ilovani fonga o'tkazadi,
 * shuning uchun tanlash `pauseHomeworkFocus` bilan o'raladi — shu vaqtda
 * fonga o'tish chiqish deb sanalmaydi.
 */
let picking = 0;

export function pauseHomeworkFocus<T>(task: Promise<T>): Promise<T> {
  picking += 1;
  return task.finally(() => {
    picking = Math.max(0, picking - 1);
  });
}

export function useHomeworkFocusTracker(assignmentId: string | null | undefined, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !assignmentId) return undefined;
    let away = false;

    const send = (kind: "exit" | "return") => {
      if ((kind === "exit") === away) return;
      away = kind === "exit";
      homeworkApi.sendFocus(assignmentId, kind).catch(() => undefined);
    };

    const unsubscribe = onAppFocusChange((left) => {
      if (left) {
        if (!picking) send("exit");
      } else send("return");
    });
    return () => {
      unsubscribe();
      if (away) homeworkApi.sendFocus(assignmentId, "return").catch(() => undefined);
    };
  }, [assignmentId, enabled]);
}
