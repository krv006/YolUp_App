import { StudentAssignments } from "./student-assignments";
import { TeacherAssignments } from "./teacher-assignments";

/**
 * Guruh vazifalari — o'qituvchida veb `group-workspace.tsx` dagi
 * `AssignmentsPanel`, o'quvchida `student-group-workspace.tsx` dagi
 * `StudentAssignments`.
 */
export function AssignmentsSection({ courseId, isTeacher = false }: { courseId: string; isTeacher?: boolean }) {
  return isTeacher ? <TeacherAssignments courseId={courseId} /> : <StudentAssignments courseId={courseId} />;
}
