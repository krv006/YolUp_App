import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useConversations } from "@/modules/conversation";
import { dsShadowHidden, DsText, Icon, radius, Text, useDs, useTheme, type IconName } from "@/shared/ui";

export interface TabDefinition {
  /** Marshrut fayli nomi: `chats`, `schedule`, … */
  name: string;
  /**
   * Tarjima KALITI, tayyor matn emas.
   *
   * Bo'limlar ro'yxati layout fayllarida modul darajasida e'lon qilinadi,
   * u yerda esa hook chaqirib bo'lmaydi. Shuning uchun tarjima shu
   * komponentda, chizish paytida qilinadi.
   */
  labelKey: string;
  /**
   * Veb ikonkasi nomi (`assets/icons/*.svg`).
   *
   * Ilgari bu yerda `lucide-react-native` komponenti turardi. Veb o'z
   * to'plamini ishlatadi va u TO'LDIRILGAN uslubda — yonma-yon qo'yilganda
   * farq darhol ko'rinadi, shuning uchun ikonkalar ham vebdan ko'chirildi
   * (izohi `shared/ui/icon.tsx` da).
   */
  iconName: IconName;
  /**
   * Shu bo'limga TEGISHLI, lekin panelda ko'rinmaydigan marshrutlar.
   *
   * Ular ochilganda bo'lim FAOL bo'lib turadi. Usiz, masalan, Workspace
   * ichidan "Test" ochilganda panelda birorta ham bo'lim ajratilmasdi va
   * foydalanuvchi qayerdaligini bilmasdi.
   */
  owns?: readonly string[];
  /** Suzuvchi panelda markazdagi ko'k doira ("Asosiy"). */
  center?: boolean;
  /**
   * Suzuvchi panel kontent USTIDA turadi. Yangi dizayndagi sahifalar pastdan
   * o'zi bo'shliq qoldiradi (vebda `pb-32`); hali eski ko'rinishdagi sahifalarga
   * esa shu belgi bilan panel balandligicha bo'shliq qo'shiladi (vebdagi
   * Jadval uchun qobiq `pb-28` beradi).
   */
  inset?: boolean;
  /** O'qilmagan suhbatlar soni belgisi (`chat` tabi). */
  unreadChats?: boolean;
}

export type RoleTabsVariant = "classic" | "floating";

/** Suzuvchi panel: ekran pastidan `max(30px, safe-area)`, balandligi `h-17`. */
const FLOATING_HEIGHT = 68;

/*
 * Panel proplarining tipi `Tabs` ning O'ZIDAN chiqariladi.
 *
 * `@react-navigation/bottom-tabs` dan import qilib bo'lmaydi: expo-router
 * o'zining NUSXA tiplarini ishlatadi va ikkalasi bir-biriga mos kelmaydi
 * (`BottomTabNavigationOptions` farq qiladi). Bu yerda esa tip har doim
 * o'rnatilgan expo-router versiyasiga mos bo'ladi.
 */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

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
/**
 * Suzuvchi panel egallaydigan pastki joy. Ichki stack'li bo'lim (Workspace)
 * uni faqat o'z bosh sahifasiga beradi — ichki sahifada panel yashiringan.
 */
export function useFloatingTabInset(): number {
  const insets = useSafeAreaInsets();
  return Math.max(30, insets.bottom) + FLOATING_HEIGHT + 14;
}

export function RoleTabs({
  tabs,
  hidden = [],
  variant = "classic",
  conversationRole = "teacher",
}: {
  tabs: readonly TabDefinition[];
  hidden?: readonly string[];
  /** `floating` — yangi dizayndagi suzuvchi panel (o'qituvchi, o'quvchi). */
  variant?: RoleTabsVariant;
  conversationRole?: "teacher" | "student";
}) {
  const { palette } = useTheme();
  const { t } = useTranslation(variant === "floating" ? "nav" : "mobile");
  const iconByRoute = new Map(tabs.map((tab) => [tab.name, tab.iconName]));
  const ownsByRoute = new Map(tabs.map((tab) => [tab.name, tab.owns ?? []]));
  const floatingInset = useFloatingTabInset();

  return (
    <Tabs
      tabBar={(props) =>
        variant === "floating" ? (
          <FloatingTabBar {...props} tabs={tabs} conversationRole={conversationRole} />
        ) : (
          <RoleTabBar {...props} iconByRoute={iconByRoute} ownsByRoute={ownsByRoute} />
        )
      }
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      {tabs.map(({ name, labelKey, inset }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(labelKey),
            ...(variant === "floating" && inset
              ? { sceneStyle: { backgroundColor: palette.background, paddingBottom: floatingInset } }
              : null),
          }}
        />
      ))}

      {hidden.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}

