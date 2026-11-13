import { useEffect, useState } from "react";
import { secondsUntil } from "../lib/countdown";

export function useQuizCountdown(endsAt: string | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [endsAt]);

  return secondsUntil(endsAt, now);
}
