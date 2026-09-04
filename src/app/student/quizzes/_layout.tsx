import { Stack } from "expo-router";
import { useTheme } from "@/shared/ui";

export default function QuizzesStackLayout() {
  const { palette } = useTheme();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}
    />
  );
}
