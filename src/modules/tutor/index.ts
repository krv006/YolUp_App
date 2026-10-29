export { tutorApi } from "./api/tutor.api";
export type { ExplainRequest, PracticeRequest, PracticeSetDto } from "./api/tutor.dto";
export { mapAiExplanation, mapPracticeSet } from "./lib/tutor.mappers";
export { useExplainMutation, usePracticeMutation } from "./model/tutor.queries";

// --- Mobil UI (veb `ui/practice-session.tsx` ning mobil varianti) ---
export { PracticeSession } from "./ui/practice-session";
export type { PracticeSessionProps } from "./ui/practice-session";
