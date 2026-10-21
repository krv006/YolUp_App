import { useState } from "react";
import { RefreshControl, type RefreshControlProps } from "react-native";
import { useTheme } from "./theme";

export interface PullRefreshProps extends Omit<RefreshControlProps, "refreshing" | "onRefresh"> {
  /** Yangilash — tugaguncha spinner turadi (Promise qaytarsin). */
  onRefresh: () => unknown;
}

/**
 * "Tortib yangilash" — spinner FAQAT foydalanuvchi tortganda ko'rinadi.
 *
 * Avval `refreshing={query.isRefetching}` edi. Ko'p so'rovlar fonda
 * muntazam yangilanadi (polling, ekranga qaytish); Android'da bu paytdagi
 * spinner ro'yxat tepasidan tashqarida qoladi, iOS'da esa ro'yxat ichida
 * ko'rinib turardi (suhbatlar ro'yxatida "Bugun" ustida aylanib qolardi).
 *
 * `ScrollView` Android'da bu elementni o'ram qilib klonlaydi va `children`,
 * `style` beradi — ular `RefreshControl` ga uzatiladi.
 */
export function PullRefresh({ onRefresh, tintColor, ...rest }: PullRefreshProps) {
  const { palette } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <RefreshControl
      {...rest}
      refreshing={refreshing}
      onRefresh={() => void refresh()}
      tintColor={tintColor ?? palette["muted-foreground"]}
    />
  );
}
