import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { CheckCircle2, Clock3, ListChecks } from "lucide-react-native";
import { HomeworkResultSheet } from "@/modules/homework/ui/homework-result-sheet";
import { useParentHomework, useSelectedChild } from "@/modules/parent";
import { ChildSelector } from "@/modules/parent/ui/child-selector";
import { formatDayTime } from "@/shared/lib";
import type { Submission } from "@/shared/types";
import {
  Badge,
  radius,
  Screen,
  ScreenEmpty,
  ScreenError,
  ScreenLoading,
  Text,
  useTheme,
} from "@/shared/ui";

/** Farzandning vazifalari va AI tekshiruvi — veb `parent-homework-page.tsx` porti. */
export function ParentHomeworkPage() {
  const { palette } = useTheme();
  const { selectedChild, selectedChildId } = useSelectedChild();
  const homework = useParentHomework(selectedChildId);
  const [resultOf, setResultOf] = useState<Submission | null>(null);

  if (!selectedChild) {
    return (
      <Screen>
        <ScreenEmpty
          title="Farzand tanlanmagan"
          description="Avval 'Farzandlar' bo'limida o'quvchi hisobini ulang."
        />
      </Screen>
    );
  }

  if (homework.isLoading) {
    return (
      <Screen>
        <ScreenLoading label="Vazifalar yuklanmoqda…" />
      </Screen>
    );
  }

  if (homework.isError) {
    return (
      <Screen>
        <ScreenError
          message={homework.error.message}
          onRetry={() => void homework.refetch()}
        />
      </Screen>
    );
  }

  const items = homework.data ?? [];

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={homework.isRefetching}
            onRefresh={() => void homework.refetch()}
            tintColor={palette["muted-foreground"]}
          />
        }
      >
        <View style={styles.head}>
          <Text variant="heading">{selectedChild.name}</Text>
          <Text variant="caption" tone="muted">
            Topshiriqlar va tekshiruv natijalari.
          </Text>
        </View>

        <ChildSelector />

        {items.length === 0 ? (
          <ScreenEmpty title="Vazifa topilmadi" />
        ) : (
          items.map((item) => (
            <View
              key={item.id}
              style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              <View style={styles.cardHead}>
                <View style={[styles.icon, { backgroundColor: palette["primary-tint"] }]}>
                  <ListChecks size={18} color={palette["primary-text"]} />
                </View>
                <View style={styles.cardBody}>
                  <Text variant="label" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {item.courseTitle} ·{" "}
                    {item.dueAt ? formatDayTime(item.dueAt) : "muddat yo'q"}
                  </Text>
                </View>
              </View>

              <SubmissionPill submission={item.mySubmission} onOpen={setResultOf} />
            </View>
          ))
        )}
      </ScrollView>

      <HomeworkResultSheet submission={resultOf} onClose={() => setResultOf(null)} />
    </Screen>
  );
}

/**
 * Topshirish holati. Bosiladigan bo'lishi faqat topshirilgan ishda ma'noli —
 * topshirilmagan vazifada ochadigan narsa yo'q.
 */
function SubmissionPill({
  submission,
  onOpen,
}: {
  submission: Submission | null;
  onOpen: (submission: Submission) => void;
}) {
  const { palette } = useTheme();

  if (!submission) {
    return <Badge label="Topshirilmagan" tone="neutral" />;
  }

  const content =
    submission.status === "done" ? (
      <>
        <CheckCircle2 size={15} color={palette["success-strong"]} />
        <Text variant="caption" style={{ color: palette["success-strong"] }}>
          {submission.overallScore} ball · {submission.grade}
        </Text>
      </>
    ) : submission.status === "checking" ? (
      <>
        <Clock3 size={14} color={palette["warning-strong"]} />
        <Text variant="caption" style={{ color: palette["warning-strong"] }}>
          Tekshirilmoqda
        </Text>
      </>
    ) : (
      <Text variant="caption" style={{ color: palette["destructive-strong"] }}>
        Tekshiruv xatosi
      </Text>
    );

  const background =
    submission.status === "done"
      ? palette["success-soft"]
      : submission.status === "checking"
        ? palette["warning-soft"]
        : palette["destructive-soft"];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Natijani ochish"
      onPress={() => onOpen(submission)}
      style={({ pressed }) => [styles.pill, { backgroundColor: background, opacity: pressed ? 0.85 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  head: { gap: 4, paddingTop: 8 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 14,
    gap: 12,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardBody: { flex: 1, gap: 3 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
});
