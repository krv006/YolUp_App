import { StyleSheet, View } from "react-native";
import { useSelectedChild } from "@/modules/parent";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { RoleTabs, type TabDefinition } from "@/providers/role-tabs";
import { ROLES } from "@/shared/constants";
import { useOnlineStatus } from "@/shared/model";
import { OpenHomeworkBadge, ParentOffline, ParentUnlinked } from "@/widgets/parent-shell";

/*
 * Veb `widgets/parent-shell/parent-tab-bar.tsx` — telefondagi suzuvchi panel:
 * Farzandlar, Davomat, markazda Asosiy, Vazifalar (ochiq vazifalar soni) va
 * Natijalar (Imtihonlar ham shu tabda). Yorliqlar `parent:mobile.tabs.*`.
 *
 * Profil tab emas: vebdagidek bosh sahifa sarlavhasidagi avatar uni ochadi.
 * Bildirishnomalar, profil va topilmagan sahifa marshrutlari panelda
 * ko'rinmaydi va ularda panel yashirinadi. "Orqaga" tarix bo'yicha.
 */
const TABS: readonly TabDefinition[] = [
  { name: "children", labelKey: "mobile.tabs.children", iconName: "group" },
  { name: "attendance", labelKey: "mobile.tabs.attendance", iconName: "event" },
  { name: "dashboard", labelKey: "mobile.tabs.home", iconName: "home", center: true },
  { name: "homework", labelKey: "mobile.tabs.homework", iconName: "assignment", badge: OpenHomeworkBadge },
  { name: "grades", labelKey: "mobile.tabs.results", iconName: "bar-chart", siblings: ["exams"] },
];

/* `(account)` — profil, sozlamalar, yordam va bildirishnomalar (o'z stack'i, URL'da guruh nomi yo'q). */
const HIDDEN = ["exams", "(account)", "[...missing]"];

export default function ParentLayout() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.PARENT]}>
        <ParentShell />
      </RoleRoute>
    </ProtectedRoute>
  );
}

/**
 * Veb `parent-mobile-shell.tsx`: internet yo'q va farzandlar hali kelmagan
 * bo'lsa "Internet yo'q" ekrani, farzand ulanishni uzgan bo'lsa bir martalik
 * xabar. Ikkalasi ham navigator ustidan qoplanadi — ostidagi bo'limlar holati
 * saqlanib qoladi.
 */
function ParentShell() {
  const online = useOnlineStatus();
  const { childrenQuery } = useSelectedChild();
  return (
    <View style={styles.fill}>
      <ParentUnlinked>
        <RoleTabs variant="floating" namespace="parent" floatingBottom={24} backBehavior="history" tabs={TABS} hidden={HIDDEN} />
      </ParentUnlinked>
      {!online && !childrenQuery.data ? <ParentOffline onRetry={() => void childrenQuery.refetch()} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
