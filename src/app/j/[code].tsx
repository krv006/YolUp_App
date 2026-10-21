import { JoinCoursePage } from "@/pages/join/join-course-page";
import { ProtectedRoute } from "@/providers/route-guards";

/**
 * Guruhga taklif havolasi (`yolup://j/<kod>`) — veb `/j/:code`.
 * Rol cheklovi sahifaning o'zida: o'quvchi bo'lmasa tushuntirish chiqadi.
 */
export default function JoinRoute() {
  return (
    <ProtectedRoute>
      <JoinCoursePage />
    </ProtectedRoute>
  );
}
