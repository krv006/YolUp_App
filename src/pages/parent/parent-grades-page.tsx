import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useBackTo } from "@/shared/lib";
import { ArrowLeft } from "lucide-react-native";
import { useSelectedChild } from "@/modules/parent";
import { ChildSelector } from "@/modules/parent/ui/child-selector";
import { ReportPage } from "@/pages/report/report-page";
import { IconButton, Screen, ScreenEmpty, useTheme } from "@/shared/ui";

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
  const router = useRouter();
  useBackTo("/parent/workspace");
  const { palette } = useTheme();

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
      {/*
        * Ish maydoniga qaytish — bu sahifa endi TAB EMAS.
        * Sabab `app/parent/_layout.tsx` da.
        */}
      <View style={styles.headRow}>
        <IconButton
          accessibilityLabel={t("shared.orqaga")}
          onPress={() => router.replace("/parent/workspace")}
        >
          <ArrowLeft size={20} color={palette["muted-foreground"]} />
        </IconButton>
      </View>
      <View style={styles.selector}>
        <ChildSelector />
      </View>
      <ReportPage studentId={selectedChildId} />
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 4 },
  root: { flex: 1 },
  selector: { paddingHorizontal: 16 },
});
