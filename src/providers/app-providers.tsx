import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { tokenStorage } from "@/shared/api";
import { useAuthStore } from "@/modules/auth";
import { ToastHost } from "@/shared/ui";
import { queryClient } from "./query-client";

/**
 * Veb `src/app/providers/app-providers.tsx` ning mobil varianti.
 *
 * Joylashuvi farq qiladi: Expo Router `src/app/` papkasidagi HAR fayldan
 * marshrut yasaydi, shuning uchun provider'lar u yerda tura olmaydi va
 * `src/providers/` ga chiqarildi. Bu — mobilga majburiy yagona struktura
 * chetlanishi (MOBILE_PLAN §4.1).
 *
 * Boot tartibi (MOBILE_PLAN §4.2) — tartib MUHIM:
 *   1. tokenStorage.hydrate()  — Keychain'dan tokenni XOTIRAGA o'qish
 *   2. useAuthStore.bootstrap() — GET /auth/me/ (1-qadam tugamasdan
 *      chaqirilsa token topilmaydi va foydalanuvchi har safar login qiladi)
 *   3. Splash yopiladi — undan oldin yopilsa login ekrani bir lahza
 *      "miltillab" o'tadi va keyin bosh sahifaga sakraydi
 */

// Splash o'zi yopilib qolmasin — hydrate tugaguncha biz ushlab turamiz.
void SplashScreen.preventAutoHideAsync();

export function AppProviders({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await tokenStorage.hydrate();
      if (cancelled) return;
      // Saqlangan token bo'lsa profil tiklanadi; bo'lmasa store darhol
      // ANONYMOUS ga o'tadi va so'rov umuman yuborilmaydi.
      await bootstrap();
      if (cancelled) return;
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrap]);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // Splash hali ekranda — bo'sh daraxt qaytaramiz, aks holda marshrut
  // guard'lari hali noma'lum auth holati ustida qaror qabul qilib qo'yadi.
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      {/*
       * KeyboardProvider — klaviatura balandligini kadrma-kadr beradi.
       *
       * NEGA KERAK: `android/gradle.properties` da `edgeToEdgeEnabled=true`.
       * Edge-to-edge yoqilganda Android 15+ klaviatura ochilganda OYNANI
       * KICHRAYTIRMAYDI, RN ning o'z `KeyboardAvoidingView` i esa aynan
       * shunga tayanadi — natijada input klaviatura ostida qolardi
       * (chat kompozitori va BARCHA bottomsheetlar).
       *
       * Reanimated'ning `useAnimatedKeyboard` i 4-versiyada eskirgan va
       * mualliflarning o'zi shu kutubxonaga yo'naltiradi.
       */}
      <KeyboardProvider>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <ToastHost />
          </QueryClientProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
