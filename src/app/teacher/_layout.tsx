import { Bot, CalendarDays, ListChecks, MessagesSquare, UserRound } from "lucide-react-native";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { RoleTabs } from "@/providers/role-tabs";
import { ROLES } from "@/shared/constants";

const TABS = [
  { name: "chats", label: "Suhbatlar", icon: MessagesSquare },
  { name: "schedule", label: "Jadval", icon: CalendarDays },
  { name: "quizzes", label: "Testlar", icon: ListChecks },
  { name: "ai", label: "AI", icon: Bot },
  { name: "profile", label: "Profil", icon: UserRound },
] as const;

export default function TeacherLayout() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.TEACHER]}>
        <RoleTabs tabs={TABS} hidden={["dashboard"]} />
      </RoleRoute>
    </ProtectedRoute>
  );
}
