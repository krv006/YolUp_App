import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("mobile");
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
    } catch {
      /*
       * XATO BU YERDA KO'RSATILMAYDI — uni mutatsiyaning `onError` i
       * chiqaradi. Ilgari ikkalasi ham chiqarardi va toast EKRANDA IKKI
       * MARTA ko'rinardi.
       *
       * `catch` o'zi kerak: `mutateAsync` rad javob bersa, quyidagi
       * `close()` bajarilmasligi va rad javob e'tiborsiz qolmasligi shart.
       */
    }
  }

  const canCreate =
    form.first_name.trim() && form.last_name.trim() && form.username.trim() && form.password.length >= 8;

  return (
    <Sheet
      open={open}
      onClose={close}
      title={t("groupworkspace.oquvchi_qoshish")}
      description={t("groupworkspace.mavjud_oquvchini_qidiring_yoki_yangi_hisob_y")}
    >
      {creating ? (
        <>
          <Input
            label={t("groupworkspace.ism")}
            value={form.first_name}
            onChangeText={(value) => setForm((current) => ({ ...current, first_name: value }))}
            autoCapitalize="words"
          />
          <Input
            label={t("groupworkspace.familiya")}
            value={form.last_name}
            onChangeText={(value) => setForm((current) => ({ ...current, last_name: value }))}
            autoCapitalize="words"
          />
          <Input
            label={t("groupworkspace.login")}
            value={form.username}
            onChangeText={(value) => setForm((current) => ({ ...current, username: value }))}
          />
          <Input
            label={t("groupworkspace.vaqtinchalik_parol")}
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
            title={t("groupworkspace.yaratish_va_qoshish")}
            loading={createStudent.isPending}
            disabled={!canCreate}
            onPress={() => void createAndEnroll()}
          />
          <Button title={t("groupworkspace.qidiruvga_qaytish")} variant="ghost" onPress={() => setCreating(false)} />
        </>
      ) : (
        <>
          <Input
            label={t("groupworkspace.qidiruv")}
            placeholder={t("groupworkspace.ism_yoki_login_kamida_2_belgi")}
            icon={<Search size={18} color={palette["muted-foreground"]} />}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />

          {results.isLoading && query.trim().length >= 2 ? (
            <ScreenLoading label={t("groupworkspace.qidirilmoqda")} />
          ) : null}

          {query.trim().length >= 2 && (results.data ?? []).length === 0 && !results.isLoading ? (
            <Text variant="caption" tone="muted">
              {t("groupworkspace.hech_kim_topilmadi")}
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
                    title={t("groupworkspace.qoshish")}
                    fullWidth={false}
                    /*
                     * Kutish belgisi FAQAT bosilgan qatorda.
                     *
                     * `enroll.isPending` bitta mutatsiyaga tegishli, qatorga
                     * emas — u yolg'iz ishlatilganda ro'yxatdagi HAMMA tugma
                     * bir vaqtda aylanardi va qaysi o'quvchi qo'shilayotgani
                     * ko'rinmasdi. Veb ham `variables` bilan solishtiradi
                     * (`add-student-dialog.tsx:74`).
                     */
                    loading={enroll.isPending && enroll.variables?.studentId === student.id}
                    onPress={() => enroll.mutate({ courseId, studentId: student.id })}
                  />
                )}
              </View>
            </View>
          ))}

          <Button
            title={t("groupworkspace.yangi_oquvchi_hisobi_yaratish")}
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
