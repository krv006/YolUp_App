import { useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Bell, Plus, Search, X } from "lucide-react-native";
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
  Chip,
  ChipRow,
  CountBadge,
  IconButton,
  Input,
  Screen,
  ScreenEmpty,
  ScreenError,
  Separator,
  Skeleton,
  Text,
  useTheme,
} from "@/shared/ui";

/**
 * Suhbatlar ro'yxati — veb `widgets/conversation-panel` ning mobil varianti.
 *
 * Veb'da bu ustun chat oynasi bilan YONMA-YON turardi. Mobilda ular stack:
 * ro'yxatdan suhbatga o'tiladi, orqaga surish bilan qaytiladi (§6.3).
 */

const FILTERS: readonly { id: ConversationFilter; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "direct", label: "Shaxsiy" },
  { id: "group", label: "Guruhlar" },
  { id: "unread", label: "O'qilmagan" },
];

export function ChatsPage({ role }: { role: ConversationRole }) {
  const router = useRouter();
  const { palette } = useTheme();
  const { user } = useAuth();
  const { filter, setFilter } = useConversationFilter();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
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
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        {searchOpen ? (
          <View style={styles.searchRow}>
            <View style={styles.searchInput}>
              <Input
                placeholder="Suhbat qidirish"
                icon={<Search size={18} color={palette["muted-foreground"]} />}
                value={search}
                onChangeText={setSearch}
                autoFocus
                returnKeyType="search"
              />
            </View>
            <IconButton
              accessibilityLabel="Qidiruvni yopish"
              onPress={() => {
                setSearch("");
                setSearchOpen(false);
              }}
            >
              <X size={20} color={palette["muted-foreground"]} />
            </IconButton>
          </View>
        ) : (
          <View style={styles.titleRow}>
            <Text variant="heading" style={styles.title}>
              Suhbatlar
            </Text>
            <IconButton accessibilityLabel="Qidirish" onPress={() => setSearchOpen(true)}>
              <Search size={20} color={palette["muted-foreground"]} />
            </IconButton>
            <IconButton
              accessibilityLabel="Bildirishnomalar"
              onPress={() => router.push("/notifications")}
            >
              <Bell size={20} color={palette["muted-foreground"]} />
              {(unread.data ?? 0) > 0 ? (
                <View style={styles.bellBadge}>
                  <CountBadge count={unread.data ?? 0} />
                </View>
              ) : null}
            </IconButton>
          </View>
        )}

        <ChipRow>
          {FILTERS.map(({ id, label }) => (
            <Chip key={id} label={label} selected={filter === id} onPress={() => setFilter(id)} />
          ))}
        </ChipRow>
      </View>

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
  const { palette } = useTheme();

  if (isLoading) return <ChatsSkeleton />;

  if (isError) {
    return (
      <ScreenError
        message={errorMessage ?? "Suhbatlarni yuklab bo'lmadi"}
        onRetry={onRefresh}
      />
    );
  }

  if (conversations.length === 0) {
    return hasFilter ? (
      <ScreenEmpty title="Hech narsa topilmadi" description="Qidiruv yoki filtrni o'zgartiring." />
    ) : (
      <ScreenEmpty
        title="Suhbatlar yo'q"
        description="Kursga yozilganingizdan keyin guruh chatlari shu yerda paydo bo'ladi."
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
  header: { borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8 },
  title: { flex: 1 },
  searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 4 },
  // Qo'ng'iroq ustidagi hisoblagich — tugma maydonini o'zgartirmasligi kerak.
  bellBadge: { position: "absolute", top: 4, right: 2 },
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
