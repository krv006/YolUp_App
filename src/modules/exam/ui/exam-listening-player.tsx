import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Headphones, Play } from "lucide-react-native";
import { useQuizColors } from "@/modules/quiz";
import { storage } from "@/shared/lib";
import type { ExamQuestionGroup } from "@/shared/types";
import { radius, Text, useTheme } from "@/shared/ui";

const GAP_MS = 4000;
const FIRST_DELAY_MS = 800;

const playedKey = (examId: string, groupId: string) => `exam-audio-played:${examId}:${groupId}`;
const wasPlayed = (examId: string, groupId: string) => storage.get(playedKey(examId, groupId)) === "1";
const markPlayed = (examId: string, groupId: string) => storage.set(playedKey(examId, groupId), "1");

export interface ExamListeningPlayerProps {
  examId: string;
  groups: ExamQuestionGroup[];
}

/**
 * Listening pleyeri — veb `exam-listening-player.tsx` porti: bo'limdagi
 * audiolar tartib bilan O'ZI boshlanadi va bir marta eshittiriladi;
 * to'xtatib, o'tkazib yoki qaytarib bo'lmaydi. "Eshitildi" belgisi
 * vebdagi `localStorage` o'rniga MMKV'da saqlanadi.
 */
export function ExamListeningPlayer({ examId, groups }: ExamListeningPlayerProps) {
  const queue = useMemo(() => groups.filter((group) => group.audioUrl), [groups]);
  const [index, setIndex] = useState(() => queue.findIndex((group) => !wasPlayed(examId, group.id)));
  const done = index < 0 || index >= queue.length;
  const group = done ? null : queue[index];

  if (!queue.length) return null;
  return (
    <ExamAudioPart
      key={group?.id ?? "done"}
      examId={examId}
      group={group}
      number={done ? queue.length : index + 1}
      total={queue.length}
      first={index === 0}
      onEnded={() =>
        setIndex((current) => {
          const next = queue.findIndex((item, position) => position > current && !wasPlayed(examId, item.id));
          return next < 0 ? queue.length : next;
        })
      }
    />
  );
}

type PartState = "gap" | "tap" | "playing";

function ExamAudioPart({
  examId,
  group,
  number,
  total,
  first,
  onEnded,
}: {
  examId: string;
  group: ExamQuestionGroup | null;
  number: number;
  total: number;
  first: boolean;
  onEnded: () => void;
}) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const colors = useQuizColors();
  const player = useAudioPlayer(group?.audioUrl ? { uri: group.audioUrl } : null);
  const status = useAudioPlayerStatus(player);
  // Ijro boshlanmasa (avtomatik ijro bloklansa) — "Boshlash" tugmasi.
  const [blocked, setBlocked] = useState(false);
  const state: PartState = status.playing ? "playing" : blocked ? "tap" : "gap";
  const endedRef = useRef(false);
  const label = group?.title || t("runner.audioPart", { number });

  const groupId = group?.id;
  useEffect(() => {
    if (!groupId) return undefined;
    const timer = setTimeout(
      () => {
        try {
          player.play();
        } catch {
          setBlocked(true);
        }
      },
      first ? FIRST_DELAY_MS : GAP_MS
    );
    return () => clearTimeout(timer);
  }, [groupId, first, player]);

  // O'ynay boshlaganda — "eshitildi"; tugaganda keyingi qismga.
  useEffect(() => {
    if (!group) return;
    if (status.playing) markPlayed(examId, group.id);
    if (status.didJustFinish && !endedRef.current) {
      endedRef.current = true;
      onEnded();
    }
  }, [status.playing, status.didJustFinish, group, examId, onEnded]);

  const progress = status.duration > 0 ? Math.min(100, (status.currentTime / status.duration) * 100) : 0;
  const box = [
    styles.root,
    {
      backgroundColor: colors.surfaceTint,
      borderColor: state === "playing" ? palette.primary : colors.border,
    },
  ];

  if (!group) {
    return (
      <View style={box}>
        <Headphones size={18} color={colors.foreground} />
        <View style={styles.main}>
          <Text variant="label">{t("runner.audioAllDone")}</Text>
          <View style={[styles.bar, { backgroundColor: colors.border }]}>
            <View style={[styles.fill, { width: "100%", backgroundColor: palette.primary }]} />
          </View>
          <Text variant="caption" style={{ color: colors.muted }}>
            {t("runner.audioOnce")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={box}>
      <Headphones size={18} color={colors.foreground} />
      <View style={styles.main}>
        {state === "tap" ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => player.play()}
            style={[styles.start, { backgroundColor: palette.primary }]}
          >
            <Play size={15} color={palette["primary-foreground"]} />
            <Text variant="caption" style={[styles.startText, { color: palette["primary-foreground"] }]}>
              {t("runner.audioStartPart", { label })}
            </Text>
          </Pressable>
        ) : (
          <Text variant="label">
            {state === "playing" ? t("runner.audioPlayingPart", { label }) : t("runner.audioNext", { label })}
          </Text>
        )}
        <View style={[styles.bar, { backgroundColor: colors.border }]}>
          <View style={[styles.fill, { width: `${progress}%`, backgroundColor: palette.primary }]} />
        </View>
        <Text variant="caption" style={{ color: colors.muted }}>
          {t("runner.audioOnce")} · {t("runner.audioPartsCount", { current: number, total })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* `.exam-listening` — bo'shliq 10/14, radius 16, chegara 1, oraliq 12 */
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 16,
  },
  main: { flex: 1, minWidth: 0, gap: 6 },
  start: {
    alignSelf: "flex-start",
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    borderRadius: radius.full,
  },
  startText: { fontSize: 13, fontWeight: "700" },
  bar: { height: 6, borderRadius: 999, overflow: "hidden" },
  fill: { height: "100%" },
});
