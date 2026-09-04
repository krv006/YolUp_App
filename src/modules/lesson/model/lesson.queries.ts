import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type QueryParams } from "@/shared/api";
import { describeCreateError } from "@/modules/auth";
import { lessonApi } from "../api/lesson.api";
import type { LessonFormInput, LessonRatingInput } from "../api/lesson.dto";
import { addMinutesToTime, toBackendWeekdays, weeksBetween } from "../lib/lesson-schedule";

export const lessonKeys = Object.freeze({
  all: ["lessons"] as const,
  list: (params: QueryParams = {}) => ["lessons", "list", params] as const,
  detail: (id: string) => ["lessons", "detail", id] as const,
  recording: (id: string) => ["lessons", "recording", id] as const,
  ratings: (id: string) => ["lessons", "ratings", id] as const,
});

/**
 * Dars hali yozilayotganda holat `recording` — bu soatlab davom etishi
 * mumkin, tez-tez so'rash shart emas.
 */
const RECORDING_POLL_MS = 15_000;
/**
 * Video+audio birlashtirilayotganda holat `merging` — bu `-c copy` bilan
 * (qayta kodlashsiz) bir necha soniyada tugaydi, shuning uchun TEZ so'raymiz
 * — aks holda foydalanuvchi tayyor bo'lgan yozuvni ko'rish uchun keraksiz
 * uzoq (eski qiymatda 15s gacha) kutib turishi mumkin edi.
 */
const MERGING_POLL_MS = 2_000;

/** `enabled` — chaqiruvchi ko'rinmayotgan bo'lim uchun so'rov yubormasligi mumkin. */
export function useLessons(params: QueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: lessonKeys.list(params),
    queryFn: ({ signal }) => lessonApi.getAll({ signal, query: params }),
    select: (page) => page.items,
    enabled,
  });
}

/** Dars boshlanganini kech sezmaslik uchun — chat ochiq turganda qayta so'raladi. */
const LIVE_POLL_MS = 20_000;

/**
 * Kursda hozir jonli dars bormi — chat tepasidagi chiziq uchun.
 *
 * Polling shu yerda: dars o'qituvchi kirgan payt LIVE bo'ladi va buni chat
 * ochiq turgan o'quvchi darhol ko'rishi kerak. Chiziq ko'rinmasa (kurs yo'q)
 * so'rov ham yuborilmaydi.
 */
export function useLiveLesson(courseId: string | null) {
  const params: QueryParams = { course: courseId, status: "live", page_size: 5 };
  return useQuery({
    queryKey: lessonKeys.list(params),
    queryFn: ({ signal }) => lessonApi.getAll({ signal, query: params }),
    select: (page) => page.items[0] ?? null,
    enabled: Boolean(courseId),
    refetchInterval: LIVE_POLL_MS,
  });
}

/**
 * Barcha kurslardagi jonli darslar — suhbatlar ro'yxatidagi belgi uchun.
 *
 * Bitta so'rov: har bir guruh uchun alohida so'rasak, 20 ta chat 20 ta so'rov
 * bo'lardi. Backend ro'yxatni foydalanuvchiga tegishli kurslar bilan cheklaydi,
 * shuning uchun qaytgan `courseId` lar bevosita chat qatorlariga tushadi.
 */
export function useLiveLessons(enabled = true) {
  const params: QueryParams = { status: "live", page_size: 50 };
  return useQuery({
    queryKey: lessonKeys.list(params),
    queryFn: ({ signal }) => lessonApi.getAll({ signal, query: params }),
    // Server filtri e'tiborga olinmasa ham xato belgi chiqmasin.
    select: (page) => page.items.filter((lesson) => lesson.status === "live"),
    enabled,
    refetchInterval: LIVE_POLL_MS,
  });
}

export function useLessonPage(params: QueryParams = {}) {
  return useQuery({
    queryKey: lessonKeys.list(params),
    queryFn: ({ signal }) => lessonApi.getAll({ signal, query: params }),
  });
}

export function useLesson(id: string | null) {
  return useQuery({
    queryKey: lessonKeys.detail(id ?? ""),
    queryFn: ({ signal }) => lessonApi.getById(id as string, { signal }),
    enabled: Boolean(id),
  });
}

export function useCreateLesson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (form: LessonFormInput) => lessonApi.create(form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: lessonKeys.all });
      toast.success("Dars saqlandi");
    },
    // Admin hali tasdiqlamagan o'qituvchi dars yarata olmaydi (403) — sabab aniq ko'rsatiladi.
    onError: (error) => toast.error(describeCreateError(error)),
  });
}

export interface LessonScheduleInput {
  courseId: string;
  title: string;
  /** `HH:mm` */
  time: string;
  durationMinutes: number;
  /** ISO hafta kunlari: 1 = Dushanba … 7 = Yakshanba. */
  weekdays: number[];
  /** `YYYY-MM-DD` */
  startsOn: string;
  endsOn: string;
  /** Zaxira usul uchun oldindan hisoblangan sanalar. */
  dates: string[];
}

