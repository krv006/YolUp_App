import { create } from "zustand";
import { storage } from "@/shared/lib/storage";

const KEY = "fokus_welcome_pending";

interface WelcomeState {
  /** "Xush kelibsiz" oynasi hali ko'rsatilmaganmi. */
  pending: boolean;
  mark: () => void;
  clear: () => void;
}

/**
 * Ro'yxatdan o'tgandan keyingi "xush kelibsiz" holati — 🆕 mobil.
 *
 * ┌─ NEGA STORE, SHUNCHAKI MMKV EMAS ─────────────────────────────────────┐
 * │ Oynani ildizda doim turadigan `WelcomeGate` ko'rsatadi — ro'yxatdan   │
 * │ o'tish ekranining o'zida ko'rsatib bo'lmaydi, chunki u muvaffaqiyatdan│
 * │ keyin DARHOL almashtiriladi (`router.replace`) va oyna u bilan birga  │
 * │ yo'qolardi.                                                            │
 * │                                                                        │
 * │ `WelcomeGate` esa ilova ochilishida mount bo'ladi, ro'yxatdan o'tish  │
 * │ undan KEYIN sodir bo'ladi. Shuning uchun belgini faqat MMKV dan       │
 * │ o'qish yetmaydi: gate uni bir marta o'qib, o'zgarishini sezmasdi.     │
 * │ Store obuna beradi — belgi qo'yilishi bilan oyna ochiladi.             │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * MMKV ham yoziladi: ro'yxatdan o'tish bilan kirish orasida ilova qayta
 * ishga tushsa, belgi yo'qolmaydi.
 */
export const useWelcomeStore = create<WelcomeState>((set) => ({
  pending: storage.get(KEY) === "true",
  mark: () => {
    storage.set(KEY, true);
    set({ pending: true });
  },
  clear: () => {
    storage.remove(KEY);
    set({ pending: false });
  },
}));
