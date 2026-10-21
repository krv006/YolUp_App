/*
 * Bo'limlar veb yon panelidagi kabi: Chat, Kalendar, Workspace
 * (`nav.json:rail`) — ustiga Profil, chunki chiqish tugmasi o'sha yerda.
 *
 * TEST ALOHIDA TAB EMAS. Veb'da ham u Workspace ichida turadi, Tahlil va
 * AI bilan birga. Ilgari mobilda "Test" to'g'ridan-to'g'ri tab edi va
 * Workspace umuman yo'q edi — natijada AI hech qayerdan ochilmasdi.
 * Marshrutlar o'zgarmaydi, faqat panelda ko'rinmaydi.
 */
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { RoleTabs } from "@/providers/role-tabs";
import { ROLES } from "@/shared/constants";

const TABS = [
  { name: "chats", labelKey: "tabs.chats", iconName: "nav-chat" },
  { name: "schedule", labelKey: "tabs.schedule", iconName: "nav-calendar" },
  {
    name: "workspace",
    labelKey: "tabs.workspace",
    iconName: "nav-workspace",
    /*
     * Ish maydonidan ochiladigan hamma narsa shu yerda sanaladi — aks
     * holda bo'lim ichida panelda birorta tab ajratilmay qoladi va
     * foydalanuvchi qayerdan kirganini bilmaydi.
     */
    owns: ["quizzes", "exams", "ai", "analytics", "assignments"],
  },
  {
    name: "profile",
    labelKey: "tabs.profile",
    iconName: "nav-profile",
    owns: ["profile-personal", "profile-account", "profile-system"],
  },
] as const;

export default function TeacherLayout() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.TEACHER]}>
        <RoleTabs tabs={TABS} hidden={["dashboard", "ai", "quizzes", "exams", "analytics", "assignments", "profile-personal", "profile-account", "profile-system"]} />
      </RoleRoute>
    </ProtectedRoute>
  );
}
