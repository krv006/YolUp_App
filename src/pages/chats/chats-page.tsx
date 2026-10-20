import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import {
  matchesConversationFilter,
  useConversationFilter,
  useConversations,
  type ConversationFilter,
} from "@/modules/conversation";
import { ConversationItem } from "@/modules/conversation/ui/conversation-item";
import { useLiveLessons } from "@/modules/lesson";
import { useUnreadNotificationCount } from "@/modules/notification";
import { NewGroupSheet } from "@/modules/conversation/ui/new-group-sheet";
import { StudentEnrollmentSheet } from "@/modules/student";
import type { Conversation, ConversationRole } from "@/shared/types";
import {
  AppBar,
  AppBarAction,
  Chip,
  ChipRow,
  CountBadge,
  Screen,
  ScreenEmpty,
  ScreenError,
  SearchField,
  Separator,
  Skeleton,
  useTheme,
} from "@/shared/ui";

/**
 * Suhbatlar ro'yxati — veb `widgets/conversation-panel` ning mobil varianti.
 *
 * Veb'da bu ustun chat oynasi bilan YONMA-YON turardi. Mobilda ular stack:
 * ro'yxatdan suhbatga o'tiladi, orqaga surish bilan qaytiladi (§6.3).
 */

/*
 * Yorliqlar KALIT bilan — ro'yxat modul darajasida, hook chaqirib
 * bo'lmaydi. Uchtasi vebning `chat` lug'atidan (`panel.filters.*`),
 * "Guruhlar" esa u yerda yo'q, shuning uchun `mobile` bo'limida.
 */
const FILTERS: readonly { id: ConversationFilter; labelKey: string; ns: "chat" | "mobile" }[] = [
  { id: "all", labelKey: "panel.filters.all", ns: "chat" },
  { id: "direct", labelKey: "panel.filters.direct", ns: "chat" },
  { id: "group", labelKey: "chats.guruhlar", ns: "mobile" },
  { id: "unread", labelKey: "panel.filters.unread", ns: "chat" },
];

export function ChatsPage({ role }: { role: ConversationRole }) {
  const { t } = useTranslation("mobile");
  const { t: tc } = useTranslation("chat");
  const router = useRouter();
  const { palette } = useTheme();
  const { user } = useAuth();
  const { filter, setFilter } = useConversationFilter();
  const [search, setSearch] = useState("");
  const [enrollOpen, setEnrollOpen] = useState(false);

  const { data = [], isLoading, isError, error, refetch, isRefetching } = useConversations(role);
  const unread = useUnreadNotificationCount();

  /**
   * Qaysi guruhda dars ketyapti. Dars kurs bilan bog'langan, chat ham —
   * bog'lovchi kalit `courseId` (veb `conversation-panel` bilan bir xil).
   */
  const liveLessons = useLiveLessons(Boolean(user)).data;
  const liveCourses = useMemo(
    () => new Set((liveLessons ?? []).map((lesson) => lesson.courseId)),
    [liveLessons]
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.filter((item) => {
      const matchesSearch =
        !query || `${item.title} ${item.lastMessage}`.toLowerCase().includes(query);
      return matchesSearch && matchesConversationFilter(item, filter);
    });
  }, [data, search, filter]);

  const basePath = role === "teacher" ? "/teacher/chats" : "/student/chats";
  /*
   * FAB ikkala rolda ham bor, lekin BOSHQA ish qiladi:
   *   o'quvchi  — kursga qo'shilish, o'qituvchiga so'rov (shaxsiy suhbatni
   *               faqat o'quvchi boshlay oladi — backend qoidasi)
   *   o'qituvchi — yangi kurs va guruh chat yaratish + yozilish so'rovlari
   */
  const isStudent = role === "student";

  function openConversation(id: string) {
    router.push(`${basePath}/${id}`);
  }

  return (
    <Screen padded={false}>
      <AppBar a11yTitle={t("chats.suhbatlar")}>
        <AppBarAction
          name="bell"
          label={t("chats.bildirishnomalar")}
          onPress={() => router.push("/notifications")}
          badge={
            (unread.data ?? 0) > 0 ? (
              <View style={styles.bellBadge}>
                <CountBadge count={unread.data ?? 0} />
              </View>
            ) : null
          }
        />
      </AppBar>

      <View style={[styles.body, { backgroundColor: palette.surface }]}>
        {/*
         * Qidiruv DOIM ko'rinadi — vebdagi kabi. Ilgari u sarlavha
         * yonidagi ikonka ortida yashiringan edi.
         */}
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder={t("chats.suhbat_qidirish")}
        />

        <ChipRow>
          {FILTERS.map(({ id, labelKey, ns }) => (
            <Chip
              key={id}
              label={ns === "chat" ? tc(labelKey) : t(labelKey)}
              selected={filter === id}
              onPress={() => setFilter(id)}
            />
          ))}
        </ChipRow>

        <ChatsList
          conversations={visible}
          liveCourses={liveCourses}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error instanceof Error ? error.message : undefined}
          isRefetching={isRefetching}
          onRefresh={() => void refetch()}
          onOpen={openConversation}
          hasFilter={Boolean(search.trim()) || filter !== "all"}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isStudent
            ? "Yangi muloqot: kursga qo'shilish yoki o'qituvchiga yozish"
            : "Yangi kurs va guruh chat yaratish"
        }
        onPress={() => setEnrollOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Plus size={24} color={palette["primary-foreground"]} />
      </Pressable>

      {isStudent ? (
        <StudentEnrollmentSheet open={enrollOpen} onClose={() => setEnrollOpen(false)} />
      ) : (
        <NewGroupSheet open={enrollOpen} onClose={() => setEnrollOpen(false)} />
      )}
    </Screen>
  );
}

