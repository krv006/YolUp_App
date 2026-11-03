import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useExamResultPdf } from "@/modules/exam";
import { parentResults } from "@/modules/parent";
import { downloadBlob, formatLocalized } from "@/shared/lib";
import type { ExamStudentResult, ExamSummary } from "@/shared/types";
import { Avatar, DsText, dsRadius, Icon, MobileButton, Sheet, useDs } from "@/shared/ui";
import { band as formatBand, sectionIcon } from "./mock-styles";

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function sectionPercent(section: ExamStudentResult["sections"][number]): number {
  if (section.percent !== null) return section.percent;
  return section.score !== null ? Math.round((section.score / (section.scaleMax || 9)) * 100) : 0;
}

/** Imtihon natijasini PDF qilib yuklash (ulashish oynasi). */
export function useResultPdf(childId: string) {
  const pdf = useExamResultPdf();
  async function download(exam: ExamSummary) {
    try {
      await downloadBlob(await pdf.mutateAsync({ examId: exam.id, studentId: childId }), `${exam.title}.pdf`);
    } catch {
      return;
    }
  }
  return { download, pending: pdf.isPending };
}

/**
 * Hali to'liq baholanmagan imtihon — veb `mock-result-dialog.tsx`
 * (`AppDialog` telefonda pastki oyna): farzand avatari, sarlavha va
 * `MockResultBody`; umumiy ball bo'lsa PDF tugmasi.
 */
export function MockResultDialog({
  exam,
  result,
  delta,
  groupAverage,
  childId,
  childName,
  childAvatar,
  onClose,
}: {
  exam: ExamSummary | null;
  result: ExamStudentResult | null;
  delta: number | null;
  groupAverage: number | null;
  childId: string;
  childName: string;
  childAvatar: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const pdf = useResultPdf(childId);
  const first = childName.split(" ")[0] || childName;
  const band = result?.total?.score ?? null;

  return (
    <Sheet
      variant="app"
      open={Boolean(exam)}
      onClose={onClose}
      headingTitle="semibold"
      icon={<Avatar variant="legacy" name={childName} src={childAvatar ?? undefined} size="md" box={48} />}
      title={exam ? t("mock.result.title", { name: first, exam: exam.title }) : ""}
      description={
        exam ? [formatLocalized(exam.startsAt, t("mock.result.datePattern")), t("mock.minutes", { count: exam.totalMinutes }), exam.courseTitle].filter(Boolean).join(" · ") : ""
      }
      footer={
        <>
          <MobileButton variant="secondary" label={t("mock.result.close")} onPress={onClose} />
          {band !== null && exam ? (
            <Pressable
              accessibilityRole="button"
              disabled={pdf.pending}
              onPress={() => void pdf.download(exam)}
              style={({ pressed }) => [styles.pdf, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }, pdf.pending && styles.faded]}
            >
              <Icon name="download" size={18} color={ds.c["on-action"]} />
              <DsText v="title-sm" c="on-action">
                {t("mock.result.pdf")}
              </DsText>
            </Pressable>
          ) : null}
        </>
      }
    >
      {result ? <MockResultBody result={result} delta={delta} groupAverage={groupAverage} /> : null}
    </Sheet>
  );
}

/**
 * Natija tanasi — veb `MockResultBody`: ko'k karta (umumiy band halqasi,
 * CEFR darajasi, o'zgarish va guruh o'rtachasi) yoki "hali tayyor emas",
 * bo'limlar kartalari, o'qituvchi izohi va kutilayotgan bo'limlar izohi.
 */
