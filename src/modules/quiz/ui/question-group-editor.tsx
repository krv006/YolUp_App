import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { FileAudio, Pause, Play, Plus, Trash2 } from "lucide-react-native";
import { pickDocument, toUploadFile } from "@/shared/lib";
import type { QuizGroup } from "@/shared/types";
import { radius, Text, toast, useTheme } from "@/shared/ui";
import type { GroupDraft } from "../lib/question-draft";

const AUDIO_TYPES = [".mp3", ".m4a", ".aac", ".ogg", ".wav"];
/** Android fayl tanlagichi kengaytmani emas, MIME ni tushunadi. */
const AUDIO_MIME = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/wav", "audio/x-wav"];
const MAX_AUDIO_MB = 60;
const BARS = Array.from({ length: 48 }, (_, index) => 6 + ((index * 7) % 18));

export interface QuestionGroupEditorProps {
  groups: GroupDraft[];
  savedGroups: QuizGroup[];
  uploading: boolean;
  onChange: (groups: GroupDraft[]) => void;
  onUploadAudio?: (groupId: string, file: File) => void;
  onRemoveAudio?: (groupId: string) => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

/**
 * Audio pleyer — veb `AudioPlayer` (`<audio>` + to'lqin chiziqlari),
 * mobilda `expo-audio` bilan.
 */
function AudioPlayer({ src, name, onRemove }: { src: string; name: string; onRemove?: () => void }) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const player = useAudioPlayer({ uri: src });
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || 0;
  const position = status.currentTime || 0;
  const progress = duration ? position / duration : 0;

  return (
    <View style={[styles.player, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <View style={styles.playerHead}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status.playing ? t("groups.audioPause") : t("groups.audioPlay")}
          onPress={() => {
            if (status.playing) player.pause();
            else {
              if (status.didJustFinish) void player.seekTo(0);
              player.play();
            }
          }}
          style={[styles.play, { backgroundColor: palette.primary }]}
        >
          {status.playing ? (
            <Pause size={18} color={palette["primary-foreground"]} />
          ) : (
            <Play size={18} color={palette["primary-foreground"]} />
          )}
        </Pressable>
        <View style={styles.grow}>
          <Text variant="label" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="caption" style={[styles.numeric, { color: palette["subtle-foreground"] }]}>
            {formatTime(duration)}
          </Text>
        </View>
        {onRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("groups.removeAudio")}
            onPress={onRemove}
            style={({ pressed }) => [
              styles.remove,
              pressed && { backgroundColor: palette["destructive-soft"] },
            ]}
          >
            <Trash2 size={17} color={palette["destructive-strong"]} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.bars}>
        {BARS.map((height, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              { height, backgroundColor: index / BARS.length <= progress ? palette.primary : palette.muted },
            ]}
          />
        ))}
      </View>

      <View style={styles.times}>
        <Text variant="caption" style={[styles.numeric, { color: palette["subtle-foreground"] }]}>
          {formatTime(position)}
        </Text>
        <Text variant="caption" style={[styles.grow, styles.center, { color: palette.primary }]}>
          {t("groups.playOnce")}
        </Text>
        <Text variant="caption" style={[styles.numeric, { color: palette["subtle-foreground"] }]}>
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

/**
 * Savollar guruhi muharriri — veb `modules/quiz/ui/question-group-editor.tsx`
 * porti: `rounded-2xl bg-action-subtle/40 p-4 gap-3`, ichida guruh
 * kartalari (`rounded-xl bg-surface p-3`).
 */
