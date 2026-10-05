import { useCallback } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

/**
 * Tizimning "orqaga" tugmasini ANIQ manzilga qaratadi.
 *
 * ┌─ NEGA KERAK ──────────────────────────────────────────────────────────┐
 * │ Ish maydonidan ochiladigan sahifalar (Testlar, Reyting, Davomat,      │
 * │ Vazifalar) tab navigatoridagi YASHIRIN ekranlar (`href: null`).       │
 * │ Ularga o'tish stack'ga qatlam qo'ymaydi — bu yonma-yon ekranga        │
 * │ almashish.                                                             │
 * │                                                                        │
 * │ Shu sababli tizimning "orqaga" tugmasi navigatorning standart         │
 * │ xatti-harakatini bajaradi va BIRINCHI tabga o'tadi: o'quvchida        │
 * │ Suhbatlarga, ota-onada Asosiyga. Sarlavhadagi tugma esa Ish           │
 * │ maydoniga qaytaradi — bitta ekranda ikki xil "orqaga" ikki xil joyga  │
 * │ olib borardi. Qurilmada har uchala sahifada shunday chiqdi.            │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * `useFocusEffect` SHART: ishlovchi faqat shu ekran ochiq turganda faol
 * bo'lishi kerak, aks holda u boshqa ekranlarning "orqaga"sini ham
 * o'g'irlardi.
 *
 * @param path   qaytadigan manzil
 * @param enabled `false` bo'lsa tizim xatti-harakati o'zgarmaydi — masalan
 *                Reyting sahifasi ota-onada o'z tabining ichida turadi va
 *                qaytadigan joyi yo'q.
 */
export function useBackTo(path: string, enabled = true): void {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace(path);
        return true; // hodisa shu yerda tugaydi
      });
      return () => subscription.remove();
    }, [enabled, path, router])
  );
}