/**
 * Panelning o'zi qo'lda chiziladi.
 *
 * NEGA STANDART PANEL EMAS: undan oldin balandlik `height: 60` va
 * `paddingBottom: 8` qilib QAT'IY yozilgan edi. Jest-navigatsiyali
 * telefonda pastki xavfsiz zona 24–48px bo'ladi, natijada tizimning
 * navigatsiya chizig'i tab yozuvlarini bosib turardi.
 *
 * Endi balandlik `insets.bottom` dan hisoblanadi. Qo'lda chizish yana
 * Telegramdagidek tanlangan tabni yumaloq fon bilan ajratish imkonini
 * beradi (buyurtmachi namunasi: `docs/ChatExport_2026-09-08/photo_6`).
 */
function RoleTabBar({
  state,
  descriptors,
  navigation,
  iconByRoute,
  ownsByRoute,
}: TabBarProps & {
  iconByRoute: Map<string, IconName>;
  ownsByRoute: Map<string, readonly string[]>;
}) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  /*
   * Ichki stack'ning ildizidan chuqurroq ekranda panel YASHIRILADI.
   *
   * Buyurtmachi: "Chat detailga kirganda pastdagi bottom bar kerak emas".
   * Bu qoida bitta ekranga emas, hamma joyga tegishli: suhbat, test
   * tafsiloti va boshqa ichki ekranlarda ham asosiy navigatsiya xalaqit
   * beradi va joy egallaydi. Shuning uchun tekshiruv PANELNING O'ZIDA —
   * har bir ekranda qo'lda `tabBarStyle` yozib chiqish shart emas va
   * yangi ichki ekran qo'shilganda unutilmaydi.
   */
  const activeRoute = state.routes[state.index];
  const nestedIndex = activeRoute?.state?.index ?? 0;
  if (nestedIndex > 0) return null;

  return (
    /*
     * Ikki qatlam: tashqi o'ram TARTIBDA JOY EGALLAYDI, ichkarisi esa
     * suzuvchi plastinka bo'lib ko'rinadi (Telegram naqshi — buyurtmachi
     * namunasi: docs/ChatExport_2026-09-08/photo_6).
     *
     * NEGA `position: absolute` EMAS: suzuvchi panel ostidagi kontentni
     * bekitadi va uni tuzatish uchun HAR bir ekranga pastki to'ldirish
     * qo'shish kerak bo'lardi — yangi ekran qo'shilganda esa unutilardi.
     * Bu yerda o'ram joy egallagani uchun ro'yxatlar o'z-o'zidan panel
     * ustida tugaydi.
     */
    <View style={[styles.wrap, { backgroundColor: palette.background }]}>
      {/*
        * Pastki bo'shliq (home chizig'i / gesture panel) PANELNING o'zida —
        * oq fon ekranning eng pastigacha boradi (vebdagidek). Avval o'ramda
        * edi va iPhone'da panel ostida sahifa rangidagi kulrang chiziq qolardi.
        */}
      <View
        style={[
          styles.bar,
          {
            paddingBottom: insets.bottom + 8,
            backgroundColor: palette["surface-elevated"],
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        // `hidden` marshrutlar `tabs` ro'yxatida yo'q, demak ikonkasi ham
        // yo'q — panelda chizilmaydi.
        const iconName = iconByRoute.get(route.name);
        if (!iconName) return null;

        /*
         * Bo'lim o'zi ochilganda YOKI unga tegishli yashirin marshrut
         * ochilganda faol ko'rinadi (`owns` — izohi tipda).
         */
        const focused =
          state.index === index ||
          (activeRoute ? (ownsByRoute.get(route.name) ?? []).includes(activeRoute.name) : false);
        const label = options.title ?? route.name;

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          // Bosilgan tab allaqachon ochiq bo'lsa navigatsiya qilinmaydi —
          // aks holda stack ildizga qaytib, ochiq suhbat yopilib ketardi.
          // Unga tegishli yashirin sahifa (masalan Workspace ichidagi Davomat)
          // ochiq bo'lsa esa — vebdagidek bo'limning o'ziga qaytadi.
          if (state.index !== index && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            style={styles.item}
          >
            {/* Telegramda tanlangan bo'lim IKONKA VA YORLIQNI birga
                o'rab turgan yumaloq fon bilan ajratiladi. */}
            <View style={styles.itemInner}>
              {/*
               * Plastinka FAQAT IKONKANI o'raydi — vebda ham shunday
               * (o'lchami u yerdan olingan: 56x28). Ilgari u ikonka bilan
               * yorliqni birga o'rardi.
               */}
              <View
                style={[
                  styles.iconWrap,
                  focused && { backgroundColor: palette["primary-soft"] },
                ]}
              >
                <Icon
                  name={iconName}
                  size={24}
                  color={focused ? palette.primary : palette["muted-foreground"]}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: focused ? palette.primary : palette["muted-foreground"] },
                ]}
              >
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
      </View>
    </View>
  );
}

/**
 * Yangi dizayndagi suzuvchi panel — veb `widgets/mobile-tab-bar` (M5):
 * `fixed inset-x-4 bottom-[max(30px,safe-area)] h-17 rounded-[28px]
 * bg-surface px-2 shadow-lg`. Markazda "Asosiy" — `size-14` ko'k doira.
 *
 * Vebdagidek faqat bo'limlarning O'ZIDA ko'rinadi: ichki sahifalarda
 * (Workspace ichidagi Test, profil sahifalari, bildirishnomalar, ochiq
 * suhbat) yashiriladi.
 */
