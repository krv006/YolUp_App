import { useEffect } from "react";
import { AppState } from "react-native";
import { useRoomContext } from "@livekit/react-native";
import {
  ConnectionState,
  LocalAudioTrack,
  LocalVideoTrack,
  RoomEvent,
  type LocalTrackPublication,
} from "livekit-client";
import {
  audioHealth,
  bitrateSince,
  clientHealthReport,
  isHealthSource,
  liveApi,
  sentBytes,
  videoHealth,
  type HealthTrack,
} from "@/modules/live";

const HEALTH_INTERVAL_MS = 30_000;

/**
 * Jonli dars diagnostikasi — veb `use-live-health.ts`: har 30 s
 * `client-health` hisoboti (FPS, o'lcham, bitreyt, yo'qotishlar, ulanish sifati).
 *
 * Vebdan farqi: CPU himoyasi yo'q — livekit-client `LocalTrackCpuConstrained`
 * hodisasini faqat brauzerda chiqaradi (`startMonitor` RN'da `!isWeb()` bilan
 * qaytadi). `cpu_constrained` baribir WebRTC statistikasidagi
 * `qualityLimitationReason === "cpu"` dan hisoblanadi. Sahifa ko'rinishi —
 * `AppState`; protsessor/xotira soni RN'da yo'q, yuborilmaydi.
 */
export function useLiveHealth(lessonId: string) {
  const room = useRoomContext();

  useEffect(() => {
    const events: string[] = [];
    const sent = new Map<string, { bytes: number; at: number }>();

    const note = (event: string) => {
      if (events.length < 10 && !events.includes(event)) events.push(event);
    };
    const onReconnecting = () => note("reconnecting");

    async function trackHealth(publication: LocalTrackPublication): Promise<HealthTrack | null> {
      const { track, source } = publication;
      if (!track || !isHealthSource(source)) return null;
      const now = Date.now();
      if (track instanceof LocalVideoTrack) {
        const stats = await track.getSenderStats().catch(() => []);
        const bytes = sentBytes(stats);
        const bitrate = bitrateSince(sent.get(source), bytes, now);
        sent.set(source, { bytes, at: now });
        return videoHealth(source, stats, bitrate);
      }
      if (track instanceof LocalAudioTrack) {
        const stats = await track.getSenderStats().catch(() => undefined);
        const bytes = stats?.bytesSent ?? 0;
        const bitrate = bitrateSince(sent.get(source), bytes, now);
        sent.set(source, { bytes, at: now });
        return audioHealth(source, stats, bitrate);
      }
      return null;
    }

    async function report() {
      if (room.state !== ConnectionState.Connected) return;
      const publications = [...room.localParticipant.trackPublications.values()];
      const tracks = (await Promise.all(publications.map(trackHealth))).filter(
        (item) => item !== null
      );
      const payload = clientHealthReport({
        tracks,
        events: [...events],
        cpuEvent: false,
        connectionQuality: room.localParticipant.connectionQuality,
        pageVisible: AppState.currentState === "active",
      });
      events.length = 0;
      await liveApi.reportHealth(lessonId, payload).catch(() => undefined);
    }

    room.on(RoomEvent.Reconnecting, onReconnecting);
    const timer = setInterval(() => void report(), HEALTH_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      room.off(RoomEvent.Reconnecting, onReconnecting);
    };
  }, [room, lessonId]);
}
