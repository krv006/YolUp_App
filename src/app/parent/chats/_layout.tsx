import { Stack } from "expo-router";
import { useDs } from "@/shared/ui";

/* Suhbatga havola (bildirishnoma) orqali kirilganda ostida ro'yxat turadi (`withAnchor`). */
export const unstable_settings = { anchor: "index" };

/** Kuzatuvchi chatlari (`/parent/chats/...`): ro'yxat -> suhbat. */
export default function ParentChatsStackLayout() {
  const ds = useDs();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ds.c.canvas } }} />;
}
