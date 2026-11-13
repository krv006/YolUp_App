import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  ChannelAvatar,
  useAddChannelMembers,
  useDeleteChannel,
  useRemoveChannelMember,
  useRemoveRoomImage,
  useSetRoomImage,
  useUpdateChannel,
  type AudienceInput,
} from "@/modules/conversation";
import { messageApi, messageKeys } from "@/modules/message";
import { pickImage, toUploadFile } from "@/shared/lib";
import type { Conversation } from "@/shared/types";
import {
  Avatar,
  ConfirmDialog,
  DsText,
  dsRadius,
  Icon,
  MobileButton,
  MobileInput,
  RoleTag,
  Sheet,
  toast,
  useDs,
} from "@/shared/ui";
import { AudiencePicker } from "@/widgets/audience-picker";

export interface ChannelInfoDialogProps {
  conversation: Conversation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manage: boolean;
  currentUserId: string | null;
  afterDelete: string;
}

/**
 * Kanal ma'lumotlari — veb `channel-info-dialog.tsx` (pastki oyna): rasm
 * (egasi qo'yadi, almashtiradi, olib tashlaydi), nom va tavsifni tahrirlash,
 * ulangan guruhlar, a'zolar (qo'shish, chiqarish) va kanalni o'chirish.
 * Ichki oynalar shu oynaning ichida ochiladi (iOS yonma-yon Modal'ni
 * ko'rsatmaydi).
 */
