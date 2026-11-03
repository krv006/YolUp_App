import { Stack } from "expo-router";
import { useDs } from "@/shared/ui";

/* Boshqa bo'limdan vazifaga o'tganda ostida Vazifalar ro'yxati turadi (`withAnchor`). */
export const unstable_settings = { anchor: "index" };

/** Vazifalar bo'limi: ro'yxat -> vazifa (veb `/parent/homework/...`). */
export default function ParentHomeworkStackLayout() {
  const ds = useDs();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ds.c.canvas } }} />;
}
