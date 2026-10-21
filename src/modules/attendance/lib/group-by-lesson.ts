import type { AttendanceRow } from "@/shared/types";

export interface LessonAttendanceGroup {
  lessonId: string;
  lesson: string;
  startedAt: string | null;
  rows: AttendanceRow[];
  studentsCount: number;
  attentionAnswered: number;
  attentionTotal: number;
  focusExits: number;
  awaySeconds: number;
  hasAlert: boolean;
}

export function groupAttendanceByLesson(rows: AttendanceRow[]): LessonAttendanceGroup[] {
  const groups = new Map<string, LessonAttendanceGroup>();

  for (const row of rows) {
    let group = groups.get(row.lessonId);
    if (!group) {
      group = {
        lessonId: row.lessonId,
        lesson: row.lesson,
        startedAt: null,
        rows: [],
        studentsCount: 0,
        attentionAnswered: 0,
        attentionTotal: 0,
        focusExits: 0,
        awaySeconds: 0,
        hasAlert: false,
      };
      groups.set(row.lessonId, group);
    }

    group.rows.push(row);
    group.studentsCount += 1;
    group.attentionAnswered += row.attentionAnswered;
    group.attentionTotal += row.attentionTotal;
    group.focusExits += row.focus.exits;
    group.awaySeconds += row.focus.awaySeconds;
    group.hasAlert ||= row.focus.alert;

    if (row.joinedAt && (!group.startedAt || row.joinedAt < group.startedAt)) {
      group.startedAt = row.joinedAt;
    }
  }

  return [...groups.values()];
}
