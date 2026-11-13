import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRecordingChoice, useSetRecordingChoice } from "@/modules/lesson";
import { DsText, dsRadius, MobileButton, Sheet, Switch, useDs } from "@/shared/ui";

export interface RecordingStartSheetProps {
  lessonId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Dars yozuvi tanlovi — veb `recording-start-dialog.tsx` ning tor ekran
 * shoxi (`withScreen=false`): "yozuv guruhga yuborilsin" kaliti va bitta
 * "Davom etish" tugmasi. Yopilganda tanlov saqlanadi (`recording-choice`),
 * yakunlashda qayta so'ralmaydi. Telefonda ekran ulashib yozish shoxi yo'q —
 * yozuv server tomonda.
 */
export function RecordingStartSheet({ lessonId, open, onClose }: RecordingStartSheetProps) {
  const { t } = useTranslation("live");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const choice = useRecordingChoice(lessonId).data;
  const save = useSetRecordingChoice(lessonId);
  const [post, setPost] = useState<boolean | null>(null);
  const value = post ?? choice?.postRecording ?? true;

  function later() {
    if (!choice?.decided || choice.postRecording !== value) save.mutate(value);
    onClose();
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={later}
      title={t("recordingStart.mobileTitle")}
      description={t("recordingStart.mobileText")}
      footer={<MobileButton label={t("recordingStart.continue")} onPress={later} />}
    >
      {/* `rounded-xl bg-subtle px-4 py-3 gap-3` */}
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={tl("finishDialog.postRecording")}
        onPress={() => setPost(!value)}
        style={[styles.row, { backgroundColor: ds.c.subtle }]}
      >
        <View style={styles.grow}>
          <DsText v="body-sm" w="500">
            {tl("finishDialog.postRecording")}
          </DsText>
          <DsText v="caption" c="ink-secondary">
            {value ? tl("finishDialog.postRecordingHint") : tl("finishDialog.keepRecordingHint")}
          </DsText>
        </View>
        <Switch
          checked={value}
          onCheckedChange={setPost}
          accessibilityLabel={tl("finishDialog.postRecording")}
        />
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: dsRadius.xl,
  },
  grow: { flex: 1, minWidth: 0 },
});
