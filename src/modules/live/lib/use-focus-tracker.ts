import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { onAppFocusChange } from "@/shared/lib/app-state";
import { liveApi } from "../api/live.api";
import type { FocusKind, FocusResult } from "../api/live.dto";

/** Bir xil hodisa qayta-qayta yuborilmasin. */
const DEDUPE_MS = 2000;

/**
 * Chegaraga yetganda ota-onaga signal ketadi. Backend `parent_notified` ni
 * keyingi chiqishlarda ham `true` qaytaradi, lekin qayta signal yaratmaydi —
 * shuning uchun o'quvchiga ham bu xabar faqat bir marta ko'rsatiladi.
 *
 * 🟢 Bu funksiya veb bilan AYNAN bir xil — sof mantiq, platformasi yo'q.
 */
function warnStudent(result: FocusResult, alreadyWarned: boolean): boolean {
  if (!result.tracked || !result.exitCount) return alreadyWarned;

  if (result.parentNotified) {
    if (alreadyWarned) return true;
    toast.error("Siz darsdan bir necha marta chiqdingiz — ota-onangizga xabar berildi.", {
      duration: 6000,
    });
    return true;
  }

  const left = Math.max(0, result.threshold - result.exitCount);
  toast.warning(
    left
      ? `Dars oynasidan chiqdingiz (${result.exitCount}/${result.threshold}). Yana ${left} marta chiqsangiz ota-onangizga xabar boradi.`
      : `Dars oynasidan chiqdingiz (${result.exitCount}-marta).`,
    { duration: 5000 }
  );
  return alreadyWarned;
}

/**
 * O'quvchi darsdan chiqib-kirganini backendga yozadi (anti-cheat fokus jurnali)
 * va eskalatsiya haqida o'quvchining o'zini ogohlantiradi
 * (docs/COMPLETED_WORK.md §3).
 *
 * 🔴 MOBIL QAYTA YOZILDI (MOBILE_PLAN §7.2):
 *
 * Veb versiya `visibilitychange` + `window.blur/focus` ga obuna bo'lardi.
 * Brauzerda bu signal ishonchsiz: boshqa tabga o'tish, oynani kichraytirish
 * va boshqa ilovaga o'tish bir xil ko'rinardi, `blur` esa hatto DevTools
 * ochilganda ham kelardi.
 *
 * Mobilda OS aniq aytadi — ilova fonga chiqdimi yoki yo'q. Shu sababli bu
 * yerda fokus jurnali VEB'DAGIDAN ANIQROQ ishlaydi va aynan
 * `EduTech.docx` talab qilgan narsani o'lchaydi: o'quvchi darsdan chiqdimi.
 *
 * `onAppFocusChange` iOS'ning qisqa `inactive` holatini filtrlaydi (ruxsat
 * oynasi, bildirishnoma pardasi) — aks holda har ruxsat so'rovi "chiqish"
 * bo'lib yozilardi va ota-onaga yolg'on signal ketardi.
 */
export function useFocusTracker(lessonId: string | undefined, enabled: boolean) {
  const lastEvent = useRef<{ kind: FocusKind | null; at: number }>({ kind: null, at: 0 });
  const parentWarned = useRef(false);

  useEffect(() => {
    if (!enabled || !lessonId) return undefined;
    parentWarned.current = false;

    const send = async (kind: FocusKind) => {
      const now = Date.now();
      if (lastEvent.current.kind === kind && now - lastEvent.current.at < DEDUPE_MS) return;
      lastEvent.current = { kind, at: now };

      try {
        const result = await liveApi.sendFocus(lessonId, kind);
        if (kind === "exit") parentWarned.current = warnStudent(result, parentWarned.current);
      } catch {
        // Fokus jurnali ikkinchi darajali — dars oqimini to'xtatib qo'ymaymiz.
      }
    };

    return onAppFocusChange((left) => void send(left ? "exit" : "return"));
  }, [enabled, lessonId]);
}
