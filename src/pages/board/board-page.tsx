import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Download, Send } from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { boardApi, BoardSurface } from "@/modules/board";
import { useConversations } from "@/modules/conversation";
import { useLesson } from "@/modules/lesson";
import { messageApi } from "@/modules/message";
import { ROLES } from "@/shared/constants";
import { downloadBlob, toUploadFile, writeBlobToCache } from "@/shared/lib";
import { radius, Screen, ScreenLoading, Text, ThemeScope, toast, useTheme } from "@/shared/ui";
import { LiveRoomState } from "@/widgets/live-room/live-room-state";

/**
 * Doska sahifasi — veb `pages/board/board-page.tsx`. Dars tugagach chatdagi
 * `.../boards/<lesson_id>` havolasi shu yerga tushadi: qorong'i sarlavha,
 * doska va pastda "Chatga yuborish" / "PDF yuklab olish".
 */
export function BoardPage() {
  const { t } = useTranslation("board");
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = useLesson(lessonId ?? null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (lesson.isLoading || (!lesson.isError && !lesson.data))
    return (
      <ThemeScope scheme="dark">
        <Screen>
          <ScreenLoading label={t("page.loading")} />
        </Screen>
      </ThemeScope>
    );

  if (lesson.isError || !lesson.data)
    return (
      <LiveRoomState
        title={t("page.notFound")}
        description={lesson.error?.message}
        actionLabel={t("status.retry")}
        onAction={() => void lesson.refetch()}
        onBack={goBack}
      />
    );

  return (
    <ThemeScope scheme="dark">
      <BoardPageBody lessonId={lesson.data.id} onBack={goBack} />
    </ThemeScope>
  );
}

function BoardPageBody({ lessonId, onBack }: { lessonId: string; onBack: () => void }) {
  const { t } = useTranslation("board");
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const lesson = useLesson(lessonId);
  const conversations = useConversations(user?.role === ROLES.TEACHER ? "teacher" : "student");
  const [busy, setBusy] = useState<"pdf" | "chat" | null>(null);
  const data = lesson.data;
  if (!data) return null;
  const current = data;

  async function downloadPdf() {
    setBusy("pdf");
    try {
      const blob = await boardApi.downloadPdf(current.id);
      await downloadBlob(blob as Blob, `${current.title}.pdf`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("page.pdfFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function sendToChat() {
    const room = (conversations.data ?? []).find((item) => item.courseId === current.courseId);
    if (!room) {
      toast.error(t("page.roomNotFound"));
      return;
    }
    setBusy("chat");
    try {
      const blob = (await boardApi.downloadPdf(current.id)) as Blob;
      const name = `${current.title}.pdf`;
      const cached = await writeBlobToCache(blob, name);
      const file = toUploadFile({ uri: cached.uri, name, size: cached.size, mimeType: "application/pdf" });
      await messageApi.send(room.id, { text: t("page.chatMessage", { title: current.title }), file });
      toast.success(t("page.sentToChat"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("page.sendFailed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.background, paddingTop: insets.top }]}>
      {/* `px-5 pt-4 pb-3 gap-3` */}
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("page.back")} onPress={onBack} style={styles.back}>
          <ArrowLeft size={20} color={palette["muted-foreground"]} />
        </Pressable>
        <View style={styles.grow}>
          <View style={styles.titleRow}>
            <View style={styles.dot} />
            <Text variant="body" numberOfLines={1} style={[styles.grow, styles.heading]}>
              {current.title}
            </Text>
          </View>
          <Text variant="caption" numberOfLines={1} style={[styles.caption, { color: palette["subtle-foreground"] }]}>
            {current.courseTitle} · {current.date} · {current.time}
          </Text>
        </View>
      </View>

      <View style={[styles.body, { paddingBottom: 20 + insets.bottom }]}>
        <BoardSurface
          lessonId={current.id}
          courseId={current.courseId}
          statusNote={current.status === "finished" ? t("page.lessonFinished") : undefined}
          footerActions={
            <>
              <Pressable
                accessibilityRole="button"
                disabled={busy !== null}
                onPress={() => void sendToChat()}
                style={[styles.action, styles.secondary, { borderColor: palette.border, backgroundColor: palette.surface }, busy !== null && styles.dim]}
              >
                <Send size={16} color={palette.foreground} />
                <Text variant="label">{t("page.sendToChat")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={busy !== null}
                onPress={() => void downloadPdf()}
                style={[styles.action, { backgroundColor: palette.primary }, busy !== null && styles.dim]}
              >
                <Download size={16} color={palette["primary-foreground"]} />
                <Text variant="label" style={{ color: palette["primary-foreground"] }}>
                  {t("page.downloadPdf")}
                </Text>
              </Pressable>
            </>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  caption: { fontWeight: "500" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  back: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heading: { fontFamily: "Unbounded-SemiBold", fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: "#35c493" },
  /* `px-5 pb-5` */
  body: { flex: 1, paddingHorizontal: 20 },
  action: { height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, borderRadius: radius.full },
  secondary: { borderWidth: 1 },
  dim: { opacity: 0.6 },
});