/**
 * Takrorlanuvchi jadval bo'yicha darslar yaratadi.
 *
 * Avval SERVER endpointi sinaladi (`POST /courses/{id}/schedule/`): u amalni
 * atomik bajaradi va o'qituvchining barcha kurslari bo'yicha to'qnashuvni
 * tekshiradi — bu mijoz tomonida imkonsiz, chunki `GET /lessons/` boshqa
 * o'qituvchining darslarini ko'rsatmaydi.
 *
 * Endpoint hali hamma muhitga chiqarilmagan. 404 kelsa, eski usulga —
 * har sana uchun alohida `POST /lessons/` ga qaytiladi. U atomik emas,
 * shuning uchun natijada nechtasi saqlanmagani ham aytiladi.
 */
export function useCreateLessonSchedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: LessonScheduleInput) => {
      const viaServer = await lessonApi.createSchedule(input.courseId, {
        title: input.title,
        days: toBackendWeekdays(input.weekdays),
        start_time: input.time,
        end_time: addMinutesToTime(input.time, input.durationMinutes),
        weeks: weeksBetween(input.startsOn, input.endsOn),
        start_date: input.startsOn,
      });

      if (viaServer) {
        return { created: viaServer.count, failed: [] as Array<{ date: string; message: string }> };
      }

      const local = await lessonApi.createMany(input.dates, {
        courseId: input.courseId,
        topic: input.title,
        time: input.time,
        duration: input.durationMinutes,
      });
      return { created: local.created.length, failed: local.failed };
    },
    onSuccess: ({ created, failed }) => {
      client.invalidateQueries({ queryKey: lessonKeys.all });
      if (!failed.length) {
        toast.success(`${created} ta dars jadvalga qo‘shildi`);
        return;
      }
      if (created) {
        toast.warning(`${created} ta dars qo‘shildi, ${failed.length} tasi saqlanmadi`);
        return;
      }
      toast.error("Darslarni saqlab bo‘lmadi");
    },
  });
}

export function useUpdateLesson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: { id: string; form: LessonFormInput }) => lessonApi.update(id, form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: lessonKeys.all });
      toast.success("Dars yangilandi");
    },
  });
}

export function useDeleteLesson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lessonApi.remove(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: lessonKeys.all });
      toast.success("Dars o‘chirildi");
    },
  });
}

export function useFinishLesson() {
  const client = useQueryClient();
  return useMutation({
    // 🟡 MOBIL FARQI (MOBILE_PLAN §7.3):
    // Veb versiya bu yerda brauzerda yozilgan MediaRecorder bo'laklarini
    // serverga yuborib, keyin `finalizeRecordingAudio/Video` chaqiradi. Bu —
    // LiveKit Egress ishlamagani uchun yozilgan vaqtinchalik yechim edi.
    // Mobilda dars yozuvi TO'LIQ server tomonda (Egress) bo'ladi, shuning
    // uchun mijoz faqat darsni yakunlaydi.
    mutationFn: ({ id, recordingTitle }: { id: string; recordingTitle?: string }) =>
      lessonApi.finish(id, recordingTitle),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: lessonKeys.all });
      toast.success("Dars yakunlandi — yozuv guruh chatiga tushadi");
    },
  });
}

export function useLessonRecording(id: string | null) {
  return useQuery({
    queryKey: lessonKeys.recording(id ?? ""),
    queryFn: ({ signal }) => lessonApi.getRecording(id as string, { signal }),
    enabled: Boolean(id),
    // Havola 3 soatlik va imzolangan — keshdan eskirgan URL bilan pleer ochilib qolmasin.
    staleTime: 0,
    // Dars davomida o'qituvchi brauzerida hali yozilmoqda — tayyor bo'lgunicha kuzatib turamiz.
    // `merging` tezroq so'raladi — bu bosqich juda qisqa (bir necha soniya).
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "merging") return MERGING_POLL_MS;
      if (status === "recording") return RECORDING_POLL_MS;
      return false;
    },
  });
}

export function useDeleteRecording() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lessonApi.removeRecording(id),
    onSuccess: (id) => {
      client.invalidateQueries({ queryKey: lessonKeys.recording(id) });
      toast.success("Video yozuv o‘chirildi");
    },
  });
}

/**
 * Darsga qo'yilgan baholar.
 *
 * Ro'yxatni ko'rish huquqi rolga bog'liq — o'quvchida 403 kelishi mumkin.
 * Bu xato emas: forma shunchaki "avval baholaganmisiz" ma'lumotisiz ochiladi,
 * shuning uchun qayta urinilmaydi va global toast ko'rsatilmaydi.
 */
export function useLessonRatings(lessonId: string | null, enabled = true) {
  return useQuery({
    queryKey: lessonKeys.ratings(lessonId ?? ""),
    queryFn: ({ signal }) => lessonApi.getRatings(lessonId as string, { signal }),
    enabled: Boolean(lessonId) && enabled,
    retry: false,
  });
}

/** Xatoni chaqiruvchi forma ichida ko'rsatadi (masalan "dars hali tugamagan"). */
export function useRateLesson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LessonRatingInput }) =>
      lessonApi.rate(id, input),
    onSuccess: () => {
      // Ro'yxatdagi `avg_rating`/`rating_count` ham yangilanishi kerak.
      client.invalidateQueries({ queryKey: lessonKeys.all });
      toast.success("Bahoyingiz uchun rahmat!");
    },
  });
}
