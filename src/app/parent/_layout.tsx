import { CalendarCheck2, Home, ListChecks, Trophy, UsersRound } from "lucide-react-native";
import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { RoleTabs } from "@/providers/role-tabs";
import { ROLES } from "@/shared/constants";

/** Veb `parent-layout.tsx` dagi navigatsiya bilan bir xil tartib. */
const TABS = [
  { name: "dashboard", label: "Asosiy", icon: Home },
  { name: "children", label: "Farzandlar", icon: UsersRound },
  { name: "attendance", label: "Davomat", icon: CalendarCheck2 },
  { name: "homework", label: "Vazifalar", icon: ListChecks },
  { name: "grades", label: "Reyting", icon: Trophy },
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
