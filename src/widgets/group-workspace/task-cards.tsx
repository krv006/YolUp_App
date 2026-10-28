import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { Assignment, QuizSummary } from "@/shared/types";
import {
  DsText,
  dsRadius,
  GroupTile,
  Icon,
  PopoverMenu,
  PopoverMenuItem,
  toneColors,
  useDs,
  usePopoverAnchor,
  type DsColor,
  type IconName,
} from "@/shared/ui";

export type TaskTone = "teal" | "brand" | "success" | "violet" | "danger";

const PILL: Record<TaskTone, string> = {
  teal: "bg-accent-teal-bg text-accent-teal-fg",
  brand: "bg-brand-subtle text-brand",
  success: "bg-success-bg text-success-fg",
  violet: "bg-accent-violet-bg text-accent-violet-fg",
  danger: "bg-danger-bg text-error-text",
};

const BAR: Record<TaskTone, DsColor> = { teal: "brand", brand: "brand", success: "success", violet: "brand", danger: "danger" };

export interface TaskRow {
  id: string;
  assignmentId?: string;
  quizId?: string;
  title: string;
  meta: string;
  pill: { tone: TaskTone; icon: IconName; label: string };
  aside: string;
  progress: number | null;
  onOpen: () => void;
  menu: Array<{ id: string; label: string; danger?: boolean; run: () => void }>;
}

/**
 * Vazifa va test kartalari — veb `task-cards.tsx`: guruh belgisi, nom va
 * izoh, "⋮" menyusi, holat yorlig'i, o'ngda topshirganlar soni va progress.
 */
export function TaskCards({
  rows,
  courseTitle,
  courseImage,
  courseTone,
  highlightId = null,
}: {
  rows: TaskRow[];
  courseTitle: string;
  courseImage?: string | null;
  courseTone?: string;
  highlightId?: string | null;
}) {
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <TaskCard key={row.id} row={row} courseTitle={courseTitle} courseImage={courseImage} courseTone={courseTone} highlighted={Boolean(row.assignmentId && row.assignmentId === highlightId)} />
      ))}
    </View>
  );
}

function TaskCard({
  row,
  courseTitle,
  courseImage,
  courseTone,
  highlighted,
}: {
  row: TaskRow;
  courseTitle: string;
  courseImage?: string | null;
  courseTone?: string;
  highlighted: boolean;
}) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const { anchorRef, rect: menuRect, open: openMenu, close: closeMenu } = usePopoverAnchor();
  const pill = toneColors(PILL[row.pill.tone], ds);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={row.onOpen}
      style={[styles.card, { backgroundColor: ds.c.surface }, highlighted && { borderWidth: 2, borderColor: ds.c.brand }]}
    >
      <View style={styles.head}>
        <GroupTile name={courseTitle} tone={courseTone} src={courseImage} box={44} radius={dsRadius.xl} />
        <View style={styles.grow}>
          <DsText v="title" numberOfLines={1}>
            {row.title}
          </DsText>
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
            {row.meta}
          </DsText>
        </View>
        <View ref={anchorRef} collapsable={false}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("mobileAssignments.menu")} onPress={openMenu} style={styles.more}>
            <Icon name="more" size={20} color={ds.c["ink-secondary"]} />
          </Pressable>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.pill, { backgroundColor: pill.bg }]}>
          <Icon name={row.pill.icon} size={14} color={pill.fg ?? ds.c.ink} />
          <DsText v="caption-strong" style={{ color: pill.fg }}>
            {row.pill.label}
          </DsText>
        </View>
        {row.aside ? (
          <DsText v="body-xs" c="ink-secondary" style={styles.aside}>
            {row.aside}
          </DsText>
        ) : null}
      </View>

      {row.progress === null ? null : (
        <View style={[styles.track, { backgroundColor: ds.c.subtle }]}>
          <View style={[styles.bar, { width: `${row.progress}%`, backgroundColor: ds.c[BAR[row.pill.tone]] }]} />
        </View>
      )}

      <PopoverMenu rect={menuRect} onClose={closeMenu} height={row.menu.length * 44 + 12}>
        {row.menu.map((item) => (
          <PopoverMenuItem
            key={item.id}
            label={item.label}
            danger={item.danger}
            onPress={() => {
              closeMenu();
              item.run();
            }}
          />
        ))}
      </PopoverMenu>
    </Pressable>
  );
}

const DAY_MS = 86_400_000;

