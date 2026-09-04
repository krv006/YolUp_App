import { BoardPage } from "@/pages/board/board-page";
import { ProtectedRoute } from "@/providers/route-guards";

/** Chatdagi havoladan ochiladi (deep link). Rol cheklovi backend tomonda. */
export default function BoardRoute() {
  return (
    <ProtectedRoute>
      <BoardPage />
    </ProtectedRoute>
  );
}
