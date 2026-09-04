import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalParticipantPermissions, useRoomContext } from "@livekit/components-react";
import { toast } from "sonner";
import { useBoard, useBoardChannel, type BoardSocketEvent } from "@/modules/board";
import { CAMERA_SOURCE, canPublishSource } from "../lib/live-permissions";
import { useDenyCamera, useGrantCamera, useRequestCamera } from "./live.queries";

export interface CameraRequest {
  studentId: string;
  name: string;
}

/**
 * Kamera so'rov/ruxsat signallari (FRONTEND_TODO_CAMERA_BOARD.md §1) —
 * `useMicSignals` bilan AYNAN bir xil naqsh, faqat mikrofon o'rniga kamera.
 *
 * Signallar doska kanalidan keladi — dars davomida ochiq turgan yagona kanal
 * shu. Navbat FIFO: birinchi so'ragan birinchi turadi.
 */
export function useCameraSignals(lessonId: string, isTeacher: boolean) {
  const room = useRoomContext();
  const permissions = useLocalParticipantPermissions();
  const grant = useGrantCamera(lessonId);
  const deny = useDenyCamera(lessonId);
  const request = useRequestCamera(lessonId);

  /** Kanal orqali kelgan so'rovlar — kelish tartibida. */
  const [live, setLive] = useState<CameraRequest[]>([]);
  /** Javob berilganlar: eskirgan ro'yxat ularni qaytarib chiqarmasligi uchun. */
  const [answered, setAnswered] = useState<string[]>([]);
  /** O'quvchida: so'rov yuborilgan, javob kutilmoqda (takror so'rash bloklanadi). */
  const [waiting, setWaiting] = useState(false);

  /*
   * Boshlang'ich navbat doska holatidan olinadi: o'qituvchi darsga kech
   * qo'shilsa yoki sahifani yangilasa, WS ulanishidan oldin kelgan so'rovlar
   * yo'qolib ketmasligi kerak.
   */
  const board = useBoard(lessonId, { enabled: isTeacher });
  const pending = board.data?.pendingCameraRequests;

  const requests = useMemo(() => {
    if (!isTeacher) return [];
    const queue = new Map<string, CameraRequest>();
    // Server ro'yxati oldin: u FIFO tartibida keladi va eng ishonchli manba.
    for (const item of pending ?? []) queue.set(item.id, { studentId: item.id, name: item.name });
    for (const item of live) if (!queue.has(item.studentId)) queue.set(item.studentId, item);
    for (const studentId of answered) queue.delete(studentId);
    return [...queue.values()];
  }, [isTeacher, pending, live, answered]);

  const canPublishCamera = canPublishSource(permissions, CAMERA_SOURCE);
  /** Ruxsat keldi-yu, LiveKit huquqlari hali yetib kelmadi — yetganda yoqamiz. */
  const pendingEnable = useRef(false);

  const enableCamera = useCallback(() => {
    room.localParticipant.setCameraEnabled(true).catch(() => undefined);
  }, [room]);

  const { mutate: grantCamera } = grant;
  const { mutate: denyCamera } = deny;

  /** Signal aynan shu foydalanuvchi haqidami (token'da identity — o'quvchi id'si). */
  const isMine = useCallback(
    (studentId: string) => !isTeacher && studentId === room.localParticipant.identity,
    [isTeacher, room]
  );

  const handleEvent = useCallback(
    (event: BoardSocketEvent) => {
      if (event.type === "camera_request") {
        // O'quvchiga boshqa o'quvchining so'rovi ko'rinmasligi kerak.
        if (!isTeacher) return;
        const incoming: CameraRequest = { studentId: event.studentId, name: event.name || "O‘quvchi" };
        // Javob berilgandan keyin qayta so'rashi mumkin — eski javobni unutamiz.
        setAnswered((current) => current.filter((id) => id !== incoming.studentId));
        setLive((current) =>
          current.some((item) => item.studentId === incoming.studentId)
            ? current
            : [...current, incoming]
        );
        toast(`${incoming.name} kamerasini yoqmoqchi`, {
          description: "Kamera uchun ruxsat so‘rayapti.",
          duration: 12_000,
          action: { label: "Ruxsat berish", onClick: () => grantCamera(incoming.studentId) },
          cancel: { label: "Rad etish", onClick: () => denyCamera(incoming.studentId) },
        });
        return;
      }

      if (event.type !== "camera_granted" && event.type !== "camera_denied") return;

      // Ikkala javob ham so'rovni navbatdan chiqaradi.
      setAnswered((current) =>
        current.includes(event.studentId) ? current : [...current, event.studentId]
      );
      if (!isMine(event.studentId)) return;
      setWaiting(false);

      if (event.type === "camera_denied") {
        toast.error("O‘qituvchi hozircha ruxsat bermadi");
        return;
      }

      toast.success("O‘qituvchi kamerangizni yoqdi");
      if (canPublishCamera) enableCamera();
      else pendingEnable.current = true;
    },
    [canPublishCamera, denyCamera, enableCamera, grantCamera, isMine, isTeacher]
  );

  useBoardChannel(lessonId, Boolean(lessonId), handleEvent);

  // Huquqlar server tomondan yangilanadi — signal bilan bir vaqtda kelmasligi mumkin.
  useEffect(() => {
    if (!pendingEnable.current || !canPublishCamera) return;
    pendingEnable.current = false;
    enableCamera();
  }, [canPublishCamera, enableCamera]);

  const { mutate: sendRequest } = request;
  const requestCamera = useCallback(
    () => sendRequest(undefined, { onSuccess: () => setWaiting(true) }),
    [sendRequest]
  );

  return {
    /** O'qituvchi uchun: navbat (FIFO) va javob berish. */
    requests,
    grant,
    deny,
    /** O'quvchi uchun: so'rov yuborish va kutish holati. */
    requestCamera,
    requesting: request.isPending,
    waiting,
  };
}
