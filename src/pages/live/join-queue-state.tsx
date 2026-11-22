import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { queueSecondsLeft } from "@/modules/live";
import { LiveRoomState } from "@/widgets/live-room/live-room-state";

interface JoinQueueStateProps {
  delayMs: number;
  lessonTitle?: string;
  subtitle?: string;
  backLabel: string;
  onLeave: () => void;
}

/**
 * Darsga kirish navbati — veb `join-queue-state.tsx`: server `join_delay_ms`
 * bergan bo'lsa "Navbatdasiz, ~N soniya" har soniyada kamayadi, nolga
 * yetganda "Ulanmoqda". Ko'p o'quvchi bir vaqtda kirganda backend ularni
 * partiyalab kiritadi.
 */
export function JoinQueueState({ delayMs, lessonTitle, subtitle, backLabel, onLeave }: JoinQueueStateProps) {
  const { t } = useTranslation("live");
  const [readyAt] = useState(() => Date.now() + delayMs);
  const [now, setNow] = useState(() => Date.now());
  const seconds = queueSecondsLeft(readyAt, now);

  useEffect(() => {
    const timer = globalThis.setInterval(() => setNow(Date.now()), 1000);
    return () => globalThis.clearInterval(timer);
  }, []);

  return (
    <LiveRoomState
      tone="waiting"
      lessonTitle={lessonTitle}
      subtitle={subtitle}
      title={t("state.queueTitle")}
      description={seconds > 0 ? t("state.queueDescription", { count: seconds }) : t("state.queueConnecting")}
      secondaryLabel={backLabel}
      onSecondary={onLeave}
      onBack={onLeave}
    />
  );
}
