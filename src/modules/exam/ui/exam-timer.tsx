import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Timer } from "lucide-react-native";
import { useQuizColors } from "@/modules/quiz";
import { radius, Text, useTheme } from "@/shared/ui";
import { formatClock, secondsUntil } from "../lib/server-time";

export interface ExamTimerProps {
  deadline: string | null;
  label: string;
  onExpire?: () => void;
}

/**
 * Taymer — veb `exam-timer.tsx` porti (`.exam-timer`): min-h 38, bo'shliq
 * 0 14, kuchli chegara va surface-tint fon; oxirgi daqiqada qizil.
 *
 * SERVER vaqtiga qarab ishlaydi (`secondsUntil` offset bilan), shuning
 * uchun telefon soati noto'g'ri bo'lsa ham qolgan vaqt to'g'ri.
 */
export function ExamTimer({ deadline, label, onExpire }: ExamTimerProps) {
  const { palette } = useTheme();
  const colors = useQuizColors();
  const [left, setLeft] = useState(() => secondsUntil(deadline));
  // Vebdagidek: interval faqat muddat o'zgarganda qayta quriladi.
  const expireRef = useRef(onExpire);
  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = secondsUntil(deadline);
      setLeft(next);
      if (next <= 0) {
        clearInterval(timer);
        expireRef.current?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const urgent = left <= 60;
  const color = urgent ? palette.destructive : colors.foreground;
  return (
    <View
      accessibilityRole="timer"
      style={[
        styles.root,
        urgent
          ? { borderColor: "#f4dadd", backgroundColor: "#fff0f2" }
          : { borderColor: colors.borderStrong, backgroundColor: colors.surfaceTint },
      ]}
    >
      <Timer size={16} color={color} />
      <Text variant="caption" style={[styles.label, { color }]}>
        {label}
      </Text>
      <Text variant="body" style={[styles.clock, { color }]}>
        {formatClock(left)}
      </Text>
    </View>
  );
}

/** Imtihon boshlanishigacha qolgan vaqt — veb `exam-countdown.tsx` (24 soatdan kam qolganda). */
export function ExamCountdown({ startsAt }: { startsAt: string }) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const [left, setLeft] = useState(() => secondsUntil(startsAt));

  useEffect(() => {
    const timer = setInterval(() => setLeft(secondsUntil(startsAt)), 1000);
    return () => clearInterval(timer);
  }, [startsAt]);

  if (left > 24 * 3600) return null;
  return (
    <Text variant="caption" style={[styles.countdown, { color: palette["primary-text"] }]}>
      {t("list.startsIn", { time: formatClock(left) })}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  label: { fontSize: 13, fontWeight: "700" },
  clock: { fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
  countdown: { fontWeight: "700" },
});
