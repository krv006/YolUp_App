import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { useCourseRequests, useRespondCourseRequest } from "@/modules/course";
import type { Conversation } from "@/shared/types";
import {
  Avatar,
  Button,
  Input,
  radius,
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
  const { palette } = useTheme();
  const router = useRouter();
  const client = useQueryClient();

  const [form, setForm] = useState({ name: "", subject: "", description: "" });

  const requests = useCourseRequests({ page_size: 20 }, open);
  const respond = useRespondCourseRequest();

  const create = useMutation({
    mutationFn: (draft: typeof form) => conversationApi.createGroup(draft),
    onSuccess: (room: Conversation) => {
      client.invalidateQueries({ queryKey: conversationKeys.all });
      setForm({ name: "", subject: "", description: "" });
      onClose();
      router.push(`/teacher/chats/${room.id}`);
      toast.success("Kurs va guruh chat yaratildi");
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
      title="Yangi kurs va guruh"
      description="Kurs yaratilganda backend uning guruh chatini avtomatik ochadi."
    >
      {pending.length > 0 ? (
        <>
          <Text variant="caption" tone="muted">
            KUTILAYOTGAN YOZILISHLAR
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
                  title="Rad"
                  variant="secondary"
                  fullWidth={false}
                  loading={respond.isPending}
                  onPress={() => respond.mutate({ enrollmentId: request.id, action: "decline" })}
                />
                <Button
                  title="Qabul"
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
            Yangi o'quv maydoni
          </Text>
          <Text variant="caption" tone="muted">
            Chat, darslar, vazifalar va o'quvchilar bitta kursda.
          </Text>
        </View>
      </View>

      <Input
        label="Kurs nomi"
        placeholder="Masalan: Ingliz tili — Intermediate"
        value={form.name}
        onChangeText={(value) => update("name", value)}
      />
      <Input
        label="Fan"
        placeholder="Masalan: Ingliz tili"
        value={form.subject}
        onChangeText={(value) => update("subject", value)}
      />
      <Input
        label="Qisqa tavsif"
        placeholder="Kurs maqsadi va yo'nalishi…"
        value={form.description}
        onChangeText={(value) => update("description", value)}
        multiline
      />

      <Button
        title="Kurs yaratish"
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
