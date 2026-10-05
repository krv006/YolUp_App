/*
 * Bo'limlar veb yon panelidagi kabi: Chat, Kalendar, Workspace
 * (`nav.json:rail`) — ustiga Reyting va Profil.
 *
 * TEST ALOHIDA TAB EMAS. Veb'da ham u Workspace ichida, Tahlil va Mock
 * Test bilan birga. Ilgari mobilda "Test" tab edi va Mock Test hech
 * qayerdan ochilmasdi — marshruti bor, havolasi yo'q edi.
 *
 * "AI" o'quvchida umuman ko'rsatilmaydi (veb ham shunday:
 * `workspace-page.tsx` da `hiddenForStudent`), lekin marshrut saqlanadi.
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

export default function StudentLayout() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.STUDENT]}>
        <RoleTabs tabs={TABS} hidden={["dashboard", "ai", "quizzes"]} />
      </RoleRoute>
    </ProtectedRoute>
  );
}
