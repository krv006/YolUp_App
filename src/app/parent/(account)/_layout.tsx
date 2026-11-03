import { Stack } from "expo-router";
import { useDs } from "@/shared/ui";

/**
 * Ota-ona hisobi: profil -> ma'lumotlar / sozlamalar / xavfsizlik / parol /
 * yordam / bildirishnomalar (veb `/parent/profile`, `/parent/settings/...`,
 * `/parent/help`, `/parent/notifications`).
 * Guruh nomi URL'ga kirmaydi; suzuvchi panel bu yerda ko'rinmaydi.
 */
export default function ParentAccountStackLayout() {
  const ds = useDs();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ds.c.canvas } }} />;
}
