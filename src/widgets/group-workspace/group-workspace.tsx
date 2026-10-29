import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ListChecks,
  type LucideIcon,
} from "lucide-react-native";
import { DsText, useDs } from "@/shared/ui";
import { AttendanceSection } from "./attendance-section";
import { LessonsPanel } from "./lessons-panel";
import { StudentGroupSection } from "@/widgets/student-group-workspace/student-group-workspace";
import { TeacherAssignments } from "./teacher-assignments";

export type GroupTab = "chat" | "lessons" | "assignments" | "attendance";

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
 * Veb `group-workspace.tsx` / `student-group-workspace.tsx` dagi bo'limlar.
 *
 * "O'quvchilar" BO'LIM EMAS — u guruh nomi bosilganda ochiladigan ma'lumot
 * oynasida turadi (`GroupInfoScreen`), veb'dagi kabi. Veb'da ham tablar
 * faqat shu to'rttasi.
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
];

/**
 * Guruh bo'limlari — veb `group-workspace.tsx` tablari: teng ustunli
 * `h-11 rounded-full` tugmalar, faoli `bg-brand text-ink-inverse`,
 * qolganlari `bg-surface`. Tanlash rejimida tepa bo'shliq `pt-1`.
 */
export function GroupTabsRow({
  active,
  onChange,
  isTeacher,
  compact = false,
}: {
  active: GroupTab;
  onChange: (tab: GroupTab) => void;
  isTeacher: boolean;
  compact?: boolean;
}) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const visible = TABS.filter((tab) => !tab.teacherOnly || isTeacher);

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
            <DsText v="body-sm" w="500" c={selected ? "ink-inverse" : "ink"} numberOfLines={1}>
              {t(tab.labelKey)}
            </DsText>
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
 * O'qituvchida `LessonsPanel`, `TeacherAssignments`, `AttendanceSection`;
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
    </View>
  );
}

const styles = StyleSheet.create({
  /* `grid grid-cols-4 gap-2 px-4 pb-1 pt-4` */
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  tab: { flex: 1, minWidth: 0, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  root: { flex: 1 },
});
