import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle2, Clock3, ListChecks } from "lucide-react-native";
import { HomeworkResultSheet } from "@/modules/homework";
import { useParentHomework, useSelectedChild } from "@/modules/parent";
import { ParentAppBar } from "@/modules/parent/ui/parent-app-bar";
import { toIntlLocale } from "@/shared/i18n/intl-locale";
import { useBackTo } from "@/shared/lib";
import type { Submission } from "@/shared/types";
import {
  PortalCard,
  PortalEmpty,
  PortalHeading,
  PortalListIcon,
  portalPage,
  PullRefresh,
  Screen,
  ScreenError,
  ScreenLoading,
  Text,
  useLegacyColors,
  useTheme,
} from "@/shared/ui";

const WORKSPACE_PATH = "/parent/workspace";

/**
 * Farzandning vazifalari — veb `parent-homework-page.tsx`: sarlavhada
 * farzand ismi, ro'yxatda vazifa, guruh va muddat, holat belgisi
 * (bosilsa AI tekshiruvi natijasi ochiladi).
 *
 * Vebda tor ekranda qatorlar karta chetiga yopishib qoladi (karta ichida
 * gorizontal bo'shliq yo'q) — bu yerda 16 ichkarida.
 */
export function ParentHomeworkPage() {
  const { t, i18n } = useTranslation("parent");
  const { t: tn } = useTranslation("nav");
  const { t: ts } = useTranslation("mobile");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const router = useRouter();
  useBackTo(WORKSPACE_PATH);
  const { selectedChild, selectedChildId } = useSelectedChild();
  const homework = useParentHomework(selectedChildId);
  const [resultOf, setResultOf] = useState<Submission | null>(null);

  const appBar = (
    <ParentAppBar
      a11yTitle={tn("parent.homework")}
      back={{ label: ts("shared.orqaga"), onPress: () => router.replace(WORKSPACE_PATH) }}
    />
  );

  if (!selectedChild) {
    return (
      <Screen padded={false}>
        {appBar}
        <View style={portalPage}>
          <PortalEmpty icon={ListChecks} title={t("homework.noChildTitle")} description={t("homework.noChildDescription")} />
        </View>
      </Screen>
    );
  }

  if (homework.isLoading) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenLoading label={t("homework.loading")} />
      </Screen>
    );
  }

  if (homework.isError) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenError message={homework.error.message || t("homework.loadError")} onRetry={() => void homework.refetch()} />
      </Screen>
    );
  }

  const items = homework.data ?? [];
  const format = new Intl.DateTimeFormat(toIntlLocale(i18n.language), { dateStyle: "medium", timeStyle: "short" });

  return (
    <Screen padded={false}>
      {appBar}
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={portalPage}
        refreshControl={
          <PullRefresh onRefresh={() => homework.refetch()} />
        }
      >
        <PortalHeading eyebrow={t("homework.eyebrow")} title={selectedChild.name} description={t("homework.subtitle")} />

        {/* `.parent-homework-list` */}
        <PortalCard style={styles.list}>
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[styles.row, index < items.length - 1 && { borderBottomWidth: 1, borderColor: colors.border }]}
            >
              <PortalListIcon icon={ListChecks} />
              <View style={styles.body}>
                <Text variant="body" style={styles.title}>
                  {item.title}
                </Text>
                <Text variant="caption" style={[styles.meta, { color: colors.muted }]}>
                  {item.courseTitle} · {item.dueAt ? format.format(new Date(item.dueAt)) : t("homework.noDue")}
                </Text>
                <SubmissionPill submission={item.mySubmission} onOpen={setResultOf} />
              </View>
            </View>
          ))}
          {!items.length ? <PortalEmpty icon={ListChecks} title={t("homework.emptyTitle")} /> : null}
        </PortalCard>
      </ScrollView>

      <HomeworkResultSheet
        submission={resultOf}
        onClose={() => setResultOf(null)}
        title={t("homework.resultDialogTitle", { name: selectedChild.name })}
      />
    </Screen>
  );
}

/** `.grade-pill` — holatga qarab yashil, sariq yoki qizil. */
function SubmissionPill({ submission, onOpen }: { submission: Submission | null; onOpen: (submission: Submission) => void }) {
  const { t } = useTranslation("parent");
  const { palette } = useTheme();

  if (!submission) {
    return (
      <View style={[styles.pill, { backgroundColor: palette["success-soft"] }]}>
        <Text variant="caption" style={[styles.pillText, { color: palette["tone-emerald-fg"] }]}>
          {t("homework.notSubmitted")}
        </Text>
      </View>
    );
  }

  const done = submission.status === "done";
  const checking = submission.status === "checking";
  const color = done ? palette["tone-emerald-fg"] : checking ? palette["warning-strong"] : palette["destructive-strong"];
  const background = done ? palette["success-soft"] : checking ? palette["warning-soft"] : palette["destructive-soft"];
  const label = done ? t("homework.openResultAria") : checking ? t("homework.openCheckingAria") : t("homework.openErrorAria");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onOpen(submission)}
      style={({ pressed }) => [styles.pill, { backgroundColor: background, opacity: pressed ? 0.85 : 1 }]}
    >
      {done ? <CheckCircle2 size={15} color={color} /> : checking ? <Clock3 size={14} color={color} /> : null}
      <Text variant="caption" style={[styles.pillText, { color }]}>
        {done
          ? `${submission.overallScore} ball · ${submission.grade}`
          : checking
            ? t("homework.checking")
            : t("homework.checkError")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16 },
  /* `article` — 13 0, ikonka va matn orasi 12 */
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 13 },
  body: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontWeight: "700" },
  meta: { fontSize: 12.8, lineHeight: 19.2 },
  /* `.grade-pill` — 7 10, 12/800 */
  pill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999 },
  pillText: { fontSize: 12, lineHeight: 18, fontWeight: "700" },
});
