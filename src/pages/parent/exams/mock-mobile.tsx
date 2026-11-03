import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { parentResults } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import type { ExamSummary } from "@/shared/types";
import { ConfirmDialog, DsText, dsRadius, Icon, MobileEmptyCard, MobileTitleHeader, useDs } from "@/shared/ui";
import { ParentErrorBanner, ParentScreen } from "@/widgets/parent-shell";
import { MobileConnect } from "../dashboard/parent-home-mobile";
import { ResultsTabs } from "../report/results-parts";
import { MockResultDialog } from "./mock-result-dialog";
import { band, bandTone } from "./mock-styles";
import { useMockView } from "./use-mock-view";

/**
 * Mock imtihonlar — veb `mock-mobile.tsx`: navbatdagi imtihon kartasi
 * (eslatma qo'yish), tugaganlar ro'yxati (band, qatnashmadi, kutilmoqda).
 * Natija tayyor bo'lsa sahifasi, qisman bo'lsa pastki oyna, yopiq bo'lsa
 * ogohlantirish.
 */
export function MockMobile() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const online = useOnlineStatus();
  const view = useMockView();
  const [pending, setPending] = useState<ExamSummary | null>(null);
  const [locked, setLocked] = useState<ExamSummary | null>(null);
  const childName = view.child?.name ?? "";
  const rest = view.list.filter((exam) => exam.id !== view.next?.id);

  function open(exam: ExamSummary) {
    const result = view.byExam.get(exam.id);
    if (exam.state !== "finished" || view.hidden.has(exam.id)) return setLocked(exam);
    if (!result?.participated) return;
    if (result.total?.score == null) return setPending(exam);
    router.push(ROUTES.parent.examResult(exam.id) as never);
  }

  return (
    <ParentScreen tabs onRefresh={() => view.exams.refetch()}>
      <MobileTitleHeader eyebrow={t("results.eyebrow")} title={t("results.title")} />
      <ResultsTabs />
      {online && view.exams.isError ? <ParentErrorBanner onRetry={() => void view.exams.refetch()} /> : null}
      {!view.childrenLoading && !view.child ? (
        <MobileConnect />
      ) : view.exams.isLoading ? (
        <View style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />
      ) : !view.list.length ? (
        <MobileEmptyCard icon="quiz" title={t("mock.empty.title")} description={t("mock.empty.text")} />
      ) : (
        <>
          {view.next ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setLocked(view.next)}
              style={({ pressed }) => [styles.next, { backgroundColor: ds.c["accent-teal-bg"] }, pressed && styles.pressed]}
            >
              <View style={[styles.icon, { backgroundColor: ds.c.surface }]}>
                <Icon name="event" size={22} color={ds.c["accent-teal-fg"]} />
              </View>
              <View style={styles.grow}>
                <DsText v="title-sm" c="accent-teal-fg" numberOfLines={1}>
                  {view.next.title} — {formatLocalized(view.next.startsAt, t("mobile.mock.dayPattern")).toLowerCase()}
                </DsText>
                <DsText v="body-xs" c="accent-teal-fg">
                  {formatLocalized(view.next.startsAt, "HH:mm")} · {t("mock.minutes", { count: view.next.totalMinutes })} · {t("mock.resultAfter")}
                </DsText>
              </View>
            </Pressable>
          ) : null}
          {rest.length ? (
            <>
              <DsText v="title-lg" heading style={styles.heading}>
                {t("mobile.mock.finished")}
              </DsText>
              <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
                {rest.map((exam, index) => {
                  const result = view.byExam.get(exam.id);
                  const score = result?.total?.score ?? null;
                  const done = exam.state === "finished" && !view.hidden.has(exam.id);
                  const tone = score !== null ? bandTone(score) : null;
                  return (
                    <Pressable
                      key={exam.id}
                      accessibilityRole="button"
                      onPress={() => open(exam)}
                      style={({ pressed }) => [styles.row, index < rest.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }, pressed && { backgroundColor: ds.c.subtle }]}
                    >
                      <View style={[styles.icon, { backgroundColor: ds.c[done ? "accent-blue-bg" : "accent-saffron-bg"] }]}>
                        <Icon name={done ? "quiz" : "lock"} size={22} color={ds.c[done ? "accent-blue-fg" : "accent-saffron-fg"]} />
                      </View>
                      <View style={styles.grow}>
                        <DsText v="title-sm" numberOfLines={1}>
                          {exam.title}
                        </DsText>
                        <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                          {[formatLocalized(exam.startsAt, t("homeworkView.shortPattern")).toLowerCase(), t("mock.minutes", { count: exam.totalMinutes }), exam.courseTitle].join(" · ")}
                        </DsText>
                      </View>
                      {score !== null && done && tone ? (
                        <View style={[styles.band, { backgroundColor: ds.c[tone.bg] }]}>
                          <DsText v="title-lg" heading c={tone.fg}>
                            {band(score)}
                          </DsText>
                          <DsText v="micro" c={tone.fg} style={styles.bandLabel}>
                            band
                          </DsText>
                        </View>
                      ) : done && result && !result.participated ? (
                        <View style={[styles.chip, { backgroundColor: ds.c.subtle }]}>
                          <DsText v="caption-strong" c="ink-secondary">
                            {t("mock.state.absent")}
                          </DsText>
                        </View>
                      ) : (
                        <View style={[styles.chip, { backgroundColor: ds.c["accent-teal-bg"] }]}>
                          <Icon name={done ? "pending" : "schedule"} size={14} color={ds.c["accent-teal-fg"]} />
                          <DsText v="caption-strong" c="accent-teal-fg">
                            {done ? t("mock.state.pending") : t(exam.state === "running" ? "mock.state.running" : "mock.state.upcoming")}
                          </DsText>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </>
      )}

      <MockResultDialog
        exam={pending}
        result={pending ? (view.byExam.get(pending.id) ?? null) : null}
        delta={pending ? parentResults.previousOverall(pending, view.list, view.byExam) : null}
        groupAverage={pending ? (view.groupAverage.get(pending.id) ?? null) : null}
        childId={view.childId ?? ""}
        childName={childName}
        childAvatar={view.child?.avatarUrl ?? null}
        onClose={() => setPending(null)}
      />
      <ConfirmDialog
        tone="brand"
        open={Boolean(locked)}
        onOpenChange={(value) => {
          if (!value) setLocked(null);
        }}
        icon="lock"
        title={t("mock.locked.title")}
        description={
          locked ? t("mock.locked.text", { exam: locked.title, date: formatLocalized(locked.endsAt, t("mock.nextPattern")).toLowerCase(), name: childName.split(" ")[0] }) : ""
        }
        confirmLabel={locked?.state === "upcoming" ? (locked.hasReminder ? t("mock.reminderSet") : t("mock.remind")) : t("mock.locked.ok")}
        cancelLabel={t("mock.locked.close")}
        pending={view.reminder.isPending}
        onConfirm={() => {
          if (locked?.state === "upcoming" && !locked.hasReminder) view.toggleReminder(locked);
          setLocked(null);
        }}
      />
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.85 },
  skeleton: { height: 320, borderRadius: 20 },
  next: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20 },
  icon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  heading: { paddingHorizontal: 4 },
  list: { overflow: "hidden", borderRadius: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  band: { flexShrink: 0, alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.xl },
  bandLabel: { fontSize: 10, lineHeight: 12, letterSpacing: 0 },
  chip: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
});
