import { CalendarCheck2, Home, ListChecks, Trophy, UserRound, UsersRound } from "lucide-react-native";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { RoleTabs } from "@/providers/role-tabs";
import { ROLES } from "@/shared/constants";

/*
 * Veb `parent-layout.tsx` dagi navigatsiya + PROFIL.
 *
 * Nega veb'da profil yo'q: u yerda hisob menyusi navigatsiyadan TASHQARIDA,
 * alohida widget (`widgets/account-menu`) sifatida qobiqda turadi va har
 * rolda ko'rinadi. Mobilda esa u profil TABIGA joylashtirilgan.
 *
 * Navigatsiya veb'dan 1:1 ko'chirilgani uchun ota-ona profilsiz qolgan edi:
 * chiqish, hisob almashtirish va ko'rinish sozlamalari unga umuman yetib
 * bormasdi. O'qituvchi va o'quvchida profil tabi bor edi, shuning uchun
 * kamchilik ko'zga tashlanmagan.
 *
 * Yorliq "Farzandlar" emas, "Farzand" — oltita tab bilan uzun yorliq
 * qisqartirib ko'rsatiladi ("Farzan…").
 */
const TABS = [
  { name: "dashboard", labelKey: "tabs.overview", icon: Home },
  { name: "children", labelKey: "tabs.children", icon: UsersRound },
  { name: "attendance", labelKey: "tabs.attendance", icon: CalendarCheck2 },
  { name: "homework", labelKey: "tabs.homework", icon: ListChecks },
  { name: "grades", labelKey: "tabs.rating", icon: Trophy },
  { name: "profile", labelKey: "tabs.profile", icon: UserRound },
] as const;

export default function ParentLayout() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.PARENT]}>
        <RoleTabs tabs={TABS} />
      </RoleRoute>
    </ProtectedRoute>
  );
}