export function QuestionGroupEditor({
  groups,
  savedGroups,
  uploading,
  onChange,
  onUploadAudio,
  onRemoveAudio,
}: QuestionGroupEditorProps) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const [pendingName, setPendingName] = useState<Record<string, string>>({});
  const [openTranscript, setOpenTranscript] = useState<Record<string, boolean>>({});

  function update(key: string, patch: Partial<GroupDraft>) {
    onChange(groups.map((group) => (group.key === key ? { ...group, ...patch } : group)));
  }

  async function pickAudio(group: GroupDraft) {
    if (!group.id) return;
    const picked = await pickDocument(AUDIO_MIME);
    if (!picked) return;
    const extension = `.${picked.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!AUDIO_TYPES.includes(extension)) {
      toast.error(t("groups.audioFormat", { list: AUDIO_TYPES.join(", ") }));
      return;
    }
    const file = toUploadFile(picked);
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      toast.error(t("groups.audioTooBig", { size: MAX_AUDIO_MB }));
      return;
    }
    setPendingName((current) => ({ ...current, [group.key]: picked.name }));
    onUploadAudio?.(group.id, file);
  }

  const inputStyle = { borderColor: palette.border, backgroundColor: palette.surface, color: palette.foreground };

  return (
    // `bg-action-subtle/40` — action-subtle 40% shaffoflikda.
    <View style={[styles.root, { backgroundColor: "rgba(238, 242, 255, 0.4)" }]}>
      <View style={styles.head}>
        <Text variant="label">{t("groups.title")}</Text>
        <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
          {t("groups.hint")}
        </Text>
      </View>

      {groups.map((group, index) => {
        const saved = group.id ? savedGroups.find((item) => item.id === group.id) : null;
        const pending = uploading && pendingName[group.key];
        return (
          <View key={group.key} style={[styles.group, { backgroundColor: palette.surface }]}>
            <View style={styles.titleRow}>
              <View style={[styles.index, { backgroundColor: palette["surface-subtle"] }]}>
                <Text variant="caption" style={[styles.strong, { color: palette["muted-foreground"] }]}>
                  {index + 1}
                </Text>
              </View>
              <TextInput
                value={group.title}
                onChangeText={(title) => update(group.key, { title })}
                placeholder={t("groups.titlePlaceholder", { number: index + 1 })}
                placeholderTextColor={palette["subtle-foreground"]}
                style={[styles.titleInput, inputStyle]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("groups.removeAria")}
                onPress={() => onChange(groups.filter((item) => item.key !== group.key))}
                style={({ pressed }) => [
                  styles.trash,
                  { backgroundColor: pressed ? palette.muted : palette["surface-subtle"] },
                ]}
              >
                <Trash2 size={16} color={palette["muted-foreground"]} />
              </Pressable>
            </View>

            <TextInput
              multiline
              textAlignVertical="top"
              value={group.passage}
              onChangeText={(passage) => update(group.key, { passage })}
              placeholder={t("groups.passagePlaceholder")}
              placeholderTextColor={palette["subtle-foreground"]}
              style={[styles.passage, inputStyle]}
            />

            {group.id ? (
              <View style={styles.audio}>
                {saved?.audioUrl ? (
                  <AudioPlayer
                    src={saved.audioUrl}
                    name={pendingName[group.key] ?? t("groups.audioFile")}
                    onRemove={() => onRemoveAudio?.(group.id as string)}
                  />
                ) : null}

                {pending ? (
                  <View style={[styles.player, { borderColor: palette.border, backgroundColor: palette.surface }]}>
                    <View style={styles.playerHead}>
                      <View style={[styles.fileIcon, { backgroundColor: palette["surface-subtle"] }]}>
                        <FileAudio size={17} color={palette["muted-foreground"]} />
                      </View>
                      <View style={styles.grow}>
                        <Text variant="label" numberOfLines={1}>
                          {pendingName[group.key]}
                        </Text>
                        <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                          {t("groups.uploadingAudio")}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.progress, { backgroundColor: palette["surface-subtle"] }]}>
                      <View style={[styles.progressFill, { backgroundColor: palette.primary }]} />
                    </View>
                  </View>
                ) : saved?.audioUrl ? null : (
                  <Pressable
                    accessibilityRole="button"
                    disabled={uploading}
                    onPress={() => void pickAudio(group)}
                    style={({ pressed }) => [
                      styles.upload,
                      {
                        borderColor: palette.border,
                        backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
                        opacity: uploading ? 0.5 : 1,
                      },
                    ]}
                  >
                    <FileAudio size={16} color={palette.foreground} />
                    <Text variant="label">{t("groups.uploadAudio")}</Text>
                  </Pressable>
                )}

                <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                  {t("groups.audioHint", { size: MAX_AUDIO_MB })}
                </Text>

                {saved?.transcript ? (
                  <View style={[styles.transcript, { backgroundColor: palette["surface-subtle"] }]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: Boolean(openTranscript[group.key]) }}
                      onPress={() =>
                        setOpenTranscript((current) => ({ ...current, [group.key]: !current[group.key] }))
                      }
                    >
                      <Text variant="label">{t("groups.transcriptToggle")}</Text>
                    </Pressable>
                    {openTranscript[group.key] ? (
                      <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
                        {saved.transcript}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : (
              <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                {t("groups.audioAfterSave")}
              </Text>
            )}
          </View>
        );
      })}

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          onChange([...groups, { key: `g${Date.now()}${groups.length}`, id: null, title: "", passage: "" }])
        }
        style={({ pressed }) => [styles.add, pressed && { backgroundColor: palette["primary-soft"] }]}
      >
        <Plus size={16} color={palette.primary} />
        <Text variant="label" style={{ color: palette.primary }}>
          {t("groups.add")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  strong: { fontWeight: "600" },
  numeric: { fontVariant: ["tabular-nums"] },
  /* `rounded-2xl p-4 gap-3` */
  root: { gap: 12, padding: 16, borderRadius: radius["2xl"] },
  head: { gap: 2 },
  /* `rounded-xl bg-surface p-3 gap-3` */
  group: { gap: 12, padding: 12, borderRadius: radius.xl },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  index: { width: 28, height: 28, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  titleInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.xl,
    fontSize: 14,
    fontFamily: "Onest-Regular",
  },
  trash: { width: 40, height: 40, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  passage: {
    minHeight: 90,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: radius.xl,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Onest-Regular",
  },
  audio: { gap: 8 },
  player: { gap: 8, padding: 12, borderWidth: 1, borderRadius: radius.xl },
  playerHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  play: { width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  remove: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  bars: { flexDirection: "row", alignItems: "center", gap: 2 },
  bar: { width: 3, borderRadius: radius.full },
  times: { flexDirection: "row", alignItems: "baseline", gap: 12 },
  fileIcon: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  progress: { height: 6, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { width: "33%", height: "100%", borderRadius: radius.full },
  upload: {
    alignSelf: "flex-start",
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  transcript: { gap: 8, padding: 12, borderRadius: radius.xl },
  /* `h-11 w-fit rounded-xl px-3 gap-2 text-action` */
  add: {
    alignSelf: "flex-start",
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: radius.xl,
  },
});
