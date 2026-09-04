import { Bot, CalendarDays, ListChecks, MessagesSquare, Trophy } from "lucide-react-native";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { RoleTabs } from "@/providers/role-tabs";
import { ROLES } from "@/shared/constants";

const TABS = [
  { name: "chats", label: "Suhbatlar", icon: MessagesSquare },
  { name: "schedule", label: "Jadval", icon: CalendarDays },
  { name: "quizzes", label: "Testlar", icon: ListChecks },
  { name: "report", label: "Reyting", icon: Trophy },
  { name: "ai", label: "AI", icon: Bot },
] as const;

export default function StudentLayout() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.STUDENT]}>
        <RoleTabs tabs={TABS} hidden={["dashboard"]} />
      </RoleRoute>
    </ProtectedRoute>
  );
}
