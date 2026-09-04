import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Check, Search, Send, Users } from "lucide-react-native";
import {
  Avatar,
  Button,
  Chip,
  Input,
  ScreenLoading,
  Separator,
  Sheet,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";
import type { NotificationTarget } from "../api/notification.dto";
import { useSendNotification, useUserSearch } from "../model/notification.queries";

export interface SendNotificationSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Xabar yuborish — veb `send-notification-dialog.tsx` ning mobil varianti.
 *
 * Ikki nishon: HAMMAGA yoki bitta foydalanuvchiga. Veb'da matn CKEditor
 * bilan yozilardi; mobilda oddiy matn maydoni — backend uni baribir `nh3`
 * bilan tozalaydi va telefonda rich-text tahrirlash noqulay.
 */
export function SendNotificationSheet({ open, onClose }: SendNotificationSheetProps) {
  const { palette } = useTheme();
  const [target, setTarget] = useState<NotificationTarget>("all");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  const users = useUserSearch(target === "user" ? query : "");
  const send = useSendNotification();

  function close() {
    setTarget("all");
    setDescription("");
    setQuery("");
    setSelected(null);
    onClose();
  }

  async function submit() {
    if (!description.trim()) return;
    if (target === "user" && !selected) {
      toast.error("Foydalanuvchini tanlang");
      return;
    }
    try {
      await send.mutateAsync({
        description: description.trim(),
        targetType: target,
        userId: target === "user" ? selected?.id : null,
      });
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xabar yuborilmadi");
    }
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Xabar yuborish"
      description="Barcha foydalanuvchilarga yoki bittasiga."
    >
      <View style={styles.targets}>
        <Chip label="Hammaga" selected={target === "all"} onPress={() => setTarget("all")} />
        <Chip label="Bitta odamga" selected={target === "user"} onPress={() => setTarget("user")} />
      </View>

      {target === "user" ? (
        <>
          {selected ? (
            <View style={[styles.selected, { backgroundColor: palette["primary-tint"] }]}>
              <Avatar name={selected.name} size="sm" />
              <Text variant="label" style={styles.selectedName} numberOfLines={1}>
                {selected.name}
              </Text>
              <Text
                accessibilityRole="button"
                onPress={() => setSelected(null)}
                variant="caption"
                tone="danger"
              >
                O'zgartirish
              </Text>
            </View>
          ) : (
            <>
              <Input
                label="Foydalanuvchi qidirish"
                placeholder="Ism yoki login (kamida 2 belgi)"
                icon={<Search size={18} color={palette["muted-foreground"]} />}
                value={query}
                onChangeText={setQuery}
              />

              {users.isLoading && query.trim().length >= 2 ? (
                <ScreenLoading label="Qidirilmoqda…" />
              ) : null}

              {(users.data ?? []).map((user, index) => (
                <View key={user.id}>
                  {index > 0 ? <Separator /> : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSelected({ id: user.id, name: user.name })}
                    style={({ pressed }) => [styles.userRow, pressed && { opacity: 0.85 }]}
                  >
                    <Avatar name={user.name} size="md" />
                    <View style={styles.userBody}>
                      <Text variant="label" numberOfLines={1}>
                        {user.name}
                      </Text>
                      <Text variant="caption" tone="muted" numberOfLines={1}>
                        @{user.username} · {user.role}
                      </Text>
                    </View>
                    <Check size={16} color={palette["muted-foreground"]} />
                  </Pressable>
                </View>
              ))}
            </>
          )}
        </>
      ) : (
        <View style={[styles.allNotice, { backgroundColor: palette["primary-tint"] }]}>
          <Users size={16} color={palette["primary-text"]} />
          <Text variant="caption" tone="brand">
            Xabar barcha foydalanuvchilarga yuboriladi.
          </Text>
        </View>
      )}

      <Input
        label="Xabar matni"
        placeholder="Xabaringizni yozing…"
        value={description}
        onChangeText={setDescription}
        multiline
        inputStyle={styles.textarea}
      />

      <Button
        title="Yuborish"
        size="lg"
        loading={send.isPending}
        disabled={!description.trim() || (target === "user" && !selected)}
        icon={<Send size={16} color={palette["primary-foreground"]} />}
        onPress={() => void submit()}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  targets: { flexDirection: "row", gap: 8 },
  selected: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 13 },
  selectedName: { flex: 1 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  userBody: { flex: 1, gap: 2 },
  allNotice: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 13 },
  textarea: { minHeight: 110, textAlignVertical: "top" },
});
