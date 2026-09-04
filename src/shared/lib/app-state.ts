import { AppState, type AppStateStatus } from "react-native";

/**
 * Ilova old/fon holati — veb'dagi `document.visibilitychange`, `window.blur`
 * va `window.focus` hodisalarining o'rni.
 *
 * Mobilda bu signal veb'dagidan ANIQROQ: brauzerda "boshqa tabga o'tdi" bilan
 * "boshqa oynaga o'tdi" farqi yuvilib ketardi, bu yerda esa OS aniq aytadi.
 *
 * iOS `inactive` holatini alohida ko'rsatadi (ilova almashtirgich, bildirishnoma
 * pardasi, kiruvchi qo'ng'iroq, ruxsat oynasi). Android bunday holatni
 * bermaydi — faqat `active`/`background`.
 */

export type AppFocusState = "active" | "inactive" | "background";

export function currentAppState(): AppFocusState {
  return normalize(AppState.currentState);
}

export function isAppActive(): boolean {
  return currentAppState() === "active";
}

function normalize(status: AppStateStatus): AppFocusState {
  if (status === "active") return "active";
  if (status === "inactive") return "inactive";
  return "background";
}

/**
 * Holat o'zgarishiga obuna. Obunani bekor qiluvchi funksiya qaytaradi.
 */
export function onAppStateChange(callback: (state: AppFocusState) => void): () => void {
  const subscription = AppState.addEventListener("change", (status) => callback(normalize(status)));
  return () => subscription.remove();
}

/**
 * "Ilovadan chiqdi / qaytdi" signalini beradi — fokus jurnali uchun.
 *
 * `inactive` ATAYLAB darhol "chiqdi" deb hisoblanmaydi: iOS'da u ruxsat
 * oynasi yoki bildirishnoma pardasini tortishda ham qisqa vaqtga keladi.
 * Shuning uchun kutiladi — `graceMs` ichida `active` ga qaytsa, hodisa
 * umuman yuborilmaydi. `background` esa aniq chiqish, darhol yuboriladi.
 */
export function onAppFocusChange(
  callback: (left: boolean) => void,
  { graceMs = 1_500 }: { graceMs?: number } = {}
): () => void {
  let left = false;
  let pending: ReturnType<typeof setTimeout> | null = null;

  const clearPending = () => {
    if (pending) clearTimeout(pending);
    pending = null;
  };

  const report = (next: boolean) => {
    if (next === left) return;
    left = next;
    callback(next);
  };

  const unsubscribe = onAppStateChange((state) => {
    clearPending();
    if (state === "active") {
      report(false);
      return;
    }
    if (state === "background") {
      report(true);
      return;
    }
    // inactive — vaqtinchalik bo'lishi mumkin, kutamiz.
    pending = setTimeout(() => {
      pending = null;
      if (!isAppActive()) report(true);
    }, graceMs);
  });

  return () => {
    clearPending();
    unsubscribe();
  };
}
