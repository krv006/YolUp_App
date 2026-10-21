import { useEffect } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Video } from "lucide-react-native";
import { useChatUiStore } from "@/modules/message";
import type { Conversation } from "@/shared/types";
import { Avatar, Icon, IconButton, radius, Text, useTheme } from "@/shared/ui";

export interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void;
  /** Sarlavha bosilganda — suhbat ma'lumoti oynasi. */
  onOpenInfo?: () => void;
  /** Shu guruhda dars ketyapti — tugma darsga olib kiradi. */
  onJoinLive?: () => void;
  socketOffline?: boolean;
}

/**
 * Veb `chat-header.tsx` ning mobil varianti.
 *
 * Qo'shimcha: ulanish holati. Veb'da tab doim ochiq turadi va uzilish kam
 * uchraydi; mobilda esa tarmoq muntazam uziladi va foydalanuvchi nega yangi
 * xabar kelmayotganini bilishi kerak (§9.1).
 */
export function ChatHeader({
  conversation,
  onBack,
  onOpenInfo,
  onJoinLive,
  socketOffline,
}: ChatHeaderProps) {
  const { t } = useTranslation("mobile");
  const { t: tc } = useTranslation("chat");
  const { palette } = useTheme();

  /* Xabar qidiruvi — veb `chat-header.tsx` dagi kabi `chat-ui.store` da. */
  const searchOpen = useChatUiStore((state) => state.searchOpen);
  const setSearchOpen = useChatUiStore((state) => state.setSearchOpen);
  const search = useChatUiStore((state) => state.search);
  const setSearch = useChatUiStore((state) => state.setSearch);
  const searchIndex = useChatUiStore((state) => state.searchIndex);
  const searchCount = useChatUiStore((state) => state.searchCount);
  const stepSearch = useChatUiStore((state) => state.stepSearch);

  // Boshqa suhbatga o'tilganda qidiruv yopiladi — vebdagi kabi.
  useEffect(() => {
    setSearchOpen(false);
    setSearch("");
  }, [conversation.id, setSearchOpen, setSearch]);

  const subtitle = socketOffline
    ? "Ulanish tiklanmoqda…"
    : conversation.type === "group"
      ? `${conversation.memberCount ?? 1} ishtirokchi`
      : conversation.status === "online"
        ? "Hozir onlayn"
        : "Yaqinda faol edi";

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: palette.surface, borderBottomColor: palette.border },
      ]}
    >
      <IconButton
        accessibilityLabel={t("conversation.suhbatlar_royxatiga_qaytish")}
        onPress={onBack}
      >
        <ArrowLeft size={22} color={palette.foreground} />
      </IconButton>

      {searchOpen ? (
        <>
          {/*
           * QIDIRUV HOLATI — veb `chat-header.tsx` dagi kabi: panel o'rnida
           * qidiruv maydoni (48 balandlik, ko'k chegara), "x / y" hisoblagich,
           * oldingi/keyingi va yopish tugmalari (36x36).
           */}
          <View
            style={[
              styles.searchBox,
              { backgroundColor: palette.surface, borderColor: palette.primary },
            ]}
          >
            <Icon name="search" size={18} color={palette["muted-foreground"]} />
            <TextInput
              autoFocus
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => stepSearch(1)}
              returnKeyType="search"
              placeholder={tc("header.searchPlaceholder")}
              placeholderTextColor={palette["muted-foreground"]}
              accessibilityLabel={tc("header.searchPlaceholder")}
              style={[styles.searchInput, { color: palette.foreground }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text variant="label" tone="muted" style={styles.searchCount}>
            {searchCount ? searchIndex + 1 : 0} / {searchCount}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tc("header.searchPrevAria")}
            disabled={!searchCount}
            onPress={() => stepSearch(-1)}
            style={[styles.searchBtn, !searchCount && styles.dim]}
          >
            <View style={styles.flip}>
              <Icon name="chevron-down" size={18} color={palette["muted-foreground"]} />
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tc("header.searchNextAria")}
            disabled={!searchCount}
            onPress={() => stepSearch(1)}
            style={[styles.searchBtn, !searchCount && styles.dim]}
          >
            <Icon name="chevron-down" size={18} color={palette["muted-foreground"]} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tc("header.closeSearchAria")}
            onPress={() => {
              setSearchOpen(false);
              setSearch("");
            }}
            style={styles.searchBtn}
          >
            {/* Vebda ham shunday: "add" ikonkasi 45 gradusga burilgan = x. */}
            <View style={styles.rotate45}>
              <Icon name="add" size={20} color={palette["muted-foreground"]} />
            </View>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${conversation.title} ma'lumotlarini ochish`}
            onPress={onOpenInfo}
            disabled={!onOpenInfo}
            style={({ pressed }) => [styles.identityRow, pressed && { opacity: 0.8 }]}
          >
            <Avatar
              name={conversation.title}
              tone={conversation.avatarTone}
              src={conversation.imageUrl}
              size="md"
              status={conversation.type === "direct" ? conversation.status : undefined}
            />

            <View style={styles.identity}>
              <Text variant="label" numberOfLines={1}>
                {conversation.title}
              </Text>
              <Text
                variant="caption"
                tone={socketOffline ? "danger" : "muted"}
                // Veb: ostki matn 12/16, qalinligi 500 (mobil `caption` 400).
                style={styles.subtitle}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            </View>
          </Pressable>

          {onJoinLive ? (
            <IconButton
              accessibilityLabel={t("conversation.jonli_darsga_kirish")}
              onPress={onJoinLive}
            >
              <Video size={22} color={palette.destructive} />
            </IconButton>
          ) : null}

          {/*
           * Qidiruv — vebdagi kabi 40x40, oq fon, 1px chegara. Xabarlar
           * bo'yicha qidiruv mobilda hali yozilmagan, tugma hozircha
           * ko'rinish uchun.
           */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("conversation.xabarlardan_qidirish")}
            onPress={() => setSearchOpen(true)}
            style={({ pressed }) => [
              styles.action,
              styles.action40,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Icon name="search" size={22} color={palette.foreground} />
          </Pressable>

          {/* Vebdagi "..." tugmasi — u ham suhbat ma'lumotini ochadi. */}
          {onOpenInfo ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("conversation.suhbat_malumoti")}
              onPress={onOpenInfo}
              style={({ pressed }) => [
                styles.action,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Icon name="more" size={24} color={palette.foreground} />
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /*
   * O'lchamlar veb DOM'idan (390px): panel 64 balandlik, OQ fon,
   * pastki chegara 1px, bo'shliq 0 12, oraliq 8; ichki tugma 44x44,
   * radius 999, oq fon va 1px chegara.
   */
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    gap: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  identityRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  identity: { flex: 1, gap: 2 },
  subtitle: { fontWeight: "500" },
  /* Qidiruv holati — veb: maydon 48 balandlik radius 20, tugmalar 36x36. */
  searchBox: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 16, lineHeight: 24, padding: 0 },
  searchCount: { fontWeight: "400" },
  searchBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.4 },
  flip: { transform: [{ rotate: "180deg" }] },
  rotate45: { transform: [{ rotate: "45deg" }] },
  /* Veb: qidiruv 40x40, "..." 44x44. */
  action40: { width: 40, height: 40 },
  action: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
