import { Stack } from "expo-router";
import { useFloatingTabInset } from "@/providers/role-tabs";
import { useDs } from "@/shared/ui";

/* Boshqa sahifadan ichki sahifaga `withAnchor` bilan o'tilganda ostida profil turadi. */
export const unstable_settings = { anchor: "index" };

/**
 * Profil bo'limi ichidagi stack (veb `/teacher/profile/...`): profil ->
 * shaxsiy ma'lumotlar, akkaunt, tizim, baholar, sertifikatlar, kirishlar,
 * yordam. Suzuvchi panel faqat bosh sahifada — pastki bo'shliq ham faqat unga.
 */
export default function TeacherProfileStackLayout() {
  const ds = useDs();
  const inset = useFloatingTabInset();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ds.c.canvas } }}>
      <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: ds.c.canvas, paddingBottom: inset } }} />
    </Stack>
  );
}
