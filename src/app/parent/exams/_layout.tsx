import { Stack } from "expo-router";
import { useDs } from "@/shared/ui";

/* Boshqa bo'limdan ichki sahifaga o'tganda ostida bo'lim bosh sahifasi turadi (`withAnchor`). */
export const unstable_settings = { anchor: "index" };

/** Natijalar bo'limi (`/parent/exams/...`): ro'yxat -> imtihon natijasi. */
export default function ParentExamsStackLayout() {
  const ds = useDs();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ds.c.canvas } }} />;
}
