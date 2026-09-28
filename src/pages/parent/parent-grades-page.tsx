import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("mobile");
  const { selectedChild, selectedChildId } = useSelectedChild();

  if (!selectedChild) {
    return (
      <Screen>
        <ScreenEmpty
          title={t("parent.farzand_tanlanmagan")}
          description={t("parent.avval_farzandlar_bolimida_oquvchi_hisobini_u")}
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