interface ChatsListProps {
  conversations: Conversation[];
  liveCourses: Set<string | null>;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isRefetching: boolean;
  onRefresh: () => void;
  onOpen: (id: string) => void;
  hasFilter: boolean;
}

/** Uch holat (loading / error / empty) ATAYLAB bitta joyda — §18.12. */
function ChatsList({
  conversations,
  liveCourses,
  isLoading,
  isError,
  errorMessage,
  isRefetching,
  onRefresh,
  onOpen,
  hasFilter,
}: ChatsListProps) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();

  if (isLoading) return <ChatsSkeleton />;

  if (isError) {
    return (
      <ScreenError message={errorMessage ?? "Suhbatlarni yuklab bo'lmadi"} onRetry={onRefresh} />
    );
  }

  if (conversations.length === 0) {
    return hasFilter ? (
      <ScreenEmpty
        title={t("chats.hech_narsa_topilmadi")}
        description={t("chats.qidiruv_yoki_filtrni_ozgartiring")}
      />
    ) : (
      <ScreenEmpty
        title={t("chats.suhbatlar_yoq")}
        description={t("chats.kursga_yozilganingizdan_keyin_guruh_chatlari")}
      />
    );
  }

  return (
    // FlashList v2 qator balandligini o'zi o'lchaydi — `estimatedItemSize`
    // kerak emas (v1 da majburiy edi).
    <FlashList
      data={conversations}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <Separator inset={72} />}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={palette["muted-foreground"]}
        />
      }
      renderItem={({ item }) => (
        <ConversationItem
          conversation={item}
          onPress={onOpen}
          live={Boolean(item.courseId && liveCourses.has(item.courseId))}
        />
      )}
    />
  );
}

function ChatsSkeleton() {
  return (
    <View style={styles.skeleton}>
      {Array.from({ length: 8 }, (_, index) => (
        <View key={index} style={styles.skeletonRow}>
          <Skeleton width={46} height={46} style={styles.skeletonAvatar} />
          <View style={styles.skeletonBody}>
            <Skeleton width="55%" />
            <Skeleton width="80%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  /*
   * Veb DOM'idan: bo'lim OQ fonda, bo'shlig'i 20, elementlar orasi 16.
   * Sahifa foni (`--bg-canvas`) faqat tepa panelda qoladi.
   */
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  header: { borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8 },
  title: { flex: 1 },
  searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 4 },
  // Qo'ng'iroq ustidagi hisoblagich — tugma maydonini o'zgartirmasligi kerak.
  /*
   * Nishon tugma doirasidan TASHQARIDA turadi. Ilgari u doira ichida
   * edi va qo'ng'iroq ikonkasini bosib qolardi. Vebda bu yerda nishon
   * umuman yo'q, lekin o'qilmagan sonni yo'qotmaslik uchun qoldirildi.
   */
  bellBadge: { position: "absolute", top: -2, right: -2 },
  searchInput: { flex: 1 },
  // Suzuvchi tugma ro'yxat USTIDA — pastdagi tab paneli ustida turadi.
  fab: {
    position: "absolute",
    right: 18,
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  skeleton: { paddingTop: 8 },
  skeletonRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  skeletonAvatar: { borderRadius: 23 },
  skeletonBody: { flex: 1, gap: 8, justifyContent: "center" },
});
