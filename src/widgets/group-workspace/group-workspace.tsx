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
import { AssignmentsSection } from "./assignments-section";
import { AttendanceSection } from "./attendance-section";
import { LessonsSection } from "./lessons-section";

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
 * oynasida turadi (`CourseMembersSection`), veb'dagi kabi. Veb'da ham tablar
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
 * Guruh chatidagi bo'limlar — veb'da bu chat ustidagi tab qatori edi,
 * mobilda ham shunday: suhbat ekranining o'zida qoladi.
 *
 * ALOHIDA MARSHRUT QILINMADI: bo'limlar bir xil guruh kontekstida ishlaydi
 * va ular orasida o'tish tez bo'lishi kerak. Har biri marshrut bo'lsa,
 * har o'tishda ekran to'liq qayta mount bo'lardi va suhbat soketi uzilib
 * qayta ulanardi.
 *
 * Bo'limlar TALAB BO'YICHA render qilinadi — ochilmagan bo'lim so'rov
 * yubormaydi (veb'dagi qoida bilan bir xil).
 */
export function GroupWorkspaceSection({
  tab,
  courseId,
  isTeacher = false,
}: {
  tab: Exclude<GroupTab, "chat">;
  courseId: string;
  isTeacher?: boolean;
}) {
  return (
    <View style={styles.root}>
      {tab === "lessons" ? <LessonsSection courseId={courseId} isTeacher={isTeacher} /> : null}
      {tab === "assignments" ? (
        <AssignmentsSection courseId={courseId} isTeacher={isTeacher} />
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
