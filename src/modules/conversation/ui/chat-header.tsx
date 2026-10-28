import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
// Barrel emas: `message/index` -> `use-chat` -> `conversation/index` aylanma importi bo'lardi.
import { useChatUiStore } from "@/modules/message/model/chat-ui.store";
import { PinnedMessageBar } from "@/modules/message/ui/pinned-message-bar";
import { useOnlineStatus } from "@/shared/model";
import type { Conversation } from "@/shared/types";
import { Avatar, bodyFont, DsText, dsRadius, dsType, GroupTile, Icon, MobileRoundButton, useDs } from "@/shared/ui";

export interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void;
  /** Sarlavha va "..." bosilganda — suhbat ma'lumoti oynasi. */
  onOpenInfo?: () => void;
  /** Ovozli xona tugmasi (faqat guruh chatida, xona ochilmagan bo'lsa). */
  onVoice?: () => void;
  /** Guruh ish maydoni — qadalgan xabar tablar ostida chiziladi. */
  workspace?: boolean;
  /** Qadalgan xabarni olib tashlash. */
  onUnpin?: (messageId: string) => void;
  /** Holat paneli balandligi — sarlavha (tanlash rejimida oq fon ham) undan pastda boshlanadi. */
  topInset?: number;
}

/**
 * Suhbat sarlavhasi — veb `conversation/ui/chat-header.tsx` ning tor ekran
 * varianti: 44px dumaloq tugmalar (`bg-subtle`), guruh rasmi yoki avatar,
 * ostida a'zolar soni. Xabar tanlanganda o'rnini tanlash sarlavhasi
 * egallaydi; qidiruvda maydon, "i / n" hisoblagich va o'tish tugmalari.
 */
