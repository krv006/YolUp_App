import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Send } from "lucide-react-native";
import { BoardSurface } from "@/modules/board";
import { useAssignment, useHomeworkBoard, useHomeworkBoardSource, useSubmitHomeworkBoard } from "@/modules/homework";
import { ROUTES } from "@/shared/config";
import type { Assignment } from "@/shared/types";
import { ConfirmDialog, DsText, Screen, ScreenError, ScreenLoading, ThemeScope, useDs } from "@/shared/ui";

type BoardData = NonNullable<ReturnType<typeof useHomeworkBoard>["data"]>;

/**
 * O'quvchi vazifani fayl yuklamasdan doskada yechadi — veb
 * `pages/student/homework-board/student-homework-board-page.tsx` ning tor
 * ekran shoxi (veb #161): jonli dars doskasi bilan bir xil mobil doska,
 * sarlavhada kurs va saqlash holati, o'ngda "Topshirish". "Topshirish"
 * doskani PDF qilib yuboradi; o'zgarishlar avtomatik saqlanadi.
 */
export function StudentHomeworkBoardPage() {
  const { t } = useTranslation("homework");
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const assignment = useAssignment(assignmentId ?? null);
  const board = useHomeworkBoard(assignmentId ?? null);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.student.chats as never));

  if (assignment.isLoading || board.isLoading)
    return (
      <Screen>
        <ScreenLoading label={t("board.loading")} />
      </Screen>
    );
  if (assignment.isError || board.isError || !assignment.data || !board.data)
    return (
      <Screen>
        <ScreenError message={(assignment.error ?? board.error)?.message ?? t("board.loadError")} onRetry={goBack} />
      </Screen>
    );

  return (
    <HomeworkBoardScreen
      assignment={assignment.data}
      board={board.data}
      onBack={goBack}
      onSubmitted={() => router.dismissTo(ROUTES.student.homeworkItem(assignment.data.id) as never)}
    />
  );
}

function HomeworkBoardScreen({
  assignment,
  board,
  onBack,
  onSubmitted,
}: {
  assignment: Assignment;
  board: BoardData;
  onBack: () => void;
  onSubmitted: () => void;
}) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const { source, saveState, flush } = useHomeworkBoardSource(assignment.id, board);
  const submit = useSubmitHomeworkBoard();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function send() {
    if (!(await flush())) return;
    submit.mutate(assignment.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        onSubmitted();
      },
      onError: () => setConfirmOpen(false),
    });
  }

  return (
    // `data-theme="light"` — doska doim yorug'
    <ThemeScope scheme="light">
      <View style={[styles.root, { backgroundColor: ds.c.subtle, paddingTop: insets.top + 20, paddingBottom: 26 + insets.bottom }]}>
        <BoardSurface
          lessonId=""
          courseId={null}
          source={source}
          mobile={{
            title: assignment.title,
            subtitle: [assignment.courseTitle, t(`board.save.${saveState}`)].filter(Boolean).join(" · "),
            backLabel: t("board.back"),
            onBack,
            action: (
              // `h-10 rounded-full bg-brand px-4 text-button text-on-action`
              <Pressable
                accessibilityRole="button"
                disabled={submit.isPending}
                onPress={() => setConfirmOpen(true)}
                style={({ pressed }) => [styles.submit, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }, submit.isPending && styles.faded]}
              >
                <Send size={16} color={ds.c["on-action"]} />
                <DsText v="button" c="on-action">
                  {t("board.submit")}
                </DsText>
              </Pressable>
            ),
          }}
        />
      </View>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon="check-circle"
        tone="brand"
        title={t("board.confirmTitle")}
        description={t("board.confirmDescription")}
        confirmLabel={t("board.confirm")}
        cancelLabel={t("board.cancel")}
        pending={submit.isPending}
        onConfirm={() => void send()}
      />
    </ThemeScope>
  );
}

const styles = StyleSheet.create({
  /* `flex-col bg-subtle px-3 pt-5 pb-[26px]` */
  root: { flex: 1, paddingHorizontal: 12 },
  faded: { opacity: 0.6 },
  submit: { height: 40, flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, borderRadius: 20 },
});
