import { StyleSheet, View } from "react-native";
import { BookOpen, CalendarDays, ListChecks, UsersRound, type LucideIcon } from "lucide-react-native";
import { Chip, ChipRow } from "@/shared/ui";
import { AssignmentsSection } from "./assignments-section";
import { LessonsSection } from "./lessons-section";
import { StudentsSection } from "./students-section";

export type GroupTab = "chat" | "lessons" | "assignments" | "students";

interface TabDefinition {
  id: GroupTab;
  label: string;
  icon: LucideIcon;
  teacherOnly?: boolean;
}

/** Veb `group-workspace.tsx` / `student-group-workspace.tsx` dagi bo'limlar. */
const TABS: readonly TabDefinition[] = [
  { id: "chat", label: "Suhbat", icon: BookOpen },
  { id: "lessons", label: "Darslar", icon: CalendarDays },
  { id: "assignments", label: "Vazifalar", icon: ListChecks },
  { id: "students", label: "O'quvchilar", icon: UsersRound, teacherOnly: true },
];

export function GroupTabsRow({
  active,
  onChange,
  isTeacher,
}: {
  active: GroupTab;
  onChange: (tab: GroupTab) => void;
  isTeacher: boolean;
}) {
  const visible = TABS.filter((tab) => !tab.teacherOnly || isTeacher);

  return (
    <ChipRow>
      {visible.map((tab) => (
        <Chip
          key={tab.id}
          label={tab.label}
          selected={active === tab.id}
          onPress={() => onChange(tab.id)}
        />
      ))}
    </ChipRow>
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
  subject = "",
}: {
  tab: Exclude<GroupTab, "chat">;
  courseId: string;
  isTeacher?: boolean;
  /** Kurs fani — vazifa oynasidagi "tekshiruv turi" tanlovi shunga bog'liq. */
  subject?: string;
}) {
  return (
    <View style={styles.root}>
      {tab === "lessons" ? <LessonsSection courseId={courseId} isTeacher={isTeacher} /> : null}
      {tab === "assignments" ? (
        <AssignmentsSection courseId={courseId} isTeacher={isTeacher} subject={subject} />
      ) : null}
      {tab === "students" ? <StudentsSection courseId={courseId} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
