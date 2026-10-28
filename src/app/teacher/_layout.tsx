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
import { NewConversationHost } from "@/widgets/new-conversation";

/**
 * Yangi dizayndagi suzuvchi panel (veb `widgets/mobile-tab-bar`): Workspace,
 * Jadval, markazda Asosiy, Chat, Profil. Yorliqlar `nav` lug'atidan.
 */
const TABS = [
  {
    name: "workspace",
    labelKey: "tabs.workspace",
    iconName: "nav-workspace",
    /*
     * Ish maydonidan ochiladigan hamma narsa shu yerda sanaladi — aks
     * holda bo'lim ichida panelda birorta tab ajratilmay qoladi va
     * foydalanuvchi qayerdan kirganini bilmaydi.
     */
    owns: ["quizzes", "exams", "ai", "analytics", "search", "assignments", "notifications"],
    // Pastki bo'shliq `workspace/_layout.tsx` da — faqat bosh sahifada.
  },
  { name: "schedule", labelKey: "tabs.schedule", iconName: "nav-calendar", inset: true },
  { name: "dashboard", labelKey: "tabs.home", iconName: "home", center: true },
  { name: "chats", labelKey: "tabs.chat", iconName: "nav-chat", unreadChats: true },
  {
    name: "profile",
    labelKey: "tabs.profile",
    iconName: "nav-profile",
    owns: ["profile-personal", "profile-account", "profile-system"],
    inset: true,
  },
] as const;

export default function TeacherLayout() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.TEACHER]}>
        <RoleTabs variant="floating" tabs={TABS} hidden={["ai", "quizzes", "exams", "analytics", "search", "assignments", "profile-personal", "profile-account", "profile-system", "notifications"]} />
        <NewConversationHost role="teacher" />
      </RoleRoute>
    </ProtectedRoute>
  );
}
