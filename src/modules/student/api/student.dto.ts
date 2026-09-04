export interface StudentMetric {
  id: string;
  label: string;
  value: string;
  tone: string;
}

export interface StudentNextLesson {
  id: string;
  lessonId: string;
  title: string;
  teacher: string;
  date: string;
  time: string;
  duration: string;
}

export interface StudentAssignmentPreview {
  id: string;
  title: string;
  course: string;
  due: string;
  status: "urgent" | "normal";
}

export interface StudentDashboard {
  metrics: StudentMetric[];
  nextLesson: StudentNextLesson | null;
  assignments: StudentAssignmentPreview[];
}
