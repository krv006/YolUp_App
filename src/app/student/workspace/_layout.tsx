import { Stack } from "expo-router";
import { useFloatingTabInset } from "@/providers/role-tabs";
import { useDs } from "@/shared/ui";

/*
 * Boshqa tabdan (asosiy sahifa, bildirishnoma) ichki sahifaga o'tganda ostida
 * bosh sahifa turishi uchun: o'tish `router.push(href, { withAnchor: true })`
 * bilan qilinadi. Aks holda ichki sahifa stekda yagona bo'lib, suzuvchi panel
 * uning ustida qolar va "orqaga" ilovadan chiqarib yuborardi.
 */
export const unstable_settings = { anchor: "index" };

/**
 * Workspace bo'limi ichidagi stack: bosh sahifa -> vazifalar, tahlil, AI ->
 * vazifa -> tekshirish (veb `/teacher/workspace/...`). Ichki sahifada suzuvchi
 * panel yashiriladi (`RoleTabs` — ichki indeks > 0), shuning uchun panel
 * uchun pastki bo'shliq faqat bosh sahifaga beriladi.
 */
export default function StudentWorkspaceStackLayout() {
  const ds = useDs();
  const inset = useFloatingTabInset();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ds.c.canvas } }}>
      <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: ds.c.canvas, paddingBottom: inset } }} />
    </Stack>
  );
}
