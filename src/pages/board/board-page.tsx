import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { boardApi, BoardSurface, MobileBoardPageNav, useBoard, useSendBoardToChat } from "@/modules/board";
import { useLesson } from "@/modules/lesson";
import { downloadBlob } from "@/shared/lib";
import { DsText, Icon, PopoverMenu, PopoverMenuItem, ThemeScope, toast, useDs, usePopoverAnchor } from "@/shared/ui";
import { LiveRoomState } from "@/widgets/live-room/live-room-state";

/**
 * Doska sahifasi — veb `pages/board/board-page.tsx` (tor ekran): dars
 * tugagach chatdagi `.../boards/<lesson_id>` havolasi shu yerga tushadi.
 * Chizish mumkin bo'lsa — doskaning o'zi; faqat ko'rish bo'lsa sarlavhada
 * menyu, pastda sahifalar va "PDF yuklab olish" / "Chatga yuborish".
 */
export function BoardPage() {
  const { t } = useTranslation("board");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = useLesson(lessonId ?? null);
  const board = useBoard(lessonId ?? "", { live: false, enabled: Boolean(lessonId) });
  const sendToChat = useSendBoardToChat(lessonId ?? "");
  const { anchorRef, rect, open: openMenu, close: closeMenu } = usePopoverAnchor();
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(0);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (lesson.isLoading || (!lesson.isError && !lesson.data))
    return (
      <View style={[styles.loading, { backgroundColor: ds.c.canvas }]}>
        <ActivityIndicator color={ds.c.brand} />
        <DsText v="body-sm" c="ink-secondary">
          {t("page.loading")}
        </DsText>
      </View>
    );

  if (lesson.isError)
    return (
      <LiveRoomState
        title={t("page.notFound")}
        description={lesson.error?.message}
        actionLabel={t("status.retry")}
        onAction={() => void lesson.refetch()}
        secondaryLabel={t("page.back")}
        onSecondary={goBack}
      />
    );

  const data = lesson.data!;
  const state = board.data ?? null;
  const sheets = state?.sheets ?? [];
  const editable = Boolean(state?.canDraw);
  const day = new Date(`${data.date}T00:00`);
  const dateLabel = Number.isNaN(day.getTime()) ? data.date : `${day.getDate()}-${(months[day.getMonth()] ?? "").toLowerCase()}`;

  async function downloadPdf() {
    setBusy(true);
    try {
      const blob = await boardApi.downloadPdf(data.id);
      await downloadBlob(blob as Blob, `${data.title}.pdf`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("page.pdfFailed"));
    } finally {
      setBusy(false);
    }
  }

  function share() {
    sendToChat.mutate(undefined, { onSuccess: () => toast.success(t("page.sentToChat")) });
  }

  return (
    <ThemeScope scheme="light">
      <View
        style={[
          styles.root,
          { backgroundColor: ds.c.subtle, paddingTop: insets.top + 20, paddingBottom: (editable ? 26 : 49) + insets.bottom },
        ]}
      >
        <BoardSurface
          lessonId={data.id}
          courseId={data.courseId}
          sheetIndex={sheet}
          onSheetChange={setSheet}
          mobile={{
            title: editable ? undefined : data.title,
            subtitle: editable
              ? `${data.courseTitle} · ${t("mobile.liveLesson")}`
              : [data.courseTitle, `${dateLabel}, ${data.time}`, t("page.sheetCount", { count: sheets.length })].join(" · "),
            live: editable && data.status === "live",
            backLabel: t("page.back"),
            onBack: goBack,
            action: editable ? undefined : (
              <View ref={anchorRef} collapsable={false}>
                <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.menu")} onPress={openMenu} style={[styles.round, { backgroundColor: ds.c.surface }]}>
                  <Icon name="more" size={20} color={ds.c.ink} />
                </Pressable>
                <ThemeScope scheme={null}>
                  <PopoverMenu rect={rect} onClose={closeMenu} height={112}>
                    <PopoverMenuItem
                      label={t("page.downloadPdf")}
                      onPress={() => {
                        closeMenu();
                        if (!busy) void downloadPdf();
                      }}
                    />
                    <PopoverMenuItem
                      label={t("page.sendToChat")}
                      onPress={() => {
                        closeMenu();
                        if (!sendToChat.isPending) share();
                      }}
                    />
                  </PopoverMenu>
                </ThemeScope>
              </View>
            ),
            footer: editable ? undefined : (
              <View style={styles.footer}>
                <MobileBoardPageNav
                  height={60}
                  page={sheet + 1}
                  total={Math.max(1, sheets.length)}
                  onPrev={() => setSheet(Math.max(0, sheet - 1))}
                  onNext={() => setSheet(Math.min(sheets.length - 1, sheet + 1))}
                  onPages={() => undefined}
                />
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => void downloadPdf()}
                    style={[styles.action, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: ds.c.surface }, busy && styles.faded]}
                  >
                    <DsText v="title" w="600" numberOfLines={1}>
                      {t("page.downloadPdf")}
                    </DsText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={sendToChat.isPending}
                    onPress={share}
                    style={[styles.action, { backgroundColor: ds.c.brand }, sendToChat.isPending && styles.faded]}
                  >
                    <DsText v="title" w="600" c="on-action" numberOfLines={1}>
                      {t("page.sendToChat")}
                    </DsText>
                  </Pressable>
                </View>
              </View>
            ),
          }}
        />
      </View>
    </ThemeScope>
  );
}

const styles = StyleSheet.create({
  /* `flex-col bg-subtle px-3 pt-5`, pastda `pb-[26px]` (chizish) yoki `pb-[49px]` */
  root: { flex: 1, paddingHorizontal: 12 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  faded: { opacity: 0.5 },
  /* `items-center pt-3`, tugmalar `-mt-px grid-cols-2 gap-3`, tugma `h-13 rounded-full` */
  footer: { alignItems: "center", paddingTop: 12 },
  actions: { marginTop: -1, alignSelf: "stretch", flexDirection: "row", gap: 12 },
  action: { flex: 1, height: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderRadius: 26 },
});