export function MockResultBody({ result, delta, groupAverage }: { result: ExamStudentResult; delta: number | null; groupAverage: number | null }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const band = result.total?.score ?? null;
  const level = parentResults.cefrLevel(band);
  const sections = result.sections;
  const pending = sections.some((section) => result.pending.includes(section.key) || (section.manual && section.score === null));
  const facts = [
    delta ? t("mock.result.delta", { value: `${delta > 0 ? "+" : ""}${delta}` }) : "",
    groupAverage !== null ? t("mock.result.groupAverage", { value: groupAverage }) : "",
  ].filter(Boolean);

  return (
    <View style={styles.body}>
      {band !== null ? (
        <View style={[styles.hero, { backgroundColor: ds.c.brand }]}>
          <View pointerEvents="none" style={[styles.blob, { backgroundColor: ds.c["on-brand-subtle"] }]} />
          <View style={styles.ring}>
            <Svg width={112} height={112} viewBox="0 0 112 112" style={styles.ringSvg}>
              <Circle cx={56} cy={56} r={RADIUS} fill="none" strokeWidth={9} stroke={ds.c["on-brand-subtle"]} />
              <Circle
                cx={56}
                cy={56}
                r={RADIUS}
                fill="none"
                strokeWidth={9}
                strokeLinecap="round"
                stroke={ds.c["on-action"]}
                strokeDasharray={`${(band / (result.total?.max || 9)) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              />
            </Svg>
            {/* `font-heading text-[30px]/9 font-semibold` */}
            <DsText v="h1" heading c="on-action" style={styles.band}>
              {formatBand(band)}
            </DsText>
          </View>
          <View style={styles.heroText}>
            <DsText v="caption-strong" c="on-action" style={styles.overall}>
              {t("mock.result.overall").toUpperCase()}
            </DsText>
            <DsText v="title-lg" heading c="on-action">
              {level ? t("mock.result.level", { level }) : (result.total?.label ?? "")}
            </DsText>
            {facts.length ? (
              <DsText v="body-sm" c="on-action" style={styles.facts}>
                {facts.join(" · ")}
              </DsText>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={[styles.notReady, { backgroundColor: ds.c.subtle }]}>
          <View style={[styles.emptyRing, { borderColor: ds.c.surface }]}>
            <View style={[styles.emptyBar, { backgroundColor: ds.c["line-strong"] }]} />
          </View>
          <View style={styles.notReadyText}>
            <DsText v="title-lg" heading>
              {t("mock.result.notReady")}
            </DsText>
            <View style={[styles.chip, { backgroundColor: ds.c["accent-teal-bg"] }]}>
              <Icon name="pending" size={14} color={ds.c["accent-teal-fg"]} />
              <DsText v="caption-strong" c="accent-teal-fg">
                {t("mock.result.waitingTeacher")}
              </DsText>
            </View>
          </View>
        </View>
      )}

      {/* `grid grid-cols-2 gap-3` */}
      <View style={styles.sections}>
        {sections.map((section) => {
          const waiting = result.pending.includes(section.key) || (section.manual && section.score === null);
          const percent = sectionPercent(section);
          return (
            <View
              key={section.key}
              style={[styles.section, waiting ? { backgroundColor: ds.c["accent-teal-bg"] } : { borderWidth: 1, borderColor: ds.c.line, backgroundColor: ds.c.surface }]}
            >
              <View style={styles.sectionHead}>
                <View style={[styles.sectionIcon, { backgroundColor: ds.c[waiting ? "surface" : "brand-subtle"] }]}>
                  <Icon name={sectionIcon(section.key, section.title)} size={18} color={ds.c[waiting ? "accent-teal-fg" : "brand"]} />
                </View>
                {!waiting && section.score !== null ? (
                  <DsText v="h2" heading w="600" style={styles.sectionScore}>
                    {formatBand(section.score)}
                  </DsText>
                ) : null}
              </View>
              <DsText v="body-sm" c={waiting ? "accent-teal-fg" : "ink-secondary"} numberOfLines={1}>
                {section.title}
              </DsText>
              {waiting ? (
                <DsText v="title-sm" c="accent-teal-fg">
                  {t("mock.result.sectionWaiting")}
                </DsText>
              ) : (
                <>
                  {section.earned !== null && section.max ? (
                    <DsText v="caption" c="ink-tertiary">
                      {section.earned} / {section.max}
                    </DsText>
                  ) : null}
                  <View style={[styles.track, { backgroundColor: ds.c.subtle }]}>
                    <View style={[styles.fill, { width: `${percent}%`, backgroundColor: ds.c[percent >= 60 ? "brand" : "saffron"] }]} />
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>

      {result.teacherComment ? (
        <View style={[styles.comment, { backgroundColor: ds.c["accent-violet-bg"] }]}>
          <Icon name="chat-outline" size={20} color={ds.c["accent-violet-fg"]} />
          <View style={styles.grow}>
            <DsText v="caption-strong" c="accent-violet-fg">
              {t("mock.result.teacherComment")}
            </DsText>
            <DsText v="body-sm">{result.teacherComment}</DsText>
          </View>
        </View>
      ) : null}

      {pending ? (
        <View style={[styles.note, { backgroundColor: ds.c["info-bg"] }]}>
          <Icon name="info" size={20} color={ds.c["info-text"]} />
          <DsText v="body-sm" c="info-text" style={styles.grow}>
            {t("mock.result.pendingNote")}
          </DsText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.5 },
  pdf: { flex: 1, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20, borderRadius: dsRadius.full },
  body: { gap: 16, paddingHorizontal: 4, paddingBottom: 4 },
  /* `relative flex items-center gap-6 overflow-hidden rounded-3xl bg-brand px-6 py-5` */
  hero: { flexDirection: "row", alignItems: "center", gap: 24, overflow: "hidden", paddingHorizontal: 24, paddingVertical: 20, borderRadius: 24 },
  blob: { position: "absolute", top: -64, right: -40, width: 192, height: 192, borderRadius: 96 },
  ring: { width: 112, height: 112, alignItems: "center", justifyContent: "center" },
  ringSvg: { position: "absolute", transform: [{ rotate: "-90deg" }] },
  band: { fontSize: 30, lineHeight: 36 },
  heroText: { flex: 1, minWidth: 0, gap: 4 },
  overall: { letterSpacing: 0.4, opacity: 0.8 },
  facts: { opacity: 0.9 },
  notReady: { flexDirection: "row", alignItems: "center", gap: 20, paddingHorizontal: 24, paddingVertical: 20, borderRadius: 24 },
  emptyRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 8, alignItems: "center", justifyContent: "center" },
  emptyBar: { width: 28, height: 4, borderRadius: 2 },
  notReadyText: { flex: 1, minWidth: 0, alignItems: "flex-start", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  sections: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  section: { width: "47%", flexGrow: 1, gap: 8, padding: 14, borderRadius: dsRadius["2xl"] },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionIcon: { width: 32, height: 32, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  sectionScore: { lineHeight: 28 },
  track: { height: 6, overflow: "hidden", borderRadius: 3 },
  fill: { height: "100%", borderRadius: 3 },
  comment: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  note: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
});
