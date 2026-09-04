import { RecordingPage } from "@/pages/recording/recording-page";
import { ProtectedRoute } from "@/providers/route-guards";

/**
 * Chatdagi havoladan ochiladi (deep link).
 * Rol cheklovi backend tomonda — bu yerda faqat autentifikatsiya tekshiriladi
 * (veb `app-router.tsx` dagi bilan bir xil qoida).
 */
export default function RecordingRoute() {
  return (
    <ProtectedRoute>
      <RecordingPage />
    </ProtectedRoute>
  );
}
