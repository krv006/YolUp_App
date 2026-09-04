import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Search, UserPlus } from "lucide-react-native";
import {
  useCreateCourseStudent,
  useEnrollStudent,
  useSearchCourseStudents,
} from "@/modules/course";
import {
  Avatar,
  Badge,
  Button,
  Input,
  ScreenLoading,
  Separator,
  Sheet,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";

export interface AddStudentSheetProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
}

const EMPTY_STUDENT = { username: "", password: "", first_name: "", last_name: "" };

/**
 * Kursga o'quvchi qo'shish — veb `add-student-dialog.tsx` (267 qator) ning
 * mobil varianti.
 *
 * Ikki yo'l: mavjud o'quvchini QIDIRIB qo'shish yoki unga yangi hisob
 * yaratish. Qidiruv kamida 2 belgidan boshlanadi (backend qoidasi) —
 * aks holda har harfda so'rov ketardi.
 */
export function AddStudentSheet({ open, onClose, courseId }: AddStudentSheetProps) {
  const { palette } = useTheme();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_STUDENT);

  const results = useSearchCourseStudents(open ? courseId : null, query);
  const enroll = useEnrollStudent();
  const createStudent = useCreateCourseStudent();

  function close() {
    setQuery("");
    setCreating(false);
    setForm(EMPTY_STUDENT);
    onClose();
  }

  async function createAndEnroll() {
    try {
      await createStudent.mutateAsync({ courseId, form });
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Hisob yaratilmadi");
    }
  }

  const canCreate =
    form.first_name.trim() && form.last_name.trim() && form.username.trim() && form.password.length >= 8;

  return (
    <Sheet
      open={open}
      onClose={close}
      title="O'quvchi qo'shish"
      description="Mavjud o'quvchini qidiring yoki yangi hisob yarating."
    >
      {creating ? (
        <>
          <Input
            label="Ism"
            value={form.first_name}
            onChangeText={(value) => setForm((current) => ({ ...current, first_name: value }))}
            autoCapitalize="words"
          />
          <Input
            label="Familiya"
            value={form.last_name}
            onChangeText={(value) => setForm((current) => ({ ...current, last_name: value }))}
            autoCapitalize="words"
          />
          <Input
            label="Login"
            value={form.username}
            onChangeText={(value) => setForm((current) => ({ ...current, username: value }))}
          />
          <Input
            label="Vaqtinchalik parol"
            secure
            value={form.password}
            onChangeText={(value) => setForm((current) => ({ ...current, password: value }))}
            error={
              form.password.length > 0 && form.password.length < 8
                ? "Parol kamida 8 ta belgidan iborat bo'lsin"
                : undefined
            }
          />
          <Button
            title="Yaratish va qo'shish"
            loading={createStudent.isPending}
            disabled={!canCreate}
            onPress={() => void createAndEnroll()}
          />
          <Button title="Qidiruvga qaytish" variant="ghost" onPress={() => setCreating(false)} />
        </>
      ) : (
        <>
          <Input
            label="Qidiruv"
            placeholder="Ism yoki login (kamida 2 belgi)"
            icon={<Search size={18} color={palette["muted-foreground"]} />}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />

          {results.isLoading && query.trim().length >= 2 ? (
            <ScreenLoading label="Qidirilmoqda…" />
          ) : null}

          {query.trim().length >= 2 && (results.data ?? []).length === 0 && !results.isLoading ? (
            <Text variant="caption" tone="muted">
              Hech kim topilmadi.
            </Text>
          ) : null}

          {(results.data ?? []).map((student, index) => (
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
                {student.enrollStatus ? (
                  <Badge
                    label={student.enrollStatus === "approved" ? "A'zo" : "Kutilmoqda"}
                    tone={student.enrollStatus === "approved" ? "success" : "warning"}
                  />
                ) : (
                  <Button
                    title="Qo'shish"
                    fullWidth={false}
                    loading={enroll.isPending}
                    onPress={() => enroll.mutate({ courseId, studentId: student.id })}
                  />
                )}
              </View>
            </View>
          ))}

          <Button
            title="Yangi o'quvchi hisobi yaratish"
            variant="secondary"
            icon={<UserPlus size={16} color={palette["secondary-foreground"]} />}
            onPress={() => setCreating(true)}
          />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  body: { flex: 1, gap: 2 },
});
