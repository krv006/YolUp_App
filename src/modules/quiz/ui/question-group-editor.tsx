import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { FileAudio, Plus, Trash2, X } from "lucide-react-native";
import { pickDocument, toUploadFile } from "@/shared/lib";
import type { QuizGroup } from "@/shared/types";
import { Button, IconButton, Input, Text, toast, useTheme } from "@/shared/ui";
import type { GroupDraft } from "../lib/question-draft";

const AUDIO_MIME = ["audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/wav", "audio/x-wav"];
const MAX_AUDIO_MB = 60;

export interface QuestionGroupEditorProps {
  groups: GroupDraft[];
  savedGroups: QuizGroup[];
  uploading?: boolean;
  onChange: (groups: GroupDraft[]) => void;
  onUploadAudio?: (groupId: string, file: File) => void;
  onRemoveAudio?: (groupId: string) => void;
}

/**
 * Savollar guruhi: bitta matn yoki audio ostidagi savollar to'plami
 * (IELTS Reading/Listening, SAT).
 *
 * Audio faqat SAQLANGAN guruhga yuklanadi — serverga guruh `id` si kerak,
 * u esa test saqlangandan keyin paydo bo'ladi.
 */
export function QuestionGroupEditor({
  groups,
  savedGroups,
  uploading = false,
  onChange,
  onUploadAudio,
  onRemoveAudio,
}: QuestionGroupEditorProps) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();

  function update(key: string, patch: Partial<GroupDraft>) {
    onChange(groups.map((group) => (group.key === key ? { ...group, ...patch } : group)));
  }

  async function uploadAudio(groupId: string) {
    const picked = await pickDocument(AUDIO_MIME);
    if (!picked) return;
    if (picked.size && picked.size > MAX_AUDIO_MB * 1024 * 1024) {
      toast.error(t("groups.audioTooBig", { size: MAX_AUDIO_MB }));
      return;
    }
    onUploadAudio?.(groupId, toUploadFile(picked));
  }

  return (
    <View style={styles.root}>
      <Text variant="label">{t("groups.title")}</Text>
      <Text variant="caption" tone="muted">
        {t("groups.hint")}
      </Text>

      {groups.map((group, index) => {
        const saved = group.id ? savedGroups.find((item) => item.id === group.id) : null;
        return (
          <View key={group.key} style={[styles.card, { borderColor: palette.border }]}>
            <View style={styles.head}>
              <View style={styles.title}>
                <Input
                  value={group.title}
                  onChangeText={(value) => update(group.key, { title: value })}
                  placeholder={t("groups.titlePlaceholder", { number: index + 1 })}
                />
              </View>
              <IconButton
                accessibilityLabel={t("groups.removeAria")}
                onPress={() => onChange(groups.filter((item) => item.key !== group.key))}
              >
                <Trash2 size={17} color={palette.destructive} />
              </IconButton>
            </View>

            <Input
              value={group.passage}
              onChangeText={(value) => update(group.key, { passage: value })}
              placeholder={t("groups.passagePlaceholder")}
              multiline
              numberOfLines={4}
            />

            {group.id ? (
              <View style={styles.audio}>
                {saved?.audioUrl ? (
                  <>
                    <Text variant="caption" tone="muted" style={styles.audioName}>
                      {t("groups.audioReady")}
                    </Text>
                    <IconButton
                      accessibilityLabel={t("groups.removeAudio")}
                      onPress={() => onRemoveAudio?.(group.id as string)}
                    >
                      <X size={16} color={palette.destructive} />
                    </IconButton>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    title={t("groups.uploadAudio")}
                    icon={<FileAudio size={15} color={palette.foreground} />}
                    loading={uploading}
                    onPress={() => void uploadAudio(group.id as string)}
                  />
                )}
              </View>
            ) : (
              <Text variant="caption" tone="muted">
                {t("groups.audioAfterSave")}
              </Text>
            )}
          </View>
        );
      })}

      <Button
        variant="secondary"
        title={t("groups.add")}
        icon={<Plus size={15} color={palette.foreground} />}
        onPress={() =>
          onChange([
            ...groups,
            { key: `g${Date.now()}${groups.length}`, id: null, title: "", passage: "" },
          ])
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  card: { gap: 8, padding: 10, borderWidth: 1, borderRadius: 13 },
  head: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { flex: 1 },
  audio: { flexDirection: "row", alignItems: "center", gap: 8 },
  audioName: { flex: 1 },
});
