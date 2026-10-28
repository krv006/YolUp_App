import { useNewConversationStore } from "@/modules/conversation";
import { NewGroupSheet } from "@/modules/conversation/ui/new-group-sheet";
import { StudentEnrollmentSheet } from "@/modules/student";

/**
 * "Yangi guruh" oynasi butun bo'lim uchun BITTA — veb qobiqlaridagi kabi
 * (`app-shell-layout`, `chats-layout`): Asosiy sahifadagi "Guruh yaratish",
 * suhbatlar ro'yxatidagi "+" va Workspace shu holat orqali ochadi.
 * O'quvchida uning o'rnida kursga qo'shilish oynasi.
 */
export function NewConversationHost({ role }: { role: "teacher" | "student" }) {
  const open = useNewConversationStore((state) => state.open);
  const setOpen = useNewConversationStore((state) => state.setOpen);
  return role === "student" ? (
    <StudentEnrollmentSheet open={open} onClose={() => setOpen(false)} />
  ) : (
    <NewGroupSheet open={open} onClose={() => setOpen(false)} />
  );
}