export function ChannelInfoDialog({ conversation, open, onOpenChange, manage, currentUserId, afterDelete }: ChannelInfoDialogProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [description, setDescription] = useState(conversation.description ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [audience, setAudience] = useState<AudienceInput>({ courseIds: [], studentIds: [] });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const members = useQuery({
    queryKey: messageKeys.members(conversation.id, ""),
    queryFn: ({ signal }) => messageApi.getMembers(conversation.id, "", { signal }),
    enabled: open,
  });
  const update = useUpdateChannel();
  const remove = useDeleteChannel();
  const addMembers = useAddChannelMembers();
  const removeMember = useRemoveChannelMember();
  const setImage = useSetRoomImage();
  const removeImage = useRemoveRoomImage();
  const imageBusy = setImage.isPending || removeImage.isPending;
  const linkedCourses = conversation.linkedCourses ?? [];
  const list = members.data ?? [];

  async function uploadImage() {
    const picked = await pickImage("library");
    if (!picked) return;
    setImage.mutate(
      { roomId: conversation.id, image: toUploadFile(picked) },
      {
        onSuccess: () => toast.success(t("channel.imageUpdated")),
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  function dropImage() {
    removeImage.mutate(conversation.id, {
      onSuccess: () => toast.success(t("channel.imageRemoved")),
      onError: (error: Error) => toast.error(error.message),
    });
  }

  function save() {
    update.mutate(
      { id: conversation.id, title: title.trim(), description: description.trim() },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success(t("channel.saved"));
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  function add() {
    addMembers.mutate(
      { id: conversation.id, audience },
      {
        onSuccess: (count) => {
          toast.success(t("channel.membersAdded", { count }));
          setAudience({ courseIds: [], studentIds: [] });
          setAddOpen(false);
          void members.refetch();
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  return (
    <Sheet variant="app" open={open} onClose={() => onOpenChange(false)} title={t("channel.infoTitle")}>
      <View style={styles.body}>
        <View style={styles.profile}>
          <View>
            <ChannelAvatar src={conversation.imageUrl} size={72} radius={dsRadius["2xl"]} iconSize={32} />
            {manage ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={conversation.imageUrl ? t("channel.changeImage") : t("channel.addImage")}
                disabled={imageBusy}
                onPress={() => void uploadImage()}
                style={[styles.camera, { backgroundColor: ds.c.surface, borderColor: ds.c.line }, imageBusy && styles.dim]}
              >
                {imageBusy ? <ActivityIndicator size="small" color={ds.c.ink} /> : <Icon name="camera" size={16} color={ds.c.ink} />}
              </Pressable>
            ) : null}
          </View>
          {manage && conversation.imageUrl ? (
            <Pressable accessibilityRole="button" disabled={imageBusy} onPress={dropImage} style={styles.removeImage}>
              <DsText v="caption-strong" c="error-text">
                {t("channel.removeImage")}
              </DsText>
            </Pressable>
          ) : null}
          {editing ? (
            <View style={styles.edit}>
              <MobileInput value={title} maxLength={120} accessibilityLabel={t("channel.titleLabel")} onChangeText={setTitle} />
              <MobileInput
                multiline
                multilineHeight={96}
                value={description}
                maxLength={1000}
                accessibilityLabel={t("channel.descriptionLabel")}
                placeholder={t("channel.descriptionPlaceholder")}
                onChangeText={setDescription}
              />
              <View style={styles.row}>
                <MobileButton variant="secondary" label={t("channel.cancel")} onPress={() => setEditing(false)} style={styles.grow} />
                <MobileButton label={t("channel.save")} disabled={!title.trim() || update.isPending} onPress={save} style={styles.grow} />
              </View>
            </View>
          ) : (
            <>
              <DsText v="h3" heading style={styles.center}>
                {conversation.title}
              </DsText>
              <DsText v="body-sm" c="ink-secondary" style={styles.center}>
                {conversation.description || t("channel.noDescription")}
              </DsText>
              <DsText v="caption" c="ink-tertiary">
                {t("channel.members", { count: list.length || conversation.memberCount })}
              </DsText>
              {manage ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setTitle(conversation.title);
                    setDescription(conversation.description ?? "");
                    setEditing(true);
                  }}
                  style={({ pressed }) => [styles.pill, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }]}
                >
                  <Icon name="edit" size={16} color={ds.c.ink} />
                  <DsText v="caption-strong">{t("channel.edit")}</DsText>
                </Pressable>
              ) : null}
            </>
          )}
        </View>

        {linkedCourses.length ? (
          <View style={styles.section}>
            <DsText v="title-sm">{t("channel.linkedGroups")}</DsText>
            <View style={styles.chips}>
              {linkedCourses.map((course) => (
                <View key={course.id} style={[styles.chip, { backgroundColor: ds.c.subtle }]}>
                  <Icon name="groups" size={16} color={ds.c["ink-secondary"]} />
                  <DsText v="caption-strong" numberOfLines={1} style={styles.shrink}>
                    {course.title || t("channel.groupFallback")}
                  </DsText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.row}>
            <DsText v="title-sm" style={styles.grow}>
              {t("channel.membersTitle")}
            </DsText>
            {manage ? (
              <Pressable accessibilityRole="button" onPress={() => setAddOpen(true)} style={[styles.pill, { backgroundColor: ds.c["brand-subtle"] }]}>
                <Icon name="person-add" size={16} color={ds.c.brand} />
                <DsText v="caption-strong" c="brand">
                  {t("channel.addMembers")}
                </DsText>
              </Pressable>
            ) : null}
          </View>
          <View style={[styles.list, { borderColor: ds.c.line }]}>
            {list.map((member, index) => {
              const role = member.role.toLowerCase();
              return (
                <View key={member.id} style={[styles.member, index < list.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
                  <Avatar variant="legacy" name={member.name} src={member.avatarUrl ?? undefined} size="sm" box={36} />
                  <View style={styles.grow}>
                    <DsText v="title-sm" numberOfLines={1}>
                      {member.name}
                    </DsText>
                    <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                      @{member.username}
                    </DsText>
                  </View>
                  <RoleTag role={role} />
                  {manage && member.id !== currentUserId && role !== "teacher" ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("channel.removeMember", { name: member.name })}
                      disabled={removeMember.isPending}
                      onPress={() =>
                        removeMember.mutate(
                          { id: conversation.id, userId: member.id },
                          {
                            onSuccess: () => void members.refetch(),
                            onError: (error: Error) => toast.error(error.message),
                          }
                        )
                      }
                      style={({ pressed }) => [styles.removeMember, pressed && { backgroundColor: ds.c["error-bg"] }, removeMember.isPending && styles.dim]}
                    >
                      <Icon name="close" size={16} color={ds.c["ink-tertiary"]} />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
            {!list.length ? (
              <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
                {members.isLoading ? t("channel.loading") : t("channel.noMembers")}
              </DsText>
            ) : null}
          </View>
        </View>

        {manage ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setDeleteOpen(true)}
            style={({ pressed }) => [styles.delete, { backgroundColor: ds.c["error-bg"] }, pressed && styles.dim]}
          >
            <Icon name="trash" size={18} color={ds.c["error-text"]} />
            <DsText v="label-strong" c="error-text">
              {t("channel.delete")}
            </DsText>
          </Pressable>
        ) : null}
      </View>

      <Sheet
        variant="app"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("channel.addMembers")}
        description={t("channel.addMembersHint")}
        footer={
          <>
            <MobileButton variant="secondary" label={t("channel.cancel")} onPress={() => setAddOpen(false)} />
            <MobileButton
              label={t("channel.add")}
              disabled={(!audience.courseIds.length && !audience.studentIds.length) || addMembers.isPending}
              onPress={add}
            />
          </>
        }
      >
        <AudiencePicker value={audience} onChange={setAudience} />
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        icon="trash"
        title={t("channel.deleteTitle")}
        description={t("channel.deleteHint", { title: conversation.title })}
        confirmLabel={t("channel.delete")}
        cancelLabel={t("channel.cancel")}
        onConfirm={() =>
          remove.mutate(conversation.id, {
            onSuccess: () => {
              setDeleteOpen(false);
              onOpenChange(false);
              router.replace(afterDelete as never);
            },
            onError: (error: Error) => toast.error(error.message),
          })
        }
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, paddingBottom: 16 },
  profile: { alignItems: "center", gap: 8 },
  /* `absolute -right-2 -bottom-2 size-8 rounded-full border bg-surface` */
  camera: { position: "absolute", right: -8, bottom: -8, width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  removeImage: { marginTop: 4 },
  edit: { alignSelf: "stretch", gap: 8 },
  center: { textAlign: "center" },
  /* `h-9 gap-1.5 rounded-full px-4` */
  pill: { height: 36, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, borderRadius: dsRadius.full },
  section: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 32, maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: 16 },
  list: { overflow: "hidden", borderWidth: 1, borderRadius: dsRadius.xl },
  member: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  removeMember: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  empty: { paddingHorizontal: 16, paddingVertical: 16 },
  /* `h-12 rounded-xl bg-error-bg text-label-strong text-error-text` */
  delete: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: dsRadius.xl },
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  dim: { opacity: 0.6 },
});
