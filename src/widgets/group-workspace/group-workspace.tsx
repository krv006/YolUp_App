import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ListChecks,
  type LucideIcon,
} from "lucide-react-native";
import { Text, useTheme } from "@/shared/ui";
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
  const { palette } = useTheme();
  const visible = TABS.filter((tab) => !tab.teacherOnly || isTeacher);

  return (
    <View
      style={[
        styles.tabRow,
        { backgroundColor: palette.surface, borderBottomColor: palette.border },
      ]}
    >
      {visible.map((tab) => {
        const selected = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.id)}
            style={styles.tab}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.tabLabel,
                { color: selected ? palette.primary : palette["muted-foreground"] },
              ]}
            >
              {t(tab.labelKey)}
            </Text>
            {/*
              * Tagidagi chiziq — faol tabni shu belgilaydi. Vebda u
              * `border-bottom` ham, `::after` ham emas, alohida element.
              */}
            <View
              style={[
                styles.tabUnderline,
                selected && { backgroundColor: palette.primary },
              ]}
            />
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
  /*
   * O'lchamlar veb DOM'idan (390px): qator 49 balandlik, OQ fon, pastki
   * chegara 1px, yon bo'shliq 4; tab 48 balandlik, pad 14/8, yorliq
   * 14/20 qalinlik 600; faol rangi --action-primary, nofaolniki
   * --text-secondary.
   *
   * ILGARI bu yerda CHIP qatori turardi (to'liq yumaloq, fonli). Vebda
   * esa oddiy matn tablari va faolining TAGIDA ko'k chiziq.
   */
  tabRow: { flexDirection: "row", height: 49, paddingHorizontal: 4, borderBottomWidth: 1 },
  tab: { flex: 1, justifyContent: "space-between", alignItems: "center", paddingTop: 14 },
  tabLabel: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  /* Chiziq doim chiziladi — nofaolida shaffof, shunda yorliq sakramaydi. */
  tabUnderline: {
    alignSelf: "stretch",
    height: 3,
    marginHorizontal: 8,
    backgroundColor: "transparent",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  root: { flex: 1 },
});