function shortDate(value: string, months: string[]): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;
}

function clock(value: string): string {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export interface MobileAssignmentListProps {
  assignments: Assignment[];
  quizzes: QuizSummary[];
  courseTitle: string;
  courseImage?: string | null;
  courseTone?: string;
  onOpenAssignment: (assignment: Assignment) => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignment: Assignment) => void;
  onOpenQuiz: (quiz: QuizSummary) => void;
  onEditQuiz: (quiz: QuizSummary) => void;
  highlightId?: string | null;
}

/**
 * Guruh vazifalari va testlari ro'yxati — veb `mobile-assignment-list.tsx`:
 * holat (qoralama, tekshirish kerak, yakunlangan, qolgan kun) va progress
 * vazifa statistikasidan hisoblanadi.
 */
export function MobileAssignmentList({
  assignments,
  quizzes,
  courseTitle,
  courseImage,
  courseTone,
  onOpenAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onOpenQuiz,
  onEditQuiz,
  highlightId = null,
}: MobileAssignmentListProps) {
  const { t } = useTranslation("group");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const [now] = useState(() => Date.now());

  function daysLeft(dueAt: string | null): number | null {
    if (!dueAt) return null;
    const due = new Date(dueAt).getTime();
    if (Number.isNaN(due)) return null;
    return Math.ceil((due - now) / DAY_MS);
  }

  const assignmentRows: TaskRow[] = assignments.map((item) => {
    const total = item.stats?.studentsCount ?? item.submissions.length;
    const submitted = item.stats?.submittedCount ?? item.submissionsCount ?? item.submissions.length;
    const pending = item.submissions.filter((entry) => !entry.grade).length;
    const left = daysLeft(item.dueAt);
    const draft = item.status === "draft";
    const closed = left !== null && left < 0;
    const done = total > 0 && submitted >= total;
    const skill = item.skillKey ? t(`dialogs.assignment.skillOptions.${item.skillKey}`) : "";

    const pill: TaskRow["pill"] = draft
      ? { tone: "violet", icon: "edit", label: t("mobileAssignments.draft") }
      : (closed || done) && pending > 0
        ? { tone: "brand", icon: "quiz", label: t("mobileAssignments.review", { count: pending }) }
        : closed || done
          ? { tone: "success", icon: "check-circle", label: t("mobileAssignments.finished") }
          : left === null
            ? { tone: "teal", icon: "clock", label: t("mobileAssignments.noDue") }
            : { tone: "teal", icon: "clock", label: t("mobileAssignments.daysLeft", { count: Math.max(left, 0) }) };

    return {
      id: item.id,
      assignmentId: item.id,
      title: item.title,
      meta: draft
        ? t("mobileAssignments.draftMeta")
        : [
            item.dueAt
              ? t("mobileAssignments.due", {
                  date: left !== null && left < 0 ? shortDate(item.dueAt, months) : `${shortDate(item.dueAt, months)}, ${clock(item.dueAt)}`,
                })
              : t("mobileAssignments.noDue"),
            skill,
          ]
            .filter(Boolean)
            .join(" · "),
      pill,
      aside: draft
        ? t("mobileAssignments.notSent")
        : pill.tone === "success" && item.stats?.averageScore != null
          ? t("mobileAssignments.average", { value: item.stats.averageScore.toFixed(1).replace(".", ",") })
          : t("mobileAssignments.submitted", { done: submitted, total }),
      progress: draft
        ? null
        : !total
          ? 0
          : pill.tone === "brand"
            ? Math.round(((submitted - pending) / total) * 100)
            : Math.min(100, Math.round((submitted / total) * 100)),
      onOpen: () => onOpenAssignment(item),
      menu: [
        { id: "open", label: t("mobileAssignments.open"), run: () => onOpenAssignment(item) },
        { id: "edit", label: t("mobileAssignments.edit"), run: () => onEditAssignment(item) },
        { id: "delete", label: t("mobileAssignments.delete"), danger: true, run: () => onDeleteAssignment(item) },
      ],
    };
  });

  const quizRows: TaskRow[] = quizzes.map((quiz) => {
    const left = daysLeft(quiz.dueAt);
    const draft = quiz.status === "draft";
    const closed = left !== null && left < 0;
    return {
      id: `quiz-${quiz.id}`,
      quizId: quiz.id,
      title: quiz.title,
      meta: t("mobileAssignments.quizMeta", { count: quiz.questionCount }),
      pill: draft
        ? { tone: "violet", icon: "edit", label: t("mobileAssignments.draft") }
        : closed
          ? { tone: "success", icon: "check-circle", label: t("mobileAssignments.finished") }
          : {
              tone: "teal",
              icon: "clock",
              label: left === null ? t("mobileAssignments.noDue") : t("mobileAssignments.daysLeft", { count: Math.max(left, 0) }),
            },
      aside: draft ? t("mobileAssignments.notSent") : "",
      progress: draft ? null : closed ? 100 : 0,
      onOpen: () => onOpenQuiz(quiz),
      menu: [
        { id: "open", label: t("mobileAssignments.results"), run: () => onOpenQuiz(quiz) },
        { id: "edit", label: t("mobileAssignments.edit"), run: () => onEditQuiz(quiz) },
      ],
    };
  });

  return (
    <TaskCards rows={[...assignmentRows, ...quizRows]} courseTitle={courseTitle} courseImage={courseImage} courseTone={courseTone} highlightId={highlightId} />
  );
}

