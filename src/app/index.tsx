import { Redirect } from "expo-router";
import { resolveHomeRoute, useAuth } from "@/modules/auth";
import { BootScreen, Screen, ScreenError } from "@/shared/ui";

/**
 * Kirish nuqtasi — veb `RootLayout` dagi `<Navigate to={ROUTES.auth.login} />`
 * va `ProtectedRoute` ning birlashgan o'rni.
 *
 * `AppProviders` bootstrap tugamaguncha render qilmaydi, shuning uchun bu
 * yerda holat allaqachon ANIQ: yo authenticated, yo anonymous, yo xato.
 */
export default function IndexRoute() {
  const { user, isAuthenticated, isInitializing, initializationError, retrySession } = useAuth();

  if (isInitializing) return <BootScreen />;

  /*
   * Tarmoq xatosi 401 dan FARQ qiladi: token yaroqsiz bo'lsa store uni
   * jimgina tozalab ANONYMOUS ga o'tadi. Bu yerga kelish — server yoki
   * tarmoq nosozligi, ya'ni foydalanuvchini login ekraniga haydash noto'g'ri
   * bo'lardi: uning sessiyasi joyida, shunchaki internet yo'q.
   */
  if (initializationError) {
    return (
      <Screen>
        <ScreenError message={initializationError.message} onRetry={() => void retrySession()} />
      </Screen>
    );
  }

  /*
   * Yo'naltirish paytida ham ochilish ekrani turadi: bo'sh `index` oddiy fon
   * bilan bir lahza ko'rinib, gradientli BootScreen va keyingi ekran orasida
   * "miltillash" bo'lardi (2026-10-28, telefon yozuvida ko'rindi).
   */
  return (
    <>
      <BootScreen />
      {/* Rolga qarab bosh sahifa — 🟢 veb bilan bir xil `resolveHomeRoute`. */}
      <Redirect href={isAuthenticated ? resolveHomeRoute(user) : "/welcome"} />
    </>
  );
}
