import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/modules/auth";
import { ROUTES } from "@/shared/config";
import { Avatar, DsText } from "@/shared/ui";
import { ParentBell } from "./parent-bell";
import { ParentChatButton } from "./parent-chat-button";

function greeting(hour: number): "morning" | "day" | "evening" | "night" {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

/**
 * Ota-ona bosh sahifasi sarlavhasi — veb `widgets/parent-shell/parent-mobile-header.tsx`:
 * 48px avatar (profilni ochadi), ustida vaqtga qarab salom, ostida ism
 * (`font-heading text-[18px]/6 font-semibold`), o'ngda qo'ng'iroq.
 */
export function ParentMobileHeader() {
  const { t } = useTranslation("parent");
  const router = useRouter();
  const { user } = useAuth();
  const [hour] = useState(() => new Date().getHours());
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("shell.openAccount")} onPress={() => router.push(ROUTES.parent.profile as never)}>
        <Avatar variant="legacy" name={user?.name} src={user?.avatarUrl ?? undefined} size="lg" box={48} />
      </Pressable>
      <View style={styles.text}>
        <DsText v="caption" c="ink-secondary" numberOfLines={1}>
          {t(`mobile.greeting.${greeting(hour)}`)}
        </DsText>
        <DsText v="title-lg" heading numberOfLines={1}>
          {user?.name}
        </DsText>
      </View>
      <ParentChatButton />
      <ParentBell />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  text: { flex: 1, minWidth: 0 },
});
