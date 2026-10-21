import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, Cloud, CloudOff, Send } from "lucide-react-native";
import { BoardSurface } from "@/modules/board";
import {
  useAssignment,
  useHomeworkBoard,
  useHomeworkBoardSource,
  useSubmitHomeworkBoard,
  type HomeworkBoardSaveState,
} from "@/modules/homework";
import { NotificationBell } from "@/modules/notification";
import { sanitizeHtml } from "@/shared/lib";
import type { Assignment } from "@/shared/types";
import {
  AppBar,
  AppBarAction,
  HtmlView,
  radius,
  Screen,
  ScreenError,
  ScreenLoading,
  Sheet,
  SheetButton,
  SheetFooter,
  Text,
  useTheme,
} from "@/shared/ui";

type BoardData = NonNullable<ReturnType<typeof useHomeworkBoard>["data"]>;

/**
 * O'quvchi vazifani fayl yuklamasdan doskada yechadi — veb
 * `pages/student/homework-board/student-homework-board-page.tsx`.
 * "Topshirish" doskani PDF qilib yuboradi; o'zgarishlar avtomatik saqlanadi.
 */
export function StudentHomeworkBoardPage() {
  const { t } = useTranslation("homework");
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const assignment = useAssignment(assignmentId ?? null);
  const board = useHomeworkBoard(assignmentId ?? null);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/student/chats"));

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
      onSubmitted={() => router.replace("/student/chats")}
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
  const { t: tw } = useTranslation("workspace");
  const { palette } = useTheme();
  const router = useRouter();
  const { source, saveState, flush } = useHomeworkBoardSource(assignment.id, board);
  const submit = useSubmitHomeworkBoard();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const html = assignment.body ? sanitizeHtml(assignment.body) : "";

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
    <Screen padded={false}>
      <AppBar title={tw("title")} back={{ label: t("board.back"), onPress: onBack }}>
        <AppBarAction name="search" label={tw("searchAria")} onPress={() => router.push("/student/search")} />
        <NotificationBell />
      </AppBar>

      <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page}>
        <View style={styles.heading}>
          <Text variant="caption" style={[styles.eyebrow, { color: palette.primary }]}>
            {t("board.eyebrow")}
          </Text>
          <Text variant="title">{assignment.title}</Text>
          <Text variant="body" style={{ color: palette["muted-foreground"] }}>
            {assignment.courseTitle}
          </Text>
        </View>

        <View style={styles.actions}>
          <SaveBadge state={saveState} />
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [
              styles.button,
              styles.grow,
              { borderWidth: 1, borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
            ]}
          >
            <ArrowLeft size={16} color={palette.foreground} />
            <Text variant="label">{t("board.back")}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={submit.isPending}
            onPress={() => setConfirmOpen(true)}
            style={({ pressed }) => [
              styles.button,
              styles.grow,
              { backgroundColor: pressed ? palette["primary-hover"] : palette.primary },
              submit.isPending && styles.dim,
            ]}
          >
            <Send size={16} color={palette["primary-foreground"]} />
            <Text variant="label" style={{ color: palette["primary-foreground"] }}>
              {t("board.submit")}
            </Text>
          </Pressable>
        </View>

        {assignment.description || html ? (
          <View style={[styles.task, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Text variant="body">{t("board.task")}</Text>
            {assignment.description ? <Text variant="body">{assignment.description}</Text> : null}
            {html ? <HtmlView html={html} /> : null}
          </View>
        ) : null}

        <View style={styles.board}>
          <BoardSurface lessonId="" courseId={null} source={source} />
        </View>
      </ScrollView>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title={t("board.confirmTitle")} description={t("board.confirmDescription")}>
        <SheetFooter>
          <SheetButton title={t("board.cancel")} onPress={() => setConfirmOpen(false)} />
          <SheetButton
            variant="primary"
            title={t("board.confirm")}
            loading={submit.isPending}
            icon={<CheckCircle2 size={16} color={palette["primary-foreground"]} />}
            onPress={() => void send()}
          />
        </SheetFooter>
      </Sheet>
    </Screen>
  );
}

/** `.homework-board-save` — saqlash holati. */
function SaveBadge({ state }: { state: HomeworkBoardSaveState }) {
  const { t } = useTranslation("homework");
  const { palette } = useTheme();
  const color = state === "error" ? palette["destructive-strong"] : state === "saving" ? palette["muted-foreground"] : palette["success-strong"];
  return (
    <View style={styles.save}>
      {state === "error" ? <CloudOff size={15} color={color} /> : <Cloud size={15} color={color} />}
      <Text variant="label" style={{ color }}>
        {t(`board.save.${state}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, padding: 16 },
  grow: { flex: 1 },
  dim: { opacity: 0.6 },
  heading: { gap: 8, paddingTop: 8 },
  eyebrow: { fontWeight: "700", letterSpacing: 2.4, textTransform: "uppercase" },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  save: { flexDirection: "row", alignItems: "center", gap: 6 },
  button: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14, borderRadius: 13 },
  task: { gap: 8, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  board: { height: 560 },
});
