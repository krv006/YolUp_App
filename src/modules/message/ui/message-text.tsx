import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";
import { tokenizeMessageText, type MessageToken } from "../lib/linkify";

export interface MessageTextProps {
  text: string;
  /** Chiquvchi xabar — matn `on-action` rangida. */
  outgoing?: boolean;
  /** Qidiruvda topilgan xabar — mos bo'laklar qalin va ko'k. */
  highlight?: string;
}

/** Backend dars tugagach shu ko'rinishdagi havola yuboradi. */
const RECORDING_PATH = /^\/recordings\//;

function markMatches(value: string, highlight: string | undefined, color: string, keyPrefix: string) {
  const needle = highlight?.trim();
  if (!needle) return value;
  const lower = value.toLowerCase();
  const target = needle.toLowerCase();
  const parts: Array<string | { match: string }> = [];
  let cursor = 0;
  let found = lower.indexOf(target, cursor);
  while (found !== -1) {
    if (found > cursor) parts.push(value.slice(cursor, found));
    parts.push({ match: value.slice(found, found + target.length) });
    cursor = found + target.length;
    found = lower.indexOf(target, cursor);
  }
  if (cursor < value.length) parts.push(value.slice(cursor));
  return parts.map((part, index) =>
    typeof part === "string" ? (
      part
    ) : (
      <DsText key={`${keyPrefix}-${index}`} w="600" style={[styles.copy, { color }]}>
        {part.match}
      </DsText>
    )
  );
}

/**
 * Xabar matni — veb `message-text.tsx`: `text-[15px]/[22px]`, havolalar
 * tagiga chizilgan, qidiruvdagi mos bo'laklar `font-semibold text-brand`.
 * Dars yozuvi havolasi matndan ajratilib, ostida alohida karta bo'ladi.
 *
 * Ichki havolalar ilova ichida, tashqilari brauzerda ochiladi;
 * `tokenizeMessageText` HTML yasamaydi — injeksiya xavfi yo'q.
 */
export function MessageText({ text, outgoing = false, highlight }: MessageTextProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const router = useRouter();
  const tokens = useMemo(() => tokenizeMessageText(text), [text]);

  const isRecording = (token: MessageToken): token is Extract<MessageToken, { kind: "internal" }> =>
    token.kind === "internal" && RECORDING_PATH.test(token.href);
  const recordings = tokens.filter(isRecording);
  const inline: MessageToken[] = tokens.filter((token) => !isRecording(token));
  const hasCopy = inline.some((token) => token.kind !== "text" || token.value.trim() !== "");
  const color = outgoing ? ds.c["on-action"] : ds.c.ink;

  return (
    <>
      {hasCopy ? (
        <DsText selectable style={[styles.copy, { color }]}>
          {inline.map((token, index) => {
            if (token.kind === "text") return markMatches(token.value, highlight, outgoing ? color : ds.c.brand, String(index));
            return (
              <DsText
                key={index}
                accessibilityRole="link"
                onPress={() => (token.kind === "internal" ? router.push(token.href as never) : void Linking.openURL(token.href))}
                style={[styles.copy, styles.link, { color }]}
              >
                {token.value}
              </DsText>
            );
          })}
        </DsText>
      ) : null}

      {recordings.map((token, index) => (
        <Pressable
          key={`recording-${index}`}
          accessibilityRole="link"
          onPress={() => router.push(token.href as never)}
          style={({ pressed }) => [styles.recording, { borderColor: ds.c.line, backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
        >
          <View style={[styles.recordingIcon, { backgroundColor: ds.c.action }]}>
            <Icon name="camera" size={19} color={ds.c["on-action"]} />
          </View>
          <View style={styles.grow}>
            <DsText v="label-strong" numberOfLines={1}>
              {t("text.viewRecording")}
            </DsText>
            <DsText v="caption" c="ink-tertiary" numberOfLines={1}>
              {t("text.recordingHint")}
            </DsText>
          </View>
          <Icon name="chevron-right" size={18} color={ds.c["ink-tertiary"]} />
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  copy: { fontSize: 15, lineHeight: 22 },
  link: { textDecorationLine: "underline" },
  grow: { flex: 1, minWidth: 0 },
  /* `w-full gap-3 rounded-xl border bg-surface p-2.5` */
  recording: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderWidth: 1, borderRadius: dsRadius.xl },
  recordingIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
