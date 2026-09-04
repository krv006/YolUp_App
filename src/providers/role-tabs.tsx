import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { fontSize , useTheme } from "@/shared/ui";

export interface TabDefinition {
  /** Marshrut fayli nomi: `chats`, `schedule`, … */
  name: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Rol bo'limlarining pastki tab paneli.
 *
 * Veb'da bu yon panel (`ConversationRail` / `PortalLayout`) edi. Mobilda yon
 * panel yaramaydi: ekran tor, va bosh barmoq ekranning pastki qismiga yetadi —
 * shuning uchun asosiy navigatsiya pastda turadi.
 *
 * `hidden` marshrutlar tabda ko'rinmaydi, lekin mavjud bo'ladi: veb bilan
 * bir xil yo'llar saqlanishi kerak (masalan `/teacher/dashboard` chatsga
 * yo'naltiradi), aks holda `resolveHomeRoute` va eski havolalar sinadi.
 */
export function RoleTabs({
  tabs,
  hidden = [],
}: {
  tabs: readonly TabDefinition[];
  hidden?: readonly string[];
}) {
  const { palette } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette["primary-text"],
        tabBarInactiveTintColor: palette["muted-foreground"],
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          // Androidda default soyani olib tashlaymiz — chegara chizig'i bilan
          // ikkalasi birga "qalin" ko'rinadi.
          elevation: 0,
          ...Platform.select({ android: { height: 60, paddingBottom: 8, paddingTop: 6 } }),
        },
        tabBarLabelStyle: { fontSize: fontSize["2xs"], fontWeight: "600" },
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      {tabs.map(({ name, label, icon: Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ color, focused }) => (
              <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
            ),
          }}
        />
      ))}

      {hidden.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
