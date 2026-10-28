// ENG BIRINCHI import bo'lishi shart — izohi bootstrap.ts da.
import "@/shared/lib/bootstrap";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProviders } from "@/providers/app-providers";
import { NotificationBridge } from "@/providers/notification-bridge";
import { RouteErrorPage } from "@/pages/status/route-status-pages";
import { useTheme } from "@/shared/ui";

/**
 * Ilova ildizi — veb `src/app/router/app-router.tsx` + `root-layout.tsx`
 * ning o'rni.
 *
 * Marshrut yo'llari VEB BILAN BIR XIL saqlanadi (`/teacher/chats`,
 * `/student/chats`, `/boards/<id>` …), shuning uchun Expo Router "guruh"
 * papkalari `(teacher)` ATAYLAB ishlatilmaydi: guruh nomi URL'ga kirmaydi
 * va `/teacher/chats` bilan `/student/chats` bir xil `/chats` ga aylanib
 * to'qnashardi. Bundan tashqari haqiqiy segmentlar backend chatga
 * yuboradigan havolalar va `shared/config/routes.ts` bilan to'g'ridan-to'g'ri
 * mos tushadi (MOBILE_PLAN §6.1).
 */
export default function RootLayout() {
  return (
    <AppProviders>
      <ThemedStack />
      <NotificationBridge />
    </AppProviders>
  );
}

/** Kutilmagan xatolik — veb `RouteErrorBoundary` (marshrut chizilayotganda tashlangan xato). */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { scheme } = useTheme();
  return (
    <>
      {/* Ildiz layout o'rnida chiziladi — `ThemedStack` dagi holat paneli yo'q. */}
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <RouteErrorPage retry={() => void retry()} />
    </>
  );
}

function ThemedStack() {
  const { scheme, palette } = useTheme();

  return (
    <>
      {/* Qorong'i mavzuda oq ikonka, yorug'da qora — fon rangi bilan mos. */}
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        {/* Ochilishda BootScreen ustiga yumshoq chiqadi — vebda o'tish animatsiyasi yo'q. */}
        <Stack.Screen name="welcome" options={{ animation: "fade" }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </>
  );
}
