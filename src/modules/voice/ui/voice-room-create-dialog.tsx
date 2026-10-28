import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { VoiceAccessMode } from "@/shared/types";
import { DsText, dsRadius, MobileButton, MobileFieldLabel, MobileInput, MobilePickerField, Sheet, useDs } from "@/shared/ui";
import type { VoiceRoomFormValues } from "../api/voice.dto";

const ACCESS_MODES: VoiceAccessMode[] = ["open", "invite_only"];

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export interface VoiceRoomCreateDialogProps {
  courseId: string;
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: VoiceRoomFormValues) => void;
}

/**
 * Ovozli xona ochish — veb `voice-room-create-dialog.tsx` ning tor ekran
 * varianti: nom, "Ochiq / Taklif asosida" kartalari, boshlanish vaqti
 * ("Hozir" yoki sana va soat); pastda "Bekor qilish" va "Ochish".
 */
export function VoiceRoomCreateDialog({ courseId, open, pending = false, onOpenChange, onCreate }: VoiceRoomCreateDialogProps) {
  const { t } = useTranslation("voice");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const [title, setTitle] = useState("");
  const [accessMode, setAccessMode] = useState<VoiceAccessMode>("open");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const months = tl("list.months", { returnObjects: true }) as string[];

  function close() {
    setTitle("");
    setAccessMode("open");
    setScheduledAt("");
    setError(null);
    onOpenChange(false);
  }

  function submit() {
    if (!title.trim()) {
      setError(t("createDialog.titleRequired"));
      return;
    }
    if (scheduledAt && new Date(scheduledAt).getTime() < Date.now()) {
      setError(t("createDialog.pastTime"));
      return;
    }
    onCreate({ courseId, title: title.trim(), accessMode, scheduledAt: scheduledAt || null });
  }

  const scheduled = scheduledAt ? new Date(scheduledAt) : null;
  const scheduledLabel =
    scheduled && !Number.isNaN(scheduled.getTime())
      ? `${scheduled.getDate()}-${(months[scheduled.getMonth()] ?? "").toLowerCase()}, ${String(scheduled.getHours()).padStart(2, "0")}:${String(
          scheduled.getMinutes()
        ).padStart(2, "0")}`
      : t("createDialog.now");

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t("createDialog.title")}
      description={t("createDialog.mobileDescription")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("createDialog.cancel")} onPress={close} />
          <MobileButton label={t("createDialog.submit")} disabled={pending} onPress={submit} />
        </>
      }
    >
      <View style={styles.body}>
        <MobileFieldLabel label={t("createDialog.nameLabel")}>
          <MobileInput
            value={title}
            placeholder={t("createDialog.namePlaceholder")}
            onChangeText={(value) => {
              setTitle(value);
              setError(null);
            }}
          />
        </MobileFieldLabel>

        <View accessibilityRole="radiogroup" style={styles.modes}>
          {ACCESS_MODES.map((item) => {
            const selected = accessMode === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setAccessMode(item)}
                style={[styles.mode, selected ? { borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] } : { borderColor: "transparent", backgroundColor: ds.c.subtle }]}
              >
                {/* `size-5.5 rounded-full border-2 bg-surface`, ichida `size-2.5 bg-brand` */}
                <View style={[styles.radio, { backgroundColor: ds.c.surface, borderColor: selected ? ds.c.brand : ds.c["line-strong"] }]}>
                  {selected ? <View style={[styles.radioDot, { backgroundColor: ds.c.brand }]} /> : null}
                </View>
                <View style={styles.grow}>
                  <DsText v="title-sm" w="600" numberOfLines={1}>
                    {item === "open" ? t("createDialog.mobileOpen") : t("access.inviteOnly")}
                  </DsText>
                  <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                    {item === "open" ? t("createDialog.mobileOpenHint") : t("createDialog.mobileInviteHint")}
                  </DsText>
                </View>
              </Pressable>
            );
          })}
        </View>

        <MobileFieldLabel label={t("createDialog.scheduledLabel")}>
          <MobilePickerField
            type="datetime"
            value={scheduledAt}
            display={scheduledLabel}
            min={today()}
            ariaLabel={t("createDialog.scheduledLabel")}
            onChange={(value) => {
              setScheduledAt(value);
              setError(null);
            }}
          />
        </MobileFieldLabel>

        {error ? (
          <View style={[styles.error, { backgroundColor: ds.c["danger-bg"] }]}>
            <DsText v="body-sm" c="error-text">
              {error}
            </DsText>
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  body: { marginTop: -2, gap: 12 },
  modes: { gap: 12 },
  /* `h-17.5 rounded-lg border-[1.5px] pr-4 pl-6.5 gap-6` */
  mode: { height: 70, flexDirection: "row", alignItems: "center", gap: 24, paddingLeft: 26, paddingRight: 16, borderWidth: 1.5, borderRadius: dsRadius.lg },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  error: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.lg },
});
