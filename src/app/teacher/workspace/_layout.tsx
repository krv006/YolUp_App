import { Stack } from "expo-router";
import { useFloatingTabInset } from "@/providers/role-tabs";
import { useDs } from "@/shared/ui";

/**
 * Workspace bo'limi ichidagi stack: bosh sahifa -> vazifa -> tekshirish
 * (veb `/teacher/workspace/homework/:id[/review]`). Ichki sahifada suzuvchi
 * panel yashiriladi (`RoleTabs` — ichki indeks > 0), shuning uchun panel
 * uchun pastki bo'shliq faqat bosh sahifaga beriladi.
 */
export default function TeacherWorkspaceStackLayout() {
  const ds = useDs();
  const inset = useFloatingTabInset();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ds.c.canvas } }}>
      <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: ds.c.canvas, paddingBottom: inset } }} />
    </Stack>
  );
}
