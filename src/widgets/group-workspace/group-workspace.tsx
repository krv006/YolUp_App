import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ListChecks,
  type LucideIcon,
} from "lucide-react-native";
import { VoiceRoomBar } from "@/modules/voice";
import { Chip, ChipRow } from "@/shared/ui";
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
  { id: "chat", labelKey: "groupworkspace.suhbat", icon: BookOpen },
  { id: "lessons", labelKey: "groupworkspace.darslar", icon: CalendarDays },
  { id: "assignments", labelKey: "groupworkspace.vazifalar", icon: ListChecks },
  {
    id: "attendance",
    labelKey: "groupworkspace.davomat",
    icon: CheckCircle2,
    teacherOnly: true,
  },
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
  const { t } = useTranslation("mobile");
  const visible = TABS.filter((tab) => !tab.teacherOnly || isTeacher);

  return (
    <ChipRow>
      {visible.map((tab) => (
        <Chip
          key={tab.id}
          label={t(tab.labelKey)}
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
      {/*
        * Ovozli suhbat DARSLAR bo'limining tepasida.
        *
        * Veb'da u ish maydonining doimiy chizig'i, lekin telefonda har
        * bo'limda takrorlansa joy yeb qo'yadi. Darslar — guruhning asosiy
        * bo'limi, shuning uchun xona shu yerda ko'rinadi.
        */}
      {tab === "lessons" ? <VoiceRoomBar courseId={courseId} isTeacher={isTeacher} /> : null}
      {tab === "lessons" ? <LessonsSection courseId={courseId} isTeacher={isTeacher} /> : null}
      {tab === "assignments" ? (
        <AssignmentsSection courseId={courseId} isTeacher={isTeacher} subject={subject} />
      ) : null}
      {tab === "attendance" ? <AttendanceSection courseId={courseId} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
