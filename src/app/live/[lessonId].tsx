import { LiveLessonPage } from "@/pages/live/live-lesson-page";
import { ProtectedRoute } from "@/providers/route-guards";

/** Jonli dars — to'liq ekran. Rol cheklovi backend tokenida. */
export default function LiveLessonRoute() {
  return (
    <ProtectedRoute>
      <LiveLessonPage />
    </ProtectedRoute>
  );
}
