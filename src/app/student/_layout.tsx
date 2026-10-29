import { ProtectedRoute, RoleRoute } from "@/providers/route-guards";
import { RoleTabs } from "@/providers/role-tabs";
import { ROLES } from "@/shared/constants";
import { NewConversationHost } from "@/widgets/new-conversation";

/**
 * O'quvchining suzuvchi paneli — veb `widgets/mobile-tab-bar` (o'qituvchidagi
 * bilan bir xil): Workspace, Jadval, markazda Asosiy, Chat, Profil.
 * Testlar, mock, vazifalar va tahlil Workspace ichida (`workspace/...`).
 */
const TABS = [
  {
    name: "workspace",
    labelKey: "tabs.workspace",
    iconName: "nav-workspace",
    owns: ["search", "notifications"],
    // Pastki bo'shliq `workspace/_layout.tsx` da — faqat bosh sahifada.
  },
  // Jadval suzuvchi panel ostida aylanadi — bo'shliq sahifaning o'zida (`pb-32`).
  { name: "schedule", labelKey: "tabs.schedule", iconName: "nav-calendar" },
  { name: "dashboard", labelKey: "tabs.home", iconName: "home", center: true },
  { name: "chats", labelKey: "tabs.chat", iconName: "nav-chat", unreadChats: true },
  // Pastki bo'shliq `profile/_layout.tsx` da — faqat bosh sahifada.
  { name: "profile", labelKey: "tabs.profile", iconName: "nav-profile" },
] as const;

export default function StudentLayout() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={[ROLES.STUDENT]}>
        <RoleTabs variant="floating" tabs={TABS} hidden={["search", "notifications"]} />
        <NewConversationHost role="student" />
      </RoleRoute>
    </ProtectedRoute>
  );
}
