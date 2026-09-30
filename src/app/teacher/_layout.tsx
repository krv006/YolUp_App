/*
 * Bo'limlar veb yon panelidagi kabi: Chat, Kalendar, Workspace
 * (`nav.json:rail`) — ustiga Profil, chunki chiqish tugmasi o'sha yerda.
 *
 * TEST ALOHIDA TAB EMAS. Veb'da ham u Workspace ichida turadi, Tahlil va
 * AI bilan birga. Ilgari mobilda "Test" to'g'ridan-to'g'ri tab edi va
 * Workspace umuman yo'q edi — natijada AI hech qayerdan ochilmasdi.
 * Marshrutlar o'zgarmaydi, faqat panelda ko'rinmaydi.
 */
import { CalendarDays, LayoutGrid, MessagesSquare, UserRound } from "lucide-react-native";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { RoleTabs } from "@/providers/role-tabs";
import { ROLES } from "@/shared/constants";

const TABS = [
  { name: "chats", labelKey: "tabs.chats", icon: MessagesSquare },
  { name: "schedule", labelKey: "tabs.schedule", icon: CalendarDays },
  { name: "workspace", labelKey: "tabs.workspace", icon: LayoutGrid, owns: ["quizzes"] },
  { name: "profile", labelKey: "tabs.profile", icon: UserRound },
] as const;

export default function TeacherLayout() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.TEACHER]}>
        <RoleTabs tabs={TABS} hidden={["dashboard", "ai", "quizzes"]} />
      </RoleRoute>
    </ProtectedRoute>
  );
}
