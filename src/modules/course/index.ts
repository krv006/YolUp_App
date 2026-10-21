/**
 * `course` modulining mobil barrel'i.
 *
 * Veb `src/modules/course/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { courseApi } from "./api/course.api";
export type {
  CourseDto,
  CourseFormInput,
  CourseRequestDto,
  CourseInviteLink,
  CourseInviteLinkInput,
  CourseStudentPresence,
  CourseStudentSearchDto,
  EnrollmentAction,
  EnrollmentDto,
  EnrollPayload,
  SubjectOptionDto,
} from "./api/course.dto";
export { mapCourseDto, mapCoursePage, mapCourseRequest, mapCourseUserDto, mapEnrollmentDto } from "./lib/course.mappers";
export {
  courseKeys,
  useCourse,
  useCourses,
  useCoursePage,
  useCourseCatalog,
  useCourseStudents,
  useCourseStudentPresence,
  useCreateInviteLink,
  useDeleteInviteLink,
  useInviteLink,
  useJoinCourse,
  useCourseRequests,
  useCreateCourse,
  useCreateEnrollment,
  useDeleteCourse,
  useCreateCourseStudent,
  useEnrollStudent,
  useRespondCourseRequest,
  useSearchCourseStudents,
  useSubjects,
  useUnenrollStudent,
  useUpdateCourse,
} from "./model/course.queries";
