import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Bell, BellOff, Camera, Check, Copy, Pencil, Trash2, UserRound } from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { useCourse, useDeleteCourse, useUpdateCourse } from "@/modules/course";
import { pickImage, storage, toUploadFile } from "@/shared/lib";
import type { Conversation } from "@/shared/types";
import {
  Avatar,
  Badge,
  Button,
  Input,
  Separator,
  Sheet,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";
import type { DirectAction } from "../api/conversation.dto";
import { DIRECT_STATUS, directStatusLabel } from "../constants/direct-status";
import { useRespondDirect, useSetRoomImage } from "../model/use-conversations";

export interface ConversationInfoSheetProps {
  conversation: Conversation;
  open: boolean;
  onClose: () => void;
}

/**
 * Suhbat ma'lumoti — veb `conversation-info-panel.tsx` ning mobil varianti.
 *
 * Guruhda: rasm (faqat kurs egasi), tavsif, o'qituvchi, tahrirlash va
 * o'chirish. Shaxsiy suhbatda: username nusxalash va (o'qituvchida)
 * so'rovni qabul qilish yoki bloklash.
 *
 * "Ovozsiz" belgisi MAHALLIY (MMKV) — backend'da bunday sozlama yo'q,
 * veb'da ham u `localStorage` da saqlanadi.
 */
export function ConversationInfoSheet({
  conversation,
  open,
  onClose,
}: ConversationInfoSheetProps) {
  const { palette } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const isGroup = conversation.type === "group";
  const teacherGroup = isGroup && user?.role === "TEACHER";
  const muteKey = `fokus_muted_${conversation.id}`;

  const [muted, setMuted] = useState(() => storage.get(muteKey) === "true");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", description: "" });

  // `null` — panel yopiq: aks holda har chat ochilganda ortiqcha so'rov ketardi.
  const course = useCourse(open ? conversation.courseId : null);
  const respond = useRespondDirect();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const setRoomImage = useSetRoomImage();

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    storage.set(muteKey, next);
    toast.success(next ? "Bildirishnomalar ovozsiz qilindi" : "Bildirishnomalar ovozi yoqildi");
  }

  async function copyUsername() {
    const value = conversation.participant?.username;
    if (!value) return;
    await Clipboard.setStringAsync(`@${value}`);
    setCopied(true);
    toast.success("Username nusxalandi");
    setTimeout(() => setCopied(false), 1400);
  }

  function respondDirect(action: DirectAction) {
    respond.mutate(
      { roomId: conversation.id, action },
      {
        onSuccess: () => {
          toast.success(action === "accept" ? "Suhbat qabul qilindi" : "Suhbat bloklandi");
          onClose();
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  async function changeImage() {
    const picked = await pickImage("library");
    if (!picked) return;
    setRoomImage.mutate(
      { roomId: conversation.id, image: toUploadFile(picked) },
      {
        onSuccess: () => toast.success("Guruh rasmi yangilandi"),
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  function beginEdit() {
    setForm({
      title: conversation.title || "",
      subject: conversation.subject || "",
      description: conversation.description || "",
    });
    setEditing(true);
  }

  function saveCourse() {
    if (!conversation.courseId) return;
    updateCourse.mutate(
      { id: conversation.courseId, form },
      { onSuccess: () => setEditing(false), onError: (error: Error) => toast.error(error.message) }
    );
  }

  function removeCourse() {
    if (!conversation.courseId) return;
    deleteCourse.mutate(conversation.courseId, {
      onSuccess: () => {
        onClose();
        router.replace("/teacher/chats");
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        setEditing(false);
        onClose();
      }}
      title={conversation.title}
      description={isGroup ? conversation.subject || "Kurs guruhi" : "Profil ma'lumotlari"}
    >
      {editing ? (
        <>
          <Input label="Kurs nomi" value={form.title} onChangeText={(value) => setForm((c) => ({ ...c, title: value }))} />
          <Input label="Fan" value={form.subject} onChangeText={(value) => setForm((c) => ({ ...c, subject: value }))} />
          <Input
            label="Tavsif"
            value={form.description}
            onChangeText={(value) => setForm((c) => ({ ...c, description: value }))}
            multiline
          />
          <Button title="Saqlash" loading={updateCourse.isPending} onPress={saveCourse} />
          <Button title="Bekor qilish" variant="ghost" onPress={() => setEditing(false)} />
        </>
      ) : (
        <>
          <View style={styles.profile}>
            <Avatar
              name={conversation.title}
              tone={conversation.avatarTone}
              src={conversation.imageUrl}
              size="xl"
            />
            {/* Guruh rasmini faqat kurs egasi almashtira oladi. */}
            {teacherGroup ? (
              <Button
                title="Rasmni o'zgartirish"
                variant="ghost"
                fullWidth={false}
                loading={setRoomImage.isPending}
                icon={<Camera size={15} color={palette["primary-text"]} />}
                onPress={() => void changeImage()}
              />
            ) : null}
            <Text variant="subheading">{conversation.title}</Text>
            <Text variant="caption" tone="muted">
              {isGroup
                ? `${conversation.memberCount ?? 0} o'quvchi`
                : directStatusLabel(conversation.directStatus, "Shaxsiy suhbat")}
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title={muted ? "Ovozni yoqish" : "Ovozsiz qilish"}
              variant="secondary"
              fullWidth={false}
              icon={
                muted ? (
                  <Bell size={15} color={palette["secondary-foreground"]} />
                ) : (
                  <BellOff size={15} color={palette["secondary-foreground"]} />
                )
              }
              onPress={toggleMute}
              style={styles.action}
            />
            {teacherGroup ? (
              <Button
                title="Tahrirlash"
                variant="secondary"
                fullWidth={false}
                icon={<Pencil size={15} color={palette["secondary-foreground"]} />}
                onPress={beginEdit}
                style={styles.action}
              />
            ) : null}
          </View>

          <Separator />

          {isGroup ? (
            <>
              <Text variant="caption" tone="muted">
                GURUH HAQIDA
              </Text>
              <Text>{conversation.description || "Kurs guruh chati"}</Text>
            </>
          ) : (
            <Button
              title={`@${conversation.participant?.username || "—"}`}
              variant="secondary"
              icon={
                copied ? (
                  <Check size={16} color={palette["success-strong"]} />
                ) : (
                  <Copy size={16} color={palette["secondary-foreground"]} />
                )
              }
              onPress={() => void copyUsername()}
            />
          )}

          {/* O'qituvchi — kurs egasiga o'z ismini ko'rsatishdan ma'no yo'q. */}
          {isGroup && !teacherGroup ? (
            <>
              <Text variant="caption" tone="muted">
                O'QITUVCHI
              </Text>
              {course.data ? (
                <View style={styles.teacher}>
                  <UserRound size={16} color={palette["muted-foreground"]} />
                  <Text variant="label">{course.data.teacher}</Text>
                </View>
              ) : (
                <Text variant="caption" tone="muted">
                  {course.isLoading ? "Yuklanmoqda…" : "Ma'lumot yo'q"}
                </Text>
              )}
            </>
          ) : null}

          {/* Backend DirectStatusEnum: pending | active | blocked. */}
          {!isGroup && user?.role === "TEACHER" && conversation.directStatus === DIRECT_STATUS.PENDING ? (
            <>
              <Badge label="Yangi so'rov" tone="warning" />
              <Button
                title="Suhbatni qabul qilish"
                loading={respond.isPending}
                icon={<Check size={16} color={palette["primary-foreground"]} />}
                onPress={() => respondDirect("accept")}
              />
              <Button
                title="Bloklash"
                variant="danger"
                loading={respond.isPending}
                onPress={() => respondDirect("block")}
              />
            </>
          ) : null}

          {teacherGroup ? (
            <>
              <Separator />
              <Button
                title="Kursni o'chirish"
                variant="danger"
                loading={deleteCourse.isPending}
                icon={<Trash2 size={16} color={palette["destructive-foreground"]} />}
                onPress={removeCourse}
              />
            </>
          ) : null}
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: "center", gap: 8, paddingVertical: 8 },
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1 },
  teacher: { flexDirection: "row", alignItems: "center", gap: 8 },
});
