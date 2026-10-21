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
 * DAVOMAT, VAZIFALAR, MOCK TESTLAR va REYTING tab EMAS — ular Ish maydonida.
 *
 * Veb navigatsiyasi oltita bo'limdan iborat, mobilda ularning ustiga
 * Profil qo'shilib YETTITA tab chiqardi. Telefonning tor qatorida yorliqlar
 * kesilardi ("Davoma…", "Vazifa…", "Farzan…") va bo'limlar bir-biridan
 * ajralmay qolardi. Endi kundalik ikkitasi tabda, qolgan to'rttasi Ish
 * maydonida — o'qituvchi va o'quvchidagi bilan bir xil naqsh.
 *
 * Marshrutlar o'zgarmadi, faqat panelda ko'rinmaydi.
 *
 * Har sahifaning tepasida vebdagi portal sarlavhasi turadi: logotip,
 * farzand tanlagichi va qo'ng'iroq (`modules/parent/ui/parent-app-bar.tsx`).
 */
const TABS = [
  { name: "dashboard", labelKey: "tabs.overview", iconName: "school" },
  { name: "children", labelKey: "tabs.children", iconName: "groups" },
  {
    name: "workspace",
    labelKey: "tabs.workspace",
    iconName: "nav-workspace",
    owns: ["attendance", "homework", "exams", "grades", "notifications"],
  },
  {
    name: "profile",
    labelKey: "tabs.profile",
    iconName: "nav-profile",
    owns: ["profile-personal", "profile-account", "profile-system"],
  },
] as const;

export default function ParentLayout() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.PARENT]}>
        <RoleTabs tabs={TABS} hidden={["attendance", "homework", "exams", "grades", "profile-personal", "profile-account", "profile-system", "notifications"]} />
      </RoleRoute>
    </ProtectedRoute>
  );
}
