import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Timer } from "lucide-react-native";
import { Text, radius, useTheme } from "@/shared/ui";
import { formatClock, secondsUntil } from "../lib/server-time";

export interface ExamTimerProps {
  deadline: string | null;
  label: string;
  onExpire?: () => void;
}

/**
 * Taymer SERVER vaqtiga qarab ishlaydi: `secondsUntil` ichida
 * `server_now` bilan hisoblangan offset qo'llanadi, shuning uchun
 * telefon soati noto'g'ri bo'lsa ham qolgan vaqt to'g'ri ko'rinadi.
 */
export function ExamTimer({ deadline, label, onExpire }: ExamTimerProps) {
  const { palette } = useTheme();
  const [left, setLeft] = useState(() => secondsUntil(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      const next = secondsUntil(deadline);
      setLeft(next);
      if (next <= 0) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  const urgent = left <= 60;
  return (
    <View
      style={[
        styles.root,
        {
          borderColor: urgent ? palette.destructive : palette.border,
          backgroundColor: urgent ? palette["destructive-soft"] : palette["surface-tint"],
        },
      ]}
    >
      <Timer size={15} color={urgent ? palette.destructive : palette["muted-foreground"]} />
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="label" style={{ color: urgent ? palette.destructive : palette.foreground }}>
        {formatClock(left)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: radius.full,
  },
});