/** "Test qo'shish" — veb `add-quiz-menu.tsx`: tayyor testlardan yoki yangisini yaratish. */
export function AddQuizMenu({ onFromBank, onCreate }: { onFromBank: () => void; onCreate: () => void }) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const { anchorRef, rect: menuRect, open: openMenu, close: closeMenu } = usePopoverAnchor();
  const options = [
    { id: "bank", icon: "menu-book" as IconName, tone: "bg-brand-subtle text-brand", run: onFromBank },
    { id: "create", icon: "edit" as IconName, tone: "bg-accent-violet-bg text-accent-violet-fg", run: onCreate },
  ];

  return (
    <View ref={anchorRef} collapsable={false} style={styles.half}>
      <Pressable
        accessibilityRole="button"
        onPress={openMenu}
        style={({ pressed }) => [styles.quizButton, { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
      >
        <Icon name="quiz" size={18} color={ds.c.ink} />
        <DsText v="button" numberOfLines={1}>
          {t("assignments.addTest")}
        </DsText>
        <Icon name={menuRect ? "expand-less" : "expand-more"} size={18} color={ds.c.ink} />
      </Pressable>
      <PopoverMenu rect={menuRect} onClose={closeMenu} width={320} height={64 * 2 + 12}>
        {options.map((option) => {
          const tone = toneColors(option.tone, ds);
          return (
            <Pressable
              key={option.id}
              accessibilityRole="menuitem"
              onPress={() => {
                closeMenu();
                option.run();
              }}
              style={({ pressed }) => [styles.quizItem, pressed && { backgroundColor: ds.c.subtle }]}
            >
              <View style={[styles.quizIcon, { backgroundColor: tone.bg }]}>
                <Icon name={option.icon} size={20} color={tone.fg ?? ds.c.ink} />
              </View>
              <View style={styles.grow}>
                <DsText w="600" numberOfLines={1} style={styles.quizTitle}>
                  {t(`assignments.testMenu.${option.id}.title`)}
                </DsText>
                <DsText v="body-sm" c="ink-secondary" numberOfLines={1} style={styles.quizHint}>
                  {t(`assignments.testMenu.${option.id}.hint`)}
                </DsText>
              </View>
              <Icon name="chevron-right" size={20} color={ds.c["ink-secondary"]} />
            </Pressable>
          );
        })}
      </PopoverMenu>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  /* teng ikki ustun (`grid-cols-2`) */
  half: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  list: { gap: 12 },
  /* `gap-3 rounded-xl bg-surface p-4` */
  card: { gap: 12, padding: 16, borderRadius: dsRadius.xl },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  more: { width: 36, height: 36, marginRight: -8, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  pill: { height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 8, paddingRight: 10, borderRadius: 12 },
  aside: { marginLeft: "auto" },
  track: { height: 6, overflow: "hidden", borderRadius: 3 },
  bar: { height: "100%", borderRadius: 3 },
  quizButton: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 16, borderWidth: 1, borderRadius: 22 },
  /* `h-16 gap-3 rounded-lg px-3.5` */
  quizItem: { height: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, borderRadius: dsRadius.lg },
  quizIcon: { width: 40, height: 40, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  quizTitle: { fontSize: 17, lineHeight: 20 },
  quizHint: { marginTop: 4, lineHeight: 18 },
});
