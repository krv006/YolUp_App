import { StyleSheet, View } from "react-native";
import { UserMinus } from "lucide-react-native";
import { radius, Text, useTheme } from "@/shared/ui";
import { useBoard } from "../model/board.queries";

export interface AwayStudentsNoticeProps {
  lessonId: string;
  /** Faqat o'qituvchida so'raladi — boshqa rolga backend bu ma'lumotni bermaydi. */
  enabled: boolean;
}

/**
 * Dars oynasidan chiqib ketgan o'quvchilar (docs/STAFF_API.md §7).
 *
 * Ataylab KICHIK va oynasiz: o'qituvchi dars o'tayotganda uni bo'lmaslik
 * kerak. Hech kim chiqib ketmagan bo'lsa umuman ko'rinmaydi.
 *
 * `useBoard` bilan bir xil so'rov kalitini ishlatadi — doska paneli bilan
 * bitta so'rovni baham ko'radi, ya'ni qo'shimcha trafik yo'q.
 */
export function AwayStudentsNotice({ lessonId, enabled }: AwayStudentsNoticeProps) {
  const { palette } = useTheme();
  const board = useBoard(lessonId, { enabled });
  const away = enabled ? (board.data?.awayStudents ?? []) : [];

  if (away.length === 0) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.root, { backgroundColor: palette["warning-soft"] }]}
    >
      <UserMinus size={15} color={palette["warning-strong"]} />
      <View style={styles.body}>
        <Text variant="caption" style={{ color: palette["warning-strong"], fontWeight: "600" }}>
          Darsdan chiqqan
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {away.map((student) => student.name).join(", ")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  body: { flex: 1, gap: 1 },
});
