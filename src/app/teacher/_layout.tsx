/*
 * "AI" bo'limi tab qatoridan CHIQARILDI, lekin marshrut saqlandi.
 *
 * Veb'da u ochiq PLACEHOLDER ("bu bo'lim hozircha tayyorlanmoqda").
 * Mobilda tab o'rni beshta — bo'sh bo'limga bittasini berib, chiqish
 * tugmasi turgan Profilni tashqarida qoldirish noto'g'ri bo'lardi.
 * AI mazmuni paydo bo'lganda TABS ro'yxatiga bitta qator qo'shiladi.
 */
import { CalendarDays, ListChecks, MessagesSquare, UserRound } from "lucide-react-native";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { RoleTabs } from "@/providers/role-tabs";
import { ROLES } from "@/shared/constants";

const TABS = [
  { name: "chats", label: "Suhbatlar", icon: MessagesSquare },
  { name: "schedule", label: "Jadval", icon: CalendarDays },
  { name: "quizzes", label: "Testlar", icon: ListChecks },
  { name: "profile", label: "Profil", icon: UserRound },
] as const;

export default function TeacherLayout() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.TEACHER]}>
        <RoleTabs tabs={TABS} hidden={["dashboard", "ai"]} />
      </RoleRoute>
    </ProtectedRoute>
  );
}
