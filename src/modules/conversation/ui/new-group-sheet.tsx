import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { useCourseRequests, useRespondCourseRequest, useSubjects } from "@/modules/course";
import type { Conversation } from "@/shared/types";
import {
  Avatar,
  Button,
  Input,
  radius,
  SelectField,
  Separator,
  Sheet,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";
import { conversationApi } from "../api/conversation.api";
import { conversationKeys } from "../model/conversation.keys";

export interface NewGroupSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Yangi kurs va guruh chat — veb `new-conversation-dialog.tsx` ning mobil
 * varianti. Faqat o'qituvchida.
 *
 * Ikki vazifa bir oynada (veb'dagi kabi):
 *   1) kutilayotgan YOZILISH so'rovlarini qabul qilish/rad etish
 *   2) yangi kurs yaratish — backend uning guruh chatini avtomatik ochadi
 */
export function NewGroupSheet({ open, onClose }: NewGroupSheetProps) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const router = useRouter();
  const client = useQueryClient();

  const [form, setForm] = useState({ name: "", subject: "", description: "" });
  // Ro'yxat faqat oyna ochiq bo'lganda so'raladi (yarim soat keshlanadi).
  const subjects = useSubjects(open);
  const subjectOptions = (subjects.data ?? []).map((item) => ({
    value: item.value,
    label: item.label,
  }));

  const requests = useCourseRequests({ page_size: 20 }, open);
  const respond = useRespondCourseRequest();

  const create = useMutation({
    mutationFn: (draft: typeof form) => conversationApi.createGroup(draft),
    onSuccess: (room: Conversation) => {
      client.invalidateQueries({ queryKey: conversationKeys.all });
      setForm({ name: "", subject: "", description: "" });
      onClose();
      router.push(`/teacher/chats/${room.id}`);
      toast.success(t("conversation.kurs_va_guruh_chat_yaratildi"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const pending = requests.data?.items ?? [];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("conversation.yangi_kurs_va_guruh")}
      description={t("conversation.kurs_yaratilganda_backend_uning_guruh_chatin")}
    >
      {pending.length > 0 ? (
        <>
          <Text variant="caption" tone="muted">
            {t("conversation.kutilayotgan_yozilishlar")}
          </Text>
          {pending.map((request, index) => (
            <View key={request.id}>
              {index > 0 ? <Separator /> : null}
              <View style={styles.request}>
                <Avatar name={request.student.name} tone={request.student.avatarTone} size="md" />
                <View style={styles.requestBody}>
                  <Text variant="label" numberOfLines={1}>
                    {request.student.name}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {request.courseTitle} · @{request.student.username}
                  </Text>
                </View>
                <Button
                  title={t("conversation.rad")}
                  variant="secondary"
                  fullWidth={false}
                  loading={respond.isPending}
                  onPress={() => respond.mutate({ enrollmentId: request.id, action: "decline" })}
                />
                <Button
                  title={t("conversation.qabul")}
                  fullWidth={false}
                  loading={respond.isPending}
                  onPress={() => respond.mutate({ enrollmentId: request.id, action: "approve" })}
                />
              </View>
            </View>
          ))}
          <Separator />
        </>
      ) : null}

      <View style={[styles.note, { backgroundColor: palette["primary-tint"] }]}>
        <Sparkles size={17} color={palette["primary-text"]} />
        <View style={styles.noteBody}>
          <Text variant="label" tone="brand">
            {t("conversation.yangi_oquv_maydoni")}
          </Text>
          <Text variant="caption" tone="muted">
            {t("conversation.chat_darslar_vazifalar_va_oquvchilar_bitta_k")}
          </Text>
        </View>
      </View>

      <Input
        label={t("conversation.kurs_nomi")}
        placeholder={t("conversation.masalan_ingliz_tili_intermediate")}
        value={form.name}
        onChangeText={(value) => update("name", value)}
      />
      {/*
        * Fan ERKIN MATN emas, ro'yxatdan tanlanadi.
        *
        * Sabab: backend fanni kalit sifatida saqlaydi va hisobotlarni shunga
        * qarab guruhlaydi. Erkin matnda "Ingliz tili", "ingliz tili" va
        * "Ingliz Tili" uch xil fan bo'lib ketardi. Ro'yxat uzun bo'lgani
        * uchun `SelectField` qidiruvni o'zi ochadi.
        */}
      <SelectField
        label={t("conversation.fan")}
        placeholder={t("conversation.fanni_tanlang")}
        value={form.subject}
        options={subjectOptions}
        onChange={(value) => update("subject", value)}
      />
      <Input
        label={t("conversation.qisqa_tavsif")}
        placeholder={t("conversation.kurs_maqsadi_va_yonalishi")}
        value={form.description}
        onChangeText={(value) => update("description", value)}
        multiline
      />

      <Button
        title={t("conversation.kurs_yaratish")}
        size="lg"
        loading={create.isPending}
        disabled={!form.name.trim() || !form.subject.trim()}
        onPress={() => create.mutate(form)}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  request: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  requestBody: { flex: 1, gap: 2 },
  note: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.sm },
  noteBody: { flex: 1, gap: 2 },
});
