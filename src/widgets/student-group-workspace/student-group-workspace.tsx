import { useCourse } from "@/modules/course";
import { useAssignments } from "@/modules/homework";
import { useLessons } from "@/modules/lesson";
import { useQuizzes } from "@/modules/quiz";
import { StudentLessons } from "./student-lessons";
import { StudentTasks } from "./student-tasks";

/**
 * O'quvchining guruh bo'limlari — veb `student-group-workspace.tsx` dagi
 * "Darslar" va "Vazifalar" tablari (chat va tablar qatori umumiy
 * `pages/chats/conversation-page.tsx` da). Faqat ochilgan bo'lim so'rov yuboradi.
 */
export function StudentGroupSection({ tab, courseId, groupImage = null }: { tab: "lessons" | "assignments"; courseId: string; groupImage?: string | null }) {
  const course = useCourse(courseId);
  const lessons = useLessons({ course: courseId, page_size: 100 }, tab === "lessons");
  const assignments = useAssignments(courseId, tab === "assignments");
  const quizzes = useQuizzes(courseId, tab === "assignments" && Boolean(courseId));

  if (tab === "lessons") return <StudentLessons lessons={lessons.data} loading={lessons.isLoading} teacher={course.data?.teacher} />;
  return (
    <StudentTasks
      assignments={assignments.data ?? []}
      quizzes={(quizzes.data ?? []).filter((quiz) => quiz.courseId === courseId)}
      loading={assignments.isLoading}
      courseTitle={course.data?.title ?? ""}
      courseImage={course.data?.avatarUrl ?? groupImage}
      courseTone={course.data?.color}
    />
  );
}
