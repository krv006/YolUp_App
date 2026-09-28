import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Search, Send, UserRoundX } from "lucide-react-native";
import { useCourseStudents } from "@/modules/course";
import {
  Avatar,
  Button,
  Input,
  ScreenEmpty,
  ScreenLoading,
  Separator,
  Sheet,
  Text,
  useTheme,
} from "@/shared/ui";
import { useBanFromLesson, useInviteToLesson } from "../model/live.queries";

export interface LessonInviteSheetProps {
  lessonId: string;
  courseId: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Darsga taklif qilish va chiqarib yuborish — veb `lesson-invite-dialog.tsx`
 * ning mobil varianti.
 *
 * Taklif — bu OGOHLANTIRISH, majburiy kirish emas: o'quvchi darsga o'zi
 * kiradi (veb'dagi izoh bilan bir xil).
 */
export function LessonInviteSheet({ lessonId, courseId, open, onClose }: LessonInviteSheetProps) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const [search, setSearch] = useState("");

  const students = useCourseStudents(courseId, { page_size: 100 }, open);
  const invite = useInviteToLesson(lessonId);
  const ban = useBanFromLesson(lessonId);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = (students.data?.items ?? []).map((item) => item.student);
    if (!query) return items;
    return items.filter((student) =>
      `${student.name} ${student.username}`.toLowerCase().includes(query)
    );
  }, [students.data, search]);

  return (
    <Sheet
      open={open}
      onClose={() => {
        setSearch("");
        onClose();
      }}
      title={t("live.darsga_taklif_qilish")}
      description={t("live.taklif_bu_ogohlantirish_oquvchi_darsga_ozi_k")}
    >
      <Input
        placeholder={t("live.oquvchi_qidirish")}
        icon={<Search size={18} color={palette["muted-foreground"]} />}
        value={search}
        onChangeText={setSearch}
      />

      {students.isLoading ? <ScreenLoading label={t("live.royxat_yuklanmoqda")} /> : null}

      {!students.isLoading && visible.length === 0 ? (
        <ScreenEmpty title={t("live.oquvchi_topilmadi")} />
      ) : null}

      {visible.map((student, index) => (
        <View key={student.id}>
          {index > 0 ? <Separator /> : null}
          <View style={styles.row}>
            <Avatar name={student.name} tone={student.avatarTone} size="md" />
            <View style={styles.body}>
              <Text variant="label" numberOfLines={1}>
                {student.name}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                @{student.username}
              </Text>
            </View>

            <Button
              title={t("live.taklif")}
              fullWidth={false}
              loading={invite.isPending}
              icon={<Send size={15} color={palette["primary-foreground"]} />}
              onPress={() => invite.mutate(student.id)}
            />
            <Button
              title=""
              variant="secondary"
              fullWidth={false}
              loading={ban.isPending}
              icon={<UserRoundX size={16} color={palette.destructive} />}
              onPress={() => ban.mutate(student.id)}
              accessibilityLabel={`${student.name}ni darsdan chiqarish`}
              style={styles.banButton}
            />
          </View>
        </View>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  body: { flex: 1, gap: 2 },
  // Faqat ikonkali tugma — matn o'rni kerak emas.
  banButton: { paddingHorizontal: 12 },
});