function FloatingTabBar({
  state,
  descriptors,
  navigation,
  tabs,
  conversationRole,
}: TabBarProps & { tabs: readonly TabDefinition[]; conversationRole: "teacher" | "student" }) {
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const conversations = useConversations(conversationRole);
  const unread = (conversations.data ?? []).filter((item) => item.unreadCount > 0).length;

  const activeRoute = state.routes[state.index];
  const nestedIndex = activeRoute?.state?.index ?? 0;
  const isTabRoot = tabs.some((tab) => tab.name === activeRoute?.name);
  if (!isTabRoot || nestedIndex > 0) return null;

  return (
    <View
      style={[
        floating.bar,
        { bottom: Math.max(30, insets.bottom), backgroundColor: ds.c.surface, boxShadow: ds.shadow.lg },
      ]}
    >
      {tabs.map((tab) => {
        const index = state.routes.findIndex((route) => route.name === tab.name);
        const route = state.routes[index];
        if (!route) return null;
        const active = state.index === index;
        const label = descriptors[route.key]?.options.title ?? route.name;

        function onPress() {
          const event = navigation.emit({ type: "tabPress", target: route!.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigation.navigate(route!.name);
        }

        if (tab.center) {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              onPress={onPress}
              style={floating.item}
            >
              <View style={[floating.home, { backgroundColor: ds.c.brand, boxShadow: ds.shadow.md }]}>
                <Icon name={tab.iconName} size={26} color={ds.c["on-action"]} />
              </View>
              <DsText v="micro" w="500" c={active ? "brand" : "ink"} style={floating.label}>
                {label}
              </DsText>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            onPress={onPress}
            style={[floating.item, floating.itemPlain]}
          >
            <View
              style={[
                floating.icon,
                // Soya doim turadi, faol emasida shaffof — izohi `dsShadowHidden` da.
                { backgroundColor: active ? ds.c.surface : "transparent", boxShadow: active ? ACTIVE_TAB_SHADOW : dsShadowHidden(ACTIVE_TAB_SHADOW) },
              ]}
            >
              <Icon name={tab.iconName} size={27} color={active ? ds.c.brand : ds.c.ink} />
              {tab.unreadChats && unread ? (
                <View style={[floating.badge, { backgroundColor: ds.c.danger }]}>
                  <Text style={[floating.badgeText, { color: ds.c["on-action"] }]}>{unread}</Text>
                </View>
              ) : null}
            </View>
            <DsText v="micro" w="500" c={active ? "brand" : "ink"} style={floating.label}>
              {label}
            </DsText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Faol tab ostidagi ko'kish soya (`shadow-[0_2px_12px_rgba(69,103,245,0.2)]`). */
const ACTIVE_TAB_SHADOW = "0 2px 12px rgba(69, 103, 245, 0.2)";

const floating = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 16,
    right: 16,
    height: FLOATING_HEIGHT,
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 8,
    borderRadius: 28,
  },
  item: { flex: 1, alignItems: "center" },
  /* `gap-1 pt-2` */
  itemPlain: { gap: 4, paddingTop: 8 },
  /* `h-8 w-14 rounded-full` */
  /*
   * Radius aniq balandlikning yarmi: Android `boxShadow` ni 999 radius bilan
   * pill shakliga kesmaydi — faol tab ostida to'rtburchak soya chiqardi.
   */
  icon: { width: 56, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  /* `-mt-0.5 size-14 rounded-full bg-brand shadow-md` */
  home: { marginTop: -2, width: 56, height: 56, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  /* `text-[11px] leading-3.5 font-medium` */
  label: { fontSize: 11, lineHeight: 14, letterSpacing: 0 },
  /* `absolute -top-1 right-1.5 h-4 min-w-4 rounded-full bg-danger px-1 text-[10px] font-semibold` */
  badge: { position: "absolute", top: -4, right: 6, height: 16, minWidth: 16, paddingHorizontal: 4, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 10, lineHeight: 12, fontWeight: "600" },
});

const styles = StyleSheet.create({
  /*
   * O'lchamlar veb DOM'idan olindi (390px kenglikda):
   *   panel      balandlik 68, oq fon, TEPA burchaklari 24, tepa chegara 1px,
   *              bo'shliq 6/8/0
   *   element    radius 13, bo'shliq 6/8, oraliq 4
   *   ikonka plastinkasi  56x28, radius 999, faol fonda #eef2ff
   *   yorliq     12/16, qalinlik 600
   *
   * ILGARI panel SUZUVCHI plastinka edi (yon chekkalarda bo'shliq, to'liq
   * yumaloq, soya bilan). Vebda u ekran kengligida turadi va faqat tepa
   * burchaklari yumaloq.
   */
  wrap: {},
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    borderTopWidth: 1,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  item: { flex: 1, alignItems: "center" },
  itemInner: { alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 8 },
  iconWrap: {
    width: 56,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "600" },
});
