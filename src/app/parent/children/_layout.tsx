import { Stack } from "expo-router";
import { useDs } from "@/shared/ui";

/*
 * Boshqa bo'limdan (Asosiy, bildirishnoma) farzand sahifasiga o'tganda ostida
 * Farzandlar ro'yxati turishi uchun — o'tish `withAnchor` bilan.
 */
export const unstable_settings = { anchor: "index" };

/**
 * Farzandlar bo'limi: ro'yxat -> profil -> kirishlar / ruxsatlar (veb
 * `/parent/children/...`). Ichki sahifalarda suzuvchi panel yashirinadi.
 */
export default function ParentChildrenStackLayout() {
  const ds = useDs();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ds.c.canvas } }} />;
}
