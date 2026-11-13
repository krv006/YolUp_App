import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ListChecks,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { DsText, useDs } from "@/shared/ui";
import { AttendanceSection } from "./attendance-section";
import { ClubMembersPanel } from "./club-members-panel";
import { LessonsPanel } from "./lessons-panel";
import { ProgressPanel } from "./progress-panel";
import { StudentGroupSection } from "@/widgets/student-group-workspace/student-group-workspace";
import { TeacherAssignments } from "./teacher-assignments";

export type GroupTab = "chat" | "lessons" | "assignments" | "attendance" | "progress" | "members";

interface TabDefinition {
  id: GroupTab;
  /**
   * Tarjima kaliti, tayyor matn EMAS.
   *
   * Ro'yxat modul darajasida, ya'ni `t()` hali mavjud emas — matn
   * render paytida olinadi. Ilgari bu yerda o'zbekcha matn turardi va
   * ilova inglizchada ochilganda ham shu tablar o'zbekcha chiqardi.
   */
  labelKey: string;
  icon: LucideIcon;
  teacherOnly?: boolean;
}

/**
 * Veb `group-workspace.tsx` (`useTabs`) / `student-group-workspace.tsx` dagi
 * bo'limlar: Chat, Darslar, Vazifalar, Davomat va oxirida Progress (to'lov,
 * davomat va vazifalar umumiy progressi — faqat o'qituvchiga).
 *
 * "O'quvchilar" BO'LIM EMAS — u guruh nomi bosilganda ochiladigan ma'lumot
 * oynasida turadi (`GroupInfoScreen`), veb'dagi kabi.
 */
const TABS: readonly TabDefinition[] = [
  { id: "chat", labelKey: "tabs.chat", icon: BookOpen },
  { id: "lessons", labelKey: "tabs.lessons", icon: CalendarDays },
  { id: "assignments", labelKey: "tabs.assignments", icon: ListChecks },
  {
    id: "attendance",
    labelKey: "tabs.attendance",
    icon: CheckCircle2,
    teacherOnly: true,
  },
  { id: "progress", labelKey: "tabs.progress", icon: TrendingUp, teacherOnly: true },
];

/** Speaking club: Chat, Darslar, A'zolar (o'qituvchi), Davomat (o'qituvchi) — veb #182. */
const CLUB_TABS: readonly TabDefinition[] = [
  { id: "chat", labelKey: "tabs.chat", icon: BookOpen },
  { id: "lessons", labelKey: "tabs.lessons", icon: CalendarDays },
  { id: "members", labelKey: "tabs.members", icon: UsersRound, teacherOnly: true },
  { id: "attendance", labelKey: "tabs.attendance", icon: CheckCircle2, teacherOnly: true },
];

/**
 * Guruh bo'limlari — veb `group-workspace.tsx` tablari: teng ustunli
 * `h-11 rounded-full` tugmalar, faoli `bg-brand text-ink-inverse`,
 * qolganlari `bg-surface`. Tanlash rejimida tepa bo'shliq `pt-1`.
 * Progress tabida shu oy to'lamaganlar soni — qizil belgi (`unpaidCount`).
 */
export function GroupTabsRow({
  active,
  onChange,
  isTeacher,
  isClub = false,
  compact = false,
  unpaidCount,
}: {
  active: GroupTab;
  onChange: (tab: GroupTab) => void;
  isTeacher: boolean;
  isClub?: boolean;
  compact?: boolean;
  unpaidCount?: number | null;
}) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const visible = (isClub ? CLUB_TABS : TABS).filter((tab) => !tab.teacherOnly || isTeacher);

  return (
    <View accessibilityRole="tablist" style={[styles.tabRow, { paddingTop: compact ? 4 : 16 }]}>
      {visible.map((tab) => {
        const selected = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.id)}
            style={[styles.tab, { backgroundColor: selected ? ds.c.brand : ds.c.surface }]}
          >
            {/* 5 ta tab tor ekranga sig'masa matn biroz kichrayadi (vebda `whitespace-nowrap`). */}
            <DsText
              v="body-sm"
              w="500"
              c={selected ? "ink-inverse" : "ink"}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {t(tab.labelKey)}
            </DsText>
            {tab.id === "progress" && unpaidCount ? (
              // `absolute -top-1 -right-1 h-4.5 min-w-4.5 rounded-full bg-danger px-1 text-[10px] font-semibold ring-2 ring-canvas`
              <View
                accessibilityLabel={t("progress.unpaidBadge", { count: unpaidCount })}
                style={[styles.badge, { backgroundColor: ds.c.danger, borderColor: ds.c.canvas }]}
              >
                <DsText w="600" c="ink-inverse" style={styles.badgeText}>
                  {unpaidCount}
                </DsText>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Guruh chatidagi bo'limlar — chat ustidagi tablar orqali, shu ekranning
 * o'zida (alohida marshrut emas: bo'limlar orasida o'tish tez bo'lsin va
 * suhbat soketi uzilmasin). Ochilmagan bo'lim so'rov yubormaydi.
 *
 * O'qituvchida `LessonsPanel`, `TeacherAssignments`, `AttendanceSection`, `ProgressPanel`;
 * o'quvchida veb `student-group-workspace.tsx` dagi bo'limlar.
 */
export function GroupWorkspaceSection({
  tab,
  courseId,
  isTeacher = false,
  studentCount = 0,
  groupImage = null,
}: {
  tab: Exclude<GroupTab, "chat">;
  courseId: string;
  isTeacher?: boolean;
  studentCount?: number;
  groupImage?: string | null;
}) {
  return (
    <View style={styles.root}>
      {tab === "lessons" ? (
        isTeacher ? (
          <LessonsPanel courseId={courseId} studentCount={studentCount} />
        ) : (
          <StudentGroupSection tab="lessons" courseId={courseId} groupImage={groupImage} />
        )
      ) : null}
      {tab === "assignments" ? (
        isTeacher ? (
          <TeacherAssignments courseId={courseId} groupImage={groupImage} />
        ) : (
          <StudentGroupSection tab="assignments" courseId={courseId} groupImage={groupImage} />
        )
      ) : null}
      {tab === "attendance" ? <AttendanceSection courseId={courseId} /> : null}
      {tab === "progress" && isTeacher ? <ProgressPanel courseId={courseId} /> : null}
      {tab === "members" ? <ClubMembersPanel clubId={courseId} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /* `grid grid-cols-4|5 gap-2 px-4 pb-1 pt-4` */
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  tab: { flex: 1, minWidth: 0, height: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderRadius: 22 },
  /* `ring-2` — tashqi 2px chegara sifatida, shuning uchun 18 + 2×2 va `-top-1.5 -right-1.5` */
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    height: 22,
    minWidth: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderRadius: 11,
  },
  badgeText: { fontSize: 10, lineHeight: 12 },
  root: { flex: 1 },
});
