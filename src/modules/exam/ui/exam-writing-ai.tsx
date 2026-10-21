import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { CheckCircle2, Lightbulb, TriangleAlert } from "lucide-react-native";
import { useQuizColors } from "@/modules/quiz";
import type { ExamWritingAi } from "@/shared/types";
import { radius, Text, useTheme } from "@/shared/ui";

export interface ExamWritingAiPanelProps {
  ai: ExamWritingAi;
  /** O'qituvchi uchun: taklif etilgan bandni ball maydoniga qo'yish. */
  onApply?: (band: number) => void;
}

/**
 * IELTS Writing AI tahlili — veb `modules/exam/ui/exam-writing-ai.tsx` porti
 * (`.exam-writing-ai*` uslublari): 4 mezon bo'yicha band, xatolar,
 * kuchli tomonlar, yaxshilash kerak bo'lganlar va yaxshilangan paragraf.
 */
export function ExamWritingAiPanel({ ai, onApply }: ExamWritingAiPanelProps) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const colors = useQuizColors();

  if (ai.status === "queued") return <Muted>{t("writingAi.queued")}</Muted>;
  if (ai.status === "failed") return <Muted>{t("writingAi.failed", { error: ai.error })}</Muted>;

  return (
    <View style={styles.root}>
      {ai.suggestedBand !== null && onApply ? (
        <View style={[styles.suggest, { backgroundColor: colors.surfaceTint, borderColor: palette.primary }]}>
          <Text variant="label" style={styles.strong}>
            {t("writingAi.suggested", { band: ai.suggestedBand })}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => onApply(ai.suggestedBand as number)}
            style={[styles.apply, { backgroundColor: palette.primary }]}
          >
            <Text variant="label" style={[styles.heavy, { color: palette["primary-foreground"] }]}>
              {t("writingAi.apply")}
            </Text>
          </Pressable>
          <Text variant="caption" style={{ color: colors.muted }}>
            {t("writingAi.teacherConfirms")}
          </Text>
        </View>
      ) : null}

      {ai.items.map((item, index) => (
        <View key={`${item.task}-${index}`} style={[styles.item, { borderColor: colors.border }]}>
          <View style={styles.itemHead}>
            <Text variant="body" style={styles.strong}>
              {t("writingAi.taskTitle", { task: item.task })}
            </Text>
            <Text variant="body" style={styles.heavy}>
              {t("writingAi.band", { band: item.overallBand })}
            </Text>
          </View>
          <Text variant="caption" style={{ color: item.tooShort ? "#b45309" : colors.foreground }}>
            {t("writingAi.words", { count: item.wordCount, min: item.minWords })}
            {item.tooShort ? ` · ${t("writingAi.tooShort")}` : ""}
          </Text>

          <View style={styles.criteria}>
            {item.criteria.map((criterion) => (
              <View key={criterion.key} style={styles.criterion}>
                <View style={styles.criterionHead}>
                  <Text variant="body" style={styles.grow}>
                    {criterion.title}
                    {criterion.capped ? (
                      <Text variant="body" style={styles.italic}>
                        {" "}
                        ({t("writingAi.capped")})
                      </Text>
                    ) : null}
                  </Text>
                  <Text variant="body" style={styles.heavy}>
                    {criterion.band}
                  </Text>
                </View>
                <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
                  {criterion.comment}
                </Text>
              </View>
            ))}
          </View>

          {item.errors.length ? (
            <View>
              <Heading icon={<TriangleAlert size={14} color={colors.foreground} />}>{t("writingAi.errors")}</Heading>
              {item.errors.map((error, errorIndex) => (
                <Text key={errorIndex} variant="caption" style={[styles.small, styles.errorLine]}>
                  “{error.quote}” — {error.issue}
                  {error.correction ? (
                    <>
                      {" → "}
                      <Text variant="caption" style={[styles.small, styles.heavy]}>
                        {error.correction}
                      </Text>
                    </>
                  ) : null}
                </Text>
              ))}
            </View>
          ) : null}

          {item.strengths.length ? (
            <View>
              <Heading icon={<CheckCircle2 size={14} color={colors.foreground} />}>{t("writingAi.strengths")}</Heading>
              {item.strengths.map((text) => (
                <Bullet key={text}>{text}</Bullet>
              ))}
            </View>
          ) : null}
          {item.improvements.length ? (
            <View>
              <Heading icon={<Lightbulb size={14} color={colors.foreground} />}>{t("writingAi.improvements")}</Heading>
              {item.improvements.map((text) => (
                <Bullet key={text}>{text}</Bullet>
              ))}
            </View>
          ) : null}

          {item.upgradedParagraph ? (
            <View style={[styles.upgrade, { backgroundColor: colors.surfaceTint }]}>
              <Text variant="caption" style={[styles.small, styles.strong]}>
                {t("writingAi.upgraded")}
              </Text>
              <Text variant="body">{item.upgradedParagraph}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function Muted({ children }: { children: string }) {
  const colors = useQuizColors();
  return (
    <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
      {children}
    </Text>
  );
}

function Heading({ icon, children }: { icon: React.ReactNode; children: string }) {
  return (
    <View style={styles.heading}>
      {icon}
      <Text variant="caption" style={[styles.small, styles.strong]}>
        {children}
      </Text>
    </View>
  );
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bullet}>
      <Text variant="caption" style={styles.small}>
        •
      </Text>
      <Text variant="caption" style={[styles.small, styles.grow]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  strong: { fontWeight: "600" },
  heavy: { fontWeight: "700" },
  italic: { fontStyle: "italic" },
  /* --fs-sm 13 */
  small: { fontSize: 13, lineHeight: 19 },
  root: { gap: 14, marginTop: 10 },
  suggest: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 16,
  },
  apply: { minHeight: 34, justifyContent: "center", paddingHorizontal: 12, borderRadius: radius.full },
  item: { gap: 8, padding: 12, borderWidth: 1, borderRadius: 16 },
  itemHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  criteria: { gap: 8 },
  criterion: { gap: 2 },
  criterionHead: { flexDirection: "row", gap: 10 },
  heading: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorLine: { marginVertical: 4 },
  bullet: { flexDirection: "row", gap: 6, paddingLeft: 6, marginTop: 4 },
  upgrade: { gap: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16 },
});
