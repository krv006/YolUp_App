import { Stack } from "expo-router";
import { useDs } from "@/shared/ui";

/* Boshqa bo'limdan ichki sahifaga o'tganda ostida Davomat turadi (`withAnchor`). */
export const unstable_settings = { anchor: "index" };

/** Davomat bo'limi: ro'yxat -> kalendar / qidiruv (veb `/parent/attendance/...`). */
export default function ParentAttendanceStackLayout() {
  const ds = useDs();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ds.c.canvas } }} />;
}
