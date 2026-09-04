import { StyleSheet, View } from "react-native";
import { useSelectedChild } from "@/modules/parent";
import { ChildSelector } from "@/modules/parent/ui/child-selector";
import { ReportPage } from "@/pages/report/report-page";
import { Screen, ScreenEmpty } from "@/shared/ui";

/**
 * Farzandning reytingi — veb `parent-report-page.tsx` porti.
 *
 * Hisobotning o'zi `ReportPage` bilan bir xil (backend `?student=` parametrini
 * qabul qiladi), shuning uchun u qayta yozilmaydi — faqat farzand tanlash
 * qatori qo'shiladi.
 */
export function ParentGradesPage() {
  const { selectedChild, selectedChildId } = useSelectedChild();

  if (!selectedChild) {
    return (
      <Screen>
        <ScreenEmpty
          title="Farzand tanlanmagan"
          description="Avval 'Farzandlar' bo'limida o'quvchi hisobini ulang."
        />
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.selector}>
        <ChildSelector />
      </View>
      <ReportPage studentId={selectedChildId} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  selector: { paddingHorizontal: 16 },
});
