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
  { name: "dashboard", label: "Asosiy", icon: Home },
  { name: "children", label: "Farzand", icon: UsersRound },
  { name: "attendance", label: "Davomat", icon: CalendarCheck2 },
  { name: "homework", label: "Vazifa", icon: ListChecks },
  { name: "grades", label: "Reyting", icon: Trophy },
  { name: "profile", label: "Profil", icon: UserRound },
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