export function ChatHeader({ conversation, onBack, onOpenInfo, onVoice, workspace = false, onUnpin, topInset = 0 }: ChatHeaderProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const online = useOnlineStatus();
  const search = useChatUiStore((state) => state.search);
  const searchOpen = useChatUiStore((state) => state.searchOpen);
  const setSearchOpen = useChatUiStore((state) => state.setSearchOpen);
  const setSearch = useChatUiStore((state) => state.setSearch);
  const searchIndex = useChatUiStore((state) => state.searchIndex);
  const searchCount = useChatUiStore((state) => state.searchCount);
  const stepSearch = useChatUiStore((state) => state.stepSearch);
  const selectedCount = useChatUiStore((state) => state.selected.length);
  const clearSelection = useChatUiStore((state) => state.clearSelection);

  useEffect(() => {
    setSearchOpen(false);
    setSearch("");
  }, [conversation.id, setSearchOpen, setSearch]);

  function closeSearch() {
    setSearchOpen(false);
    setSearch("");
  }

  if (selectedCount) {
    return (
      <View style={[styles.selection, { backgroundColor: ds.c.surface, paddingTop: 20 + topInset }]}>
        <MobileRoundButton icon="close" label={t("actionsMenu.cancelSelection")} onPress={clearSelection} />
        <DsText v="title-lg" numberOfLines={1} style={styles.grow}>
          {t("actionsMenu.selectedMessages", { count: selectedCount })}
        </DsText>
        <Pressable accessibilityRole="button" onPress={clearSelection} hitSlop={10}>
          <DsText v="body-sm" w="600" c="brand-strong">
            {t("actionsMenu.cancelShort")}
          </DsText>
        </Pressable>
      </View>
    );
  }

  const subtitle =
    conversation.type === "group"
      ? [
          t("header.memberCount", { count: conversation.memberCount ?? 1 }),
          conversation.onlineCount ? t("header.onlineCount", { count: conversation.onlineCount }) : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : conversation.status === "online"
        ? t("header.online")
        : t("header.recentlyActive");

  return (
    <>
      <View style={[styles.header, { gap: searchOpen ? 6 : 10, paddingTop: 20 + topInset }]}>
        <MobileRoundButton icon="chevron-left" label={t("header.backAria")} onPress={onBack} />

        {searchOpen ? (
          <>
            {/* `h-11 w-18.5 rounded-full bg-surface px-3.5 gap-2` */}
            <View style={[styles.searchField, { backgroundColor: ds.c.surface }]}>
              <Icon name="search" size={20} color={ds.c.ink} />
              <TextInput
                autoFocus
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={() => stepSearch(1)}
                returnKeyType="search"
                placeholder={t("header.searchPlaceholder")}
                placeholderTextColor={ds.c["ink-tertiary"]}
                accessibilityLabel={t("header.searchPlaceholder")}
                selectionColor={ds.c.brand}
                autoCapitalize="none"
                autoCorrect={false}
                numberOfLines={1}
                style={[styles.searchInput, { color: ds.c.ink }]}
              />
            </View>
            <DsText v="body-xs" numeric style={styles.searchCount}>
              {searchCount ? searchIndex + 1 : 0} / {searchCount}
            </DsText>
            <MobileRoundButton
              label={t("header.searchPrevAria")}
              disabled={!searchCount}
              onPress={() => stepSearch(-1)}
              iconNode={
                <View style={styles.flip}>
                  <Icon name="chevron-down" size={22} color={ds.c.ink} />
                </View>
              }
            />
            <MobileRoundButton icon="chevron-down" label={t("header.searchNextAria")} disabled={!searchCount} onPress={() => stepSearch(1)} />
            {onVoice ? <MobileRoundButton icon="volume" label={t("header.voiceAria")} onPress={onVoice} /> : null}
            <MobileRoundButton icon="close" label={t("header.closeSearchAria")} onPress={closeSearch} />
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("header.openInfoAria", { title: conversation.title })}
            disabled={!onOpenInfo}
            onPress={onOpenInfo}
            style={({ pressed }) => [styles.identity, pressed && styles.pressed]}
          >
            {conversation.type === "group" ? (
              <GroupTile name={conversation.title} tone={conversation.avatarTone} src={conversation.imageUrl} box={44} radius={dsRadius.lg} />
            ) : (
              <Avatar variant="legacy" name={conversation.title} tone={conversation.avatarTone} src={conversation.imageUrl} size="md" status={conversation.status} />
            )}
            <View style={styles.grow}>
              <DsText v="title" numberOfLines={1}>
                {conversation.title}
              </DsText>
              <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                {subtitle}
              </DsText>
            </View>
          </Pressable>
        )}

        {searchOpen || conversation.type === "group" ? null : (
          <MobileRoundButton icon="search" iconSize={20} label={t("header.searchAria")} onPress={() => setSearchOpen(true)} />
        )}

        {onVoice && !searchOpen && online ? <MobileRoundButton icon="volume" label={t("header.voiceAria")} onPress={onVoice} /> : null}

        {searchOpen ? null : (
          <MobileRoundButton
            icon="more"
            iconSize={20}
            label={t("header.openInfoAria", { title: conversation.title })}
            disabled={!onOpenInfo}
            onPress={() => onOpenInfo?.()}
          />
        )}
      </View>

      {workspace ? null : <PinnedMessageBar roomId={conversation.id} onUnpin={onUnpin} />}
    </>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.8 },
  /* `items-center gap-3 bg-surface px-4 pt-5 pb-3` */
  selection: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  /* `items-center px-4 pt-5 gap-2.5` (qidiruvda `gap-1.5`) */
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 20 },
  /* `h-11 min-w-0 flex-1 gap-2.5 rounded-xl` */
  identity: { flex: 1, minWidth: 0, height: 44, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: dsRadius.xl },
  searchField: { width: 74, height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, borderRadius: 22 },
  searchInput: { flex: 1, minWidth: 0, height: "100%", padding: 0, fontSize: dsType.body.fontSize, fontFamily: bodyFont("400") },
  searchCount: { marginRight: -2 },
  flip: { transform: [{ rotate: "180deg" }] },
});
