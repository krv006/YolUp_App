import { Redirect } from "expo-router";

/** Veb'dagi kabi: bosh sahifa suhbatlarga yo'naltiradi (app-router.tsx). */
export default function TeacherDashboardRoute() {
  return <Redirect href="/teacher/chats" />;
}
