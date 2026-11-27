import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { pushDeviceApi } from "@/modules/notification/api/push-device.api";
import { getDeviceId } from "@/modules/notification/lib/device-id";
import { isPushForOpenChat, setForegroundPushActive } from "./foreground-push";

/**
 * Android bildirishnoma kanali.
 *
 * Androidda kanal BO'LMASA bildirishnoma jimgina kelib, yuqorida
 * ko'rinmaydi (faqat panelga tushadi). `MAX` muhimligi "heads-up"
 * bannerini beradi — dars boshlanishi kabi xabar ko'zdan qochmasin.
 * Ovoz ko'rsatilmagan — Android standart bildirishnoma ovozi.
 *
 * Ilova fonda yoki yopiq bo'lsa push'ni FCM o'zi chizadi va shu kanalni
 * manifestdagi `default_notification_channel_id` dan oladi
 * (`app.config.ts`, `expo-notifications` → `defaultChannel`). Usiz u
 * "Miscellaneous" (`fcm_fallback_notification_channel`) ga tushib, banner
 * va ovozsiz kelardi.
 */
const ANDROID_CHANNEL = "default";

/**
 * Ilova OCHIQ turganda: push yetib kelayotgan bo'lsa (Android) — tizim
 * banneri va ovoz, xuddi fondagidek; WebSocket toast'i o'sha xabar uchun
 * chiqmaydi (`foreground-push.ts`). Faqat hozir ochiq chatning o'z xabari
 * jim — u ekranda ko'rinib turibdi.
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const quiet = isPushForOpenChat(notification.request.content.data as Record<string, unknown> | undefined);
    return {
      shouldShowBanner: !quiet,
      shouldShowList: true,
      shouldPlaySound: !quiet,
      shouldSetBadge: true,
    };
  },
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: "Bildirishnomalar",
    importance: Notifications.AndroidImportance.MAX,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

/**
 * Qurilmani push uchun ro'yxatga oladi.
 *
 * ┌─ QADAMLAR ────────────────────────────────────────────────────────────┐
 * │ 1. Ruxsat so'raladi (Android 13+ da `POST_NOTIFICATIONS` majburiy).   │
 * │ 2. FCM qurilma tokeni olinadi.                                        │
 * │ 3. Token + `device_id` backendga yuboriladi.                          │
 * │ 4. Token yangilanishi kuzatiladi va qaytadan yuboriladi.              │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * `getExpoPushTokenAsync` EMAS, `getDevicePushTokenAsync`: backend push'ni
 * Expo xizmati orqali emas, `firebase-admin` bilan TO'G'RIDAN-TO'G'RI
 * yuboradi (`docs/PUSH-BACKEND.md`), ya'ni unga xom FCM tokeni kerak.
 * Expo tokeni (`ExponentPushToken[…]`) u yerda ishlamaydi.
 *
 * XATOLAR JIM YUTILADI — ataylab. Push — qo'shimcha qulaylik, ilovaning
 * asosiy ishi emas: bildirishnomalar ilova ochiq bo'lganda baribir
 * WebSocket orqali keladi. Foydalanuvchi ruxsat bermasa yoki Firebase
 * sozlanmagan bo'lsa, ekranda xato chiqarishning ma'nosi yo'q.
 */
export function usePushRegistration(enabled: boolean): void {
  // Bitta sessiyada bir marta yuborish uchun: token o'zgarmasa qayta
  // urinilmaydi.
  const lastToken = useRef<string | null>(null);
  const sending = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      lastToken.current = null;
      sending.current = null;
      setForegroundPushActive(false);
      return undefined;
    }

    let cancelled = false;

    async function send(token: string): Promise<void> {
      if (cancelled || token === lastToken.current || token === sending.current) return;
      // Boshlang'ich so'rov va token tinglovchisi bir vaqtda bir xil tokenni bermasin (ikki POST).
      sending.current = token;
      try {
        await pushDeviceApi.register({
          token,
          platform: Platform.OS === "ios" ? "ios" : "android",
          device_id: getDeviceId(),
          app_version: Constants.expoConfig?.version ?? undefined,
        });
        lastToken.current = token;
        // iOS push hali yo'q (APNs) — u yerda token bo'lsa ham xabar yetmaydi.
        setForegroundPushActive(Platform.OS === "android");
      } catch {
        sending.current = null;
        /*
         * Tarmoq yo'q yoki backend javob bermadi. Keyingi ochilishda
         * qaytadan urinib ko'riladi — `lastToken` yangilanmagani uchun.
         */
      }
    }

    async function start(): Promise<void> {
      try {
        await ensureAndroidChannel();

        const current = await Notifications.getPermissionsAsync();
        const granted =
          current.granted ||
          (current.canAskAgain && (await Notifications.requestPermissionsAsync()).granted);
        if (!granted || cancelled) return;

        const token = await Notifications.getDevicePushTokenAsync();
        if (typeof token.data === "string") await send(token.data);
      } catch {
        /*
         * Eng ko'p uchraydigan sabab — `google-services.json` yo'qligi:
         * Firebase ishga tushmaydi va token olinmaydi. Bu sozlash
         * masalasi, foydalanuvchi hal qila olmaydi.
         */
      }
    }

    void start();

    /*
     * Token yangilanishi. Firebase uni o'zi almashtirishi mumkin va eski
     * token bilan yuborilgan push hech kimga yetmaydi — shuning uchun
     * yangisi darhol backendga uzatiladi.
     */
    const subscription = Notifications.addPushTokenListener((token) => {
      if (typeof token.data === "string") void send(token.data);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [enabled]);
}
