import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { addDays } from "date-fns";
import { useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useConversations, useGroupImages } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import {
  buildScheduleDates,
  RateLessonSheet,
  useCancelLesson,
  useCreateLesson,
  useCreateLessonSchedule,
  useLessonReminder,
  useLessons,
} from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import { useOnlineStatus } from "@/shared/model";
import type { Lesson } from "@/shared/types";
import { toast } from "@/shared/ui";
import { useFloatingTabInset } from "@/providers/role-tabs";
import { LessonDetailDrawer } from "./lesson-detail-drawer";
import { LessonRatingsDialog } from "./lesson-ratings-dialog";
import { MobileSchedule, type MobileScheduleView } from "./mobile-schedule";
import { NewLessonDialog, type NewLessonValues } from "./new-lesson-dialog";

/**
 * Jadval — veb `pages/schedule/schedule-page.tsx` ning tor ekran shoxi
 * (`MobileSchedule`) va uning oynalari: dars tafsilotlari, baholar, yangi
 * dars (o'qituvchi) yoki darsni baholash (o'quvchi).
 */
export function SchedulePage() {
  const { t } = useTranslation("lesson");
  const router = useRouter();
  const online = useOnlineStatus();
  const student = useIsStudent();
  const routes = useRoleRoutes();
  const floatingInset = useFloatingTabInset();
  const lessons = useLessons({ page_size: 200 });
  const courses = useCourses();
  const conversations = useConversations(student ? "student" : "teacher");
  const groupImages = useGroupImages(student ? "student" : "teacher");
  const createLesson = useCreateLesson();
  const createSchedule = useCreateLessonSchedule();
  const cancelLesson = useCancelLesson();
  const reminder = useLessonReminder();

  const [anchor, setAnchor] = useState(() => new Date());
  const [now] = useState(() => new Date());
  const [detail, setDetail] = useState<Lesson | null>(null);
  const [ratingsOf, setRatingsOf] = useState<Lesson | null>(null);
  const [rateTarget, setRateTarget] = useState<Lesson | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<MobileScheduleView>("day");

  const items = useMemo(() => lessons.data ?? [], [lessons.data]);
  const detailLesson = detail ? (items.find((item) => item.id === detail.id) ?? detail) : null;

  function toggleReminder(lesson: Lesson) {
    const enabled = !lesson.hasReminder;
    reminder.mutate(
      { id: lesson.id, enabled },
      {
        onSuccess: (minutes) => toast.success(enabled ? t("schedule.reminderSet", { count: minutes ?? 15 }) : t("schedule.reminderCleared")),
      }
    );
  }

  const courseLook = useMemo(() => {
    const byId = new Map((courses.data ?? []).map((course) => [course.id, course]));
    return (courseId: string) => {
      const course = byId.get(courseId);
      return {
        tone: course?.color,
        image: course?.avatarUrl ?? groupImages.get(courseId) ?? null,
        students: course?.studentCount ?? 0,
        teacher: course?.teacher ?? "",
      };
    };
  }, [courses.data, groupImages]);

  const roomByCourse = useMemo(
    () => new Map((conversations.data ?? []).filter((item) => item.courseId).map((item) => [item.courseId as string, item.id])),
    [conversations.data]
  );

  function createFromDialog(values: NewLessonValues) {
    if (!values.repeatWeeks) {
      createLesson.mutate(values, { onSuccess: () => setCreateOpen(false) });
      return;
    }
    const first = new Date(`${values.date}T00:00`);
    const endsOn = addDays(first, values.repeatWeeks * 7 - 1);
    const range = {
      startsOn: values.date,
      endsOn: `${endsOn.getFullYear()}-${String(endsOn.getMonth() + 1).padStart(2, "0")}-${String(endsOn.getDate()).padStart(2, "0")}`,
      weekdays: [first.getDay() === 0 ? 7 : first.getDay()],
    };
    createSchedule.mutate(
      {
        courseId: values.courseId,
        title: values.topic,
        time: values.time,
        durationMinutes: Number(values.duration) || 45,
        ...range,
        dates: buildScheduleDates(range),
      },
      { onSuccess: () => setCreateOpen(false) }
    );
  }

  function openChat(lesson: Lesson) {
    const room = roomByCourse.get(lesson.courseId);
    router.push((room ? routes.chat(room) : routes.chats) as never);
  }

  const joinLesson = (lesson: Lesson) => router.push(ROUTES.live(lesson.id) as never);

  return (
    <>
      <MobileSchedule
        view={view}
        anchor={anchor}
        now={now}
        online={online}
        loading={lessons.isLoading}
        error={lessons.isError}
        onRetry={() => void lessons.refetch()}
        lessons={items}
        courseLook={courseLook}
        onView={setView}
        onAnchor={setAnchor}
        onSelect={setDetail}
        onChat={openChat}
        onJoin={joinLesson}
        student={student}
        onCreate={student ? undefined : () => setCreateOpen(true)}
        // Suzuvchi panel ustida aylanadi (`pb-32`).
        bottomInset={floatingInset + 16}
      />

      <LessonDetailDrawer
        lesson={detailLesson}
        studentCount={detail ? courseLook(detail.courseId).students : 0}
        now={now}
        onOpenChange={(open) => !open && setDetail(null)}
        onChat={(lesson) => {
          setDetail(null);
          openChat(lesson);
        }}
        // Mobilda jadval stekda qoladi — qaytganda eski oyna ochiq turmasin.
        onJoin={(lesson) => {
          setDetail(null);
          joinLesson(lesson);
        }}
        student={student}
        teacherName={detail ? courseLook(detail.courseId).teacher : ""}
        onRemind={toggleReminder}
        onRecording={(lesson) => {
          setDetail(null);
          router.push(ROUTES.recording(lesson.id) as never);
        }}
        onRate={(lesson) => {
          setDetail(null);
          setRateTarget(lesson);
        }}
        onRatings={(lesson) => {
          setDetail(null);
          setRatingsOf(lesson);
        }}
        onCancel={(lesson) => {
          cancelLesson.mutate({ id: lesson.id, scope: "one" });
          setDetail(null);
        }}
      />

      <LessonRatingsDialog lesson={ratingsOf} onOpenChange={(open) => !open && setRatingsOf(null)} />

      {student ? (
        <RateLessonSheet lesson={rateTarget} onClose={() => setRateTarget(null)} />
      ) : (
        <NewLessonDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          courses={(courses.data ?? []).map((course) => ({
            id: course.id,
            title: course.title,
            studentCount: course.studentCount ?? 0,
            tone: course.color,
            image: course.avatarUrl ?? groupImages.get(course.id) ?? null,
          }))}
          pending={createLesson.isPending || createSchedule.isPending}
          onSubmit={createFromDialog}
        />
      )}
    </>
  );
}
