import { Stack } from "expo-router";
import { useTheme } from "@/shared/ui";

/* Suhbatga havola (bildirishnoma, deep link) orqali kirilganda ostida ro'yxat turadi — suzuvchi panel yashirinadi, "orqaga" ro'yxatga qaytaradi. */
export const unstable_settings = { anchor: "index" };

/**
 * Chat bo'limi ichidagi stack: ro'yxat -> suhbat.
 *
 * Veb'da ikkalasi yonma-yon ustunda turardi; mobilda ro'yxatdan suhbatga
 * o'tiladi va orqaga surish (swipe-back) bilan qaytiladi.
 */
export default function ChatsStackLayout() {
  const { palette } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
      }}
    />
  );
}
