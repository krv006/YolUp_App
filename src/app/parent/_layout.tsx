import { Home, LayoutGrid, UserRound, UsersRound } from "lucide-react-native";
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
 * DAVOMAT, VAZIFALAR va REYTING tab EMAS — ular Ish maydonida.
 *
 * Veb navigatsiyasi beshta bo'limdan iborat, mobilda ularning ustiga
 * Profil qo'shilib OLTITA tab chiqardi. Telefonning tor qatorida yorliqlar
 * kesilardi ("Davoma…", "Vazifa…", "Farzan…") va bo'limlar bir-biridan
 * ajralmay qolardi. Endi kundalik ikkitasi tabda, qolgan uchtasi Ish
 * maydonida — o'qituvchi va o'quvchidagi bilan bir xil naqsh.
 *
 * Marshrutlar o'zgarmadi, faqat panelda ko'rinmaydi.
 */
const TABS = [
  { name: "dashboard", labelKey: "tabs.overview", icon: Home },
  { name: "children", labelKey: "tabs.children", icon: UsersRound },
  {
    name: "workspace",
    labelKey: "tabs.workspace",
    icon: LayoutGrid,
    owns: ["attendance", "homework", "grades"],
  },
  { name: "profile", labelKey: "tabs.profile", icon: UserRound },
] as const;

export default function ParentLayout() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.PARENT]}>
        <RoleTabs tabs={TABS} hidden={["attendance", "homework", "grades"]} />
      </RoleRoute>
    </ProtectedRoute>
  );
}
