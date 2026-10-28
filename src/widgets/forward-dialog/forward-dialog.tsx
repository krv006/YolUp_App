import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useConversations } from "@/modules/conversation";
import type { ChatMessage, ConversationRole } from "@/shared/types";
import { Avatar, bodyFont, DsText, dsType, GroupTile, Icon, MobileButton, Sheet, useDs } from "@/shared/ui";

export interface ForwardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  role?: ConversationRole;
  pending?: boolean;
  onConfirm: (roomIds: string[]) => void;
}

/**
 * Xabarni uzatish — veb `widgets/forward-dialog` ning tor ekran varianti
 * (pastki oyna): qidiruv, suhbatlar ro'yxati (joriy suhbat chiqarilgan),
 * o'ngda belgilash katakchasi va pastda "Yuborish (N)".
 */
export function ForwardDialog({ open, onOpenChange, messages, role = "teacher", pending = false, onConfirm }: ForwardDialogProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const conversations = useConversations(role);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const sourceIds = new Set(messages.map((message) => message.conversationId));
  const needle = search.trim().toLowerCase();
  const items = (conversations.data ?? [])
    .filter((item) => !sourceIds.has(item.id))
    .filter((item) => (needle ? item.title.toLowerCase().includes(needle) : true));

  function close() {
    setSelected([]);
    setSearch("");
    onOpenChange(false);
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t("forward.title")}
      description={t("forward.description", { count: messages.length })}
      footer={
        <MobileButton label={t("forward.submit", { count: selected.length })} disabled={!selected.length || pending} onPress={() => onConfirm(selected)} />
      }
    >
      <View style={styles.body}>
        {/* `h-11 gap-3 px-4.5` */}
        <View style={styles.search}>
          <Icon name="search" size={18} color={ds.c["ink-secondary"]} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("forward.searchPlaceholder")}
            placeholderTextColor={ds.c["ink-secondary"]}
            selectionColor={ds.c.brand}
            style={[styles.input, { color: ds.c.ink }]}
          />
        </View>

        <View>
          {items.map((item) => {
            const checked = selected.includes(item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => setSelected((current) => (checked ? current.filter((id) => id !== item.id) : [...current, item.id]))}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                {item.type === "group" ? (
                  <GroupTile name={item.title} tone={item.avatarTone} src={item.imageUrl} box={44} radius={12} />
                ) : (
                  <Avatar variant="legacy" name={item.title} tone={item.avatarTone} src={item.imageUrl} size="sm" box={44} />
                )}
                <View style={styles.grow}>
                  <DsText v="title" numberOfLines={1}>
                    {item.title}
                  </DsText>
                  {item.memberCount ? (
                    <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                      {t("forward.memberCount", { count: item.memberCount })}
                    </DsText>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.check,
                    checked ? { backgroundColor: ds.c.brand } : { borderWidth: 2, borderColor: ds.c["line-strong"], backgroundColor: ds.c.surface },
                  ]}
                >
                  {checked ? <Icon name="check" size={14} color={ds.c["ink-inverse"]} /> : null}
                </View>
              </Pressable>
            );
          })}
          {!items.length ? (
            <DsText v="body-sm" c="ink-tertiary" style={styles.empty}>
              {t("forward.empty")}
            </DsText>
          ) : null}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.8 },
  /* `-mt-0.5 gap-5` */
  body: { marginTop: -2, gap: 20 },
  search: { height: 44, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18 },
  input: { flex: 1, minWidth: 0, height: "100%", padding: 0, fontSize: dsType["body-sm"].fontSize, fontFamily: bodyFont("400") },
  /* `items-center gap-3 py-2.5 pr-2.5` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingRight: 10 },
  check: { width: 22, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  empty: { paddingVertical: 32, textAlign: "center" },
});
