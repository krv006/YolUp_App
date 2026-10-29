import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/modules/auth";
import {
  useCourse,
  useCourseRequests,
  useCourseStudentPresence,
  useCourseStudents,
  useDeleteCourse,
  useSubjects,
  useUnenrollStudent,
  useUpdateCourse,
  useUpdateCourseAvatar,
} from "@/modules/course";
import { AddStudentSheet } from "@/modules/course/ui/add-student-sheet";
import { JoinRequestsSheet } from "@/modules/course/ui/join-requests-sheet";
// Barrel emas: `message/index` -> `use-chat` -> `conversation/index` aylanma importi bo'lardi.
import { messageApi } from "@/modules/message/api/message.api";
import { useChatUiStore } from "@/modules/message/model/chat-ui.store";
import { messageKeys } from "@/modules/message/model/message.keys";
import { RoomAttachments } from "@/modules/message/ui/room-attachments";
import { ROUTES } from "@/shared/config";
import { formatRelativeShort, pickImage, storage, toUploadFile } from "@/shared/lib";
import type { Conversation, DomainUser } from "@/shared/types";
import {
  Avatar,
  ConfirmDialog,
  DsGradient,
  DsText,
  dsRadius,
  GroupTile,
  Icon,
  MobileButton,
  MobileEmptyCard,
  MobileFieldLabel,
  MobileInput,
  MobilePickerField,
  MobileRoundButton,
  PopoverMenu,
  PopoverMenuItem,
  Sheet,
  Switch,
  toast,
  useDs,
  usePopoverAnchor,
  type IconName,
} from "@/shared/ui";
import { DIRECT_STATUS } from "../constants/direct-status";
import { useAnnouncementMode, useConversations, useRequestDirect, useSetRoomImage } from "../model/use-conversations";

export interface GroupInfoScreenProps {
  conversation: Conversation;
  open: boolean;
  onClose: () => void;
}

type Tab = "members" | "files" | "media";

/**
 * Guruh ma'lumotlari — veb `mobile-group-info.tsx` (`variant="screen"`) va
 * uni boshqaradigan `conversation-info-panel.tsx` qismi: to'liq ekran,
 * guruh rasmi (o'qituvchi almashtiradi), 4 ta tezkor amal (ovozsiz, qidirish,
 * taklif, qadalgan), e'lon rejimi va qo'shilish so'rovlari, a'zolar /
 * fayllar / media tablari, kursni tahrirlash va o'chirish.
 */
export function GroupInfoScreen({ conversation, open, onClose }: GroupInfoScreenProps) {
  const { t } = useTranslation("chat");
  const { t: tg } = useTranslation("group");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const courseId = conversation.courseId;
  const canManage = user?.role === "TEACHER";
  const studentViewer = user?.role === "STUDENT";
  const studentRooms = useConversations("student");
  const requestDirect = useRequestDirect();
  const muteKey = `fokus_muted_${conversation.id}`;

  const [muted, setMuted] = useState(() => storage.get(muteKey) === "true");
  const [tab, setTab] = useState<Tab>("members");
  const [addOpen, setAddOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<DomainUser | null>(null);

  const course = useCourse(open ? courseId : null);
  const students = useCourseStudents(courseId, { page_size: 100 }, open && canManage);
  const presence = useCourseStudentPresence(courseId, open && canManage);
  const joinRequests = useCourseRequests({ page_size: 50 }, open && canManage);
  const unenroll = useUnenrollStudent();
  const announcementMode = useAnnouncementMode();
  const setRoomImage = useSetRoomImage();
  const updateCourseAvatar = useUpdateCourseAvatar();
  const openChatSearch = useChatUiStore((state) => state.setSearchOpen);
  const pinned = useQuery({
    queryKey: messageKeys.pinned(conversation.id),
    queryFn: ({ signal }) => messageApi.getPinned(conversation.id, { signal }),
    enabled: open,
  });
  const roomMembers = useQuery({
    queryKey: messageKeys.members(conversation.id, ""),
    queryFn: ({ signal }) => messageApi.getMembers(conversation.id, "", { signal }),
    enabled: open && !canManage,
  });

  const presenceById = useMemo(() => new Map((presence.data ?? []).map((item) => [item.id, item])), [presence.data]);
  const members = (students.data?.items ?? []).map((item) => item.student);
  /** Veb #162: o'quvchi guruh ma'lumotidan o'qituvchiga yozadi (o'quvchilarga emas). */
  function messageTeacher(teacherId: string) {
    const existing = (studentRooms.data ?? []).find((item) => item.type === "direct" && item.participantId === teacherId);
    const openRoom = (roomId: string) => {
      onClose();
      router.push(ROUTES.student.chat(roomId) as never);
    };
    if (existing?.directStatus === DIRECT_STATUS.ACTIVE) {
      openRoom(existing.id);
      return;
    }
    requestDirect.mutate(teacherId, {
      onSuccess: (room) => {
        if (room.directStatus === DIRECT_STATUS.ACTIVE) openRoom(room.id);
        else toast.success(t("panel.directRequestSent"));
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  const roomList = roomMembers.data ?? [];
  const roomTeachers = roomList.filter((member) => member.role.toLowerCase() === "teacher");
  const roomStudents = roomList.filter((member) => member.role.toLowerCase() !== "teacher");
  const requestsCount = (joinRequests.data?.items ?? []).filter((item) => item.courseId === courseId).length;
  const memberCount = students.data?.total ?? conversation.memberCount ?? (canManage ? members.length : roomStudents.length);
  const meta = [
    canManage ? course.data?.subjectLabel : course.data?.teacher,
    t("info.memberCount", { count: memberCount }),
    conversation.onlineCount ? t("info.onlineCount", { count: conversation.onlineCount }) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    storage.set(muteKey, next);
    toast.success(next ? t("info.mutedOn") : t("info.mutedOff"));
  }

  function togglePinned() {
    const current = (pinned.data ?? [])[0];
    if (!current) {
      toast.info(t("info.pinHint"));
      return;
    }
    void messageApi.unpin(conversation.id, current.messageId).then((items) => queryClient.setQueryData(messageKeys.pinned(conversation.id), items));
  }

  async function changeImage() {
    const picked = await pickImage("library");
    if (!picked) return;
    const file = toUploadFile(picked);
    const done = {
      onSuccess: () => toast.success(t("info.groupImageUpdated")),
      onError: (error: Error) => toast.error(error.message),
    };
    if (courseId) updateCourseAvatar.mutate({ id: courseId, file }, done);
    else setRoomImage.mutate({ roomId: conversation.id, image: file }, done);
  }

  const actions: Array<{ id: string; icon: IconName; label: string; run: () => void }> = [
    { id: "mute", icon: "notifications-off-fill", label: muted ? t("info.muteOn") : t("info.muteOff"), run: toggleMute },
    {
      id: "search",
      icon: "search",
      label: t("info.search"),
      run: () => {
        onClose();
        openChatSearch(true);
      },
    },
    ...(canManage ? [{ id: "invite", icon: "person" as IconName, label: t("info.invite"), run: () => setAddOpen(true) }] : []),
    { id: "pinned", icon: "pin", label: t("info.pinned"), run: togglePinned },
  ];

  const imagePending = setRoomImage.isPending || updateCourseAvatar.isPending;

  return (
    <Modal visible={open} animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
        <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
          <DsGradient name="auth" />
          <View style={styles.header}>
            <MobileRoundButton icon="chevron-left" label={t("info.backAria")} onPress={onClose} />
            <DsText v="title-lg" w="600" numberOfLines={1} style={styles.headerTitle}>
              {t("info.panelTitle")}
            </DsText>
            {canManage ? <MobileRoundButton icon="edit" label={t("info.editCourse")} onPress={() => setEditOpen(true)} /> : <View style={styles.spacer} />}
          </View>

          <View style={styles.hero}>
            <View>
              <GroupTile name={conversation.title} tone={conversation.avatarTone} src={conversation.imageUrl} box={88} radius={dsRadius["2xl"]} />
              {canManage ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("info.changeGroupImageAria")}
                  disabled={imagePending}
                  onPress={() => void changeImage()}
                  style={[styles.camera, { backgroundColor: ds.c.brand, opacity: imagePending ? 0.6 : 1 }]}
                >
                  <Icon name="photo-camera-fill" size={20} color={ds.c["on-action"]} />
                </Pressable>
              ) : null}
            </View>
            <DsText v="h2" heading style={styles.title}>
              {conversation.title}
            </DsText>
            <DsText v="body-sm" c="ink-secondary" style={styles.meta}>
              {meta}
            </DsText>
          </View>

          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.id}
                accessibilityRole="button"
                onPress={action.run}
                style={({ pressed }) => [styles.action, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
              >
                <Icon name={action.icon} size={20} color={ds.c.brand} />
                <DsText v="caption" numberOfLines={1}>
                  {action.label}
                </DsText>
              </Pressable>
            ))}
          </View>

          {canManage ? (
            <View style={[styles.card, styles.block, { backgroundColor: ds.c.surface }]}>
              <View style={[styles.manageRow, { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
                <View style={[styles.manageIcon, { backgroundColor: ds.c["accent-saffron-bg"] }]}>
                  <Icon name="bolt-fill" size={20} color={ds.c["accent-saffron-fg"]} />
                </View>
                <View style={styles.grow}>
                  <DsText v="title" numberOfLines={1}>
                    {t("info.announcementTitle")}
                  </DsText>
                  <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                    {t("info.announcementHint")}
                  </DsText>
                </View>
                <Switch
                  size="lg"
                  checked={Boolean(conversation.announcementOnly)}
                  accessibilityLabel={t("info.announcementTitle")}
                  onCheckedChange={(value) =>
                    announcementMode.mutate({ roomId: conversation.id, enabled: value }, { onError: (error: Error) => toast.error(error.message) })
                  }
                />
              </View>
              <Pressable accessibilityRole="button" onPress={() => setRequestsOpen(true)} style={({ pressed }) => [styles.manageRow, pressed && { backgroundColor: ds.c.subtle }]}>
                <View style={[styles.manageIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
                  <Icon name="person" size={20} color={ds.c.ink} />
                </View>
                <View style={styles.grow}>
                  <DsText v="title" numberOfLines={1}>
                    {t("info.joinRequests", { count: requestsCount })}
                  </DsText>
                  <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                    {t("info.joinRequestsHint")}
                  </DsText>
                </View>
                <Icon name="chevron-right" size={20} color={ds.c["ink-secondary"]} />
              </Pressable>
            </View>
          ) : null}

          <View style={[styles.tabs, styles.block]}>
            {(
              [
                ["members", t("info.tabMembers", { count: memberCount })],
                ["files", t("info.tabFiles")],
                ["media", t("info.tabMedia")],
              ] as const
            ).map(([id, label]) => {
              const active = tab === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTab(id)}
                  style={[styles.tab, active ? { backgroundColor: ds.c.brand } : { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: ds.c.surface }]}
                >
                  <DsText v="body-sm" w="500" c={active ? "on-action" : "ink"} numberOfLines={1}>
                    {label}
                  </DsText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.block}>
            {tab === "members" ? (
              <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
                {canManage && user ? (
                  <MemberRow
                    name={user.name}
                    src={user.avatarUrl}
                    subtitle={t("info.teacherBadge")}
                    subtitleBrand
                    last={!members.length}
                  />
                ) : null}
                {canManage
                  ? members.map((member, index) => {
                      const state = presenceById.get(member.id);
                      const status = state?.isOnline ? t("info.online") : state?.lastSeen ? formatRelativeShort(state.lastSeen) : "";
                      return (
                        <MemberRow
                          key={member.id}
                          name={member.name}
                          tone={member.avatarTone}
                          src={state?.avatar}
                          subtitle={`@${member.username}${status ? ` · ${status}` : ""}`}
                          last={index === members.length - 1}
                          menu={{ label: tg("students.removeAria", { name: member.name }), removeLabel: tg("students.remove"), onRemove: () => setRemoveTarget(member) }}
                        />
                      );
                    })
                  : [...roomTeachers, ...roomStudents].map((member, index, list) => {
                      const teacher = member.role.toLowerCase() === "teacher";
                      return (
                        <MemberRow
                          key={member.id}
                          name={member.id === user?.id ? t("info.memberYou", { name: member.name }) : member.name}
                          src={member.avatarUrl}
                          subtitle={
                            teacher
                              ? t("info.teacherBadge")
                              : `@${member.username}${
                                  member.isOnline ? ` · ${t("info.online")}` : member.lastSeenAt ? ` · ${formatRelativeShort(member.lastSeenAt)}` : ""
                                }`
                          }
                          subtitleBrand={teacher}
                          last={index === list.length - 1}
                          action={
                            teacher && studentViewer && member.id !== user?.id
                              ? { label: t("info.messageTeacher"), disabled: requestDirect.isPending, onPress: () => messageTeacher(member.id) }
                              : undefined
                          }
                        />
                      );
                    })}
              </View>
            ) : (
              <RoomAttachments
                roomId={conversation.id}
                type={tab === "files" ? "file" : "media"}
                empty={
                  <MobileEmptyCard
                    icon={tab === "files" ? "folder" : "photo-camera-fill"}
                    title={tab === "files" ? t("info.filesEmpty") : t("info.mediaEmpty")}
                    description={tab === "files" ? t("info.filesEmptyHint") : t("info.mediaEmptyHint")}
                  />
                }
              />
            )}
          </View>

          {canManage ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setDeleteOpen(true)}
              style={({ pressed }) => [styles.delete, { backgroundColor: ds.c["danger-bg"], opacity: pressed ? 0.85 : 1 }]}
            >
              <Icon name="trash" size={18} color={ds.c["error-text"]} />
              <DsText v="button" c="error-text">
                {t("info.deleteCourse")}
              </DsText>
            </Pressable>
          ) : null}
        </ScrollView>

        {canManage ? (
          <>
            <AddStudentSheet courseId={courseId} open={addOpen} onClose={() => setAddOpen(false)} />
            <JoinRequestsSheet courseId={courseId} open={requestsOpen} onClose={() => setRequestsOpen(false)} />
            <EditCourseSheet conversation={conversation} open={editOpen} onClose={() => setEditOpen(false)} />
            <DeleteCourseSheet
              conversation={conversation}
              open={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              onDeleted={() => {
                onClose();
                router.replace("/teacher/chats" as never);
              }}
            />
            <ConfirmDialog
              open={Boolean(removeTarget)}
              onOpenChange={(next) => !next && setRemoveTarget(null)}
              icon="person"
              title={tg("students.removeConfirmTitle", { name: removeTarget?.name ?? "" })}
              description={tg("students.removeDialogDescription", { name: removeTarget?.name ?? "" })}
              confirmLabel={tg("students.remove")}
              cancelLabel={tg("students.cancel")}
              pending={unenroll.isPending}
              onConfirm={() => {
                if (!removeTarget || !courseId) return;
                unenroll.mutate(
                  { courseId, studentId: removeTarget.id },
                  { onSuccess: () => setRemoveTarget(null), onError: (error: Error) => toast.error(error.message) }
                );
              }}
            />
          </>
        ) : null}
      </View>
    </Modal>
  );
}

/** A'zo qatori — `gap-3 border-b px-4 py-3.5`, 44px avatar, o'qituvchida ixtiyoriy "⋮". */
function MemberRow({
  name,
  tone,
  src,
  subtitle,
  subtitleBrand = false,
  last,
  menu,
  action,
}: {
  name: string;
  tone?: string;
  src?: string | null;
  subtitle: string;
  subtitleBrand?: boolean;
  last: boolean;
  menu?: { label: string; removeLabel: string; onRemove: () => void };
  /** `h-9 rounded-full bg-brand-subtle px-3` — masalan "O'qituvchiga yozish". */
  action?: { label: string; disabled?: boolean; onPress: () => void };
}) {
  const ds = useDs();
  const { anchorRef, rect, open, close } = usePopoverAnchor();
  return (
    <View style={[styles.member, !last && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
      <Avatar variant="legacy" name={name} tone={tone} src={src} size="sm" box={44} />
      <View style={styles.grow}>
        <DsText v="title" numberOfLines={1}>
          {name}
        </DsText>
        <DsText v="body-sm" c={subtitleBrand ? "brand" : "ink-secondary"} numberOfLines={1}>
          {subtitle}
        </DsText>
      </View>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          disabled={action.disabled}
          onPress={action.onPress}
          style={({ pressed }) => [styles.memberAction, { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }, action.disabled && styles.dim]}
        >
          <Icon name="chat" size={16} color={ds.c.brand} />
          <DsText v="caption-strong" c="brand">
            {action.label}
          </DsText>
        </Pressable>
      ) : null}
      {menu ? (
        <View ref={anchorRef} collapsable={false}>
          <Pressable accessibilityRole="button" accessibilityLabel={menu.label} onPress={open} style={styles.more}>
            <Icon name="more" size={20} color={ds.c["ink-secondary"]} />
          </Pressable>
          <PopoverMenu rect={rect} onClose={close} height={56}>
            <PopoverMenuItem
              danger
              label={menu.removeLabel}
              onPress={() => {
                close();
                menu.onRemove();
              }}
            />
          </PopoverMenu>
        </View>
      ) : null}
    </View>
  );
}

/** Kursni tahrirlash — `conversation-info-panel.tsx` dagi `AppDialog` (pastki oyna). */
function EditCourseSheet({ conversation, open, onClose }: { conversation: Conversation; open: boolean; onClose: () => void }) {
  const { t } = useTranslation("chat");
  const subjects = useSubjects(open);
  const updateCourse = useUpdateCourse();
  const [form, setForm] = useState({ title: "", subject: "", description: "" });
  const [shown, setShown] = useState(false);

  if (open !== shown) {
    setShown(open);
    if (open) setForm({ title: conversation.title || "", subject: conversation.subject || "", description: conversation.description || "" });
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={onClose}
      title={t("info.editCourseTitle")}
      description={t("info.editCourseDescription")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("info.cancel")} onPress={onClose} />
          <MobileButton
            label={t("info.save")}
            disabled={updateCourse.isPending || !form.title.trim()}
            onPress={() =>
              updateCourse.mutate(
                { id: conversation.courseId as string, form },
                { onSuccess: onClose, onError: (error: Error) => toast.error(error.message) }
              )
            }
          />
        </>
      }
    >
      <MobileFieldLabel label={t("info.courseName")}>
        <MobileInput value={form.title} onChangeText={(title) => setForm((current) => ({ ...current, title }))} />
      </MobileFieldLabel>
      <MobileFieldLabel label={t("info.subject")}>
        <MobilePickerField
          type="select"
          value={form.subject}
          display={(subjects.data ?? []).find((item) => item.value === form.subject)?.label ?? "—"}
          options={(subjects.data ?? []).map((item) => ({ value: item.value, label: item.label }))}
          ariaLabel={t("info.subject")}
          onChange={(subject) => setForm((current) => ({ ...current, subject }))}
        />
      </MobileFieldLabel>
      <MobileFieldLabel label={t("info.descriptionShort")}>
        <MobileInput multiline value={form.description} onChangeText={(description) => setForm((current) => ({ ...current, description }))} />
      </MobileFieldLabel>
    </Sheet>
  );
}

/** Kursni o'chirish — nomini yozib tasdiqlash (`conversation-info-panel.tsx`). */
function DeleteCourseSheet({
  conversation,
  open,
  onClose,
  onDeleted,
}: {
  conversation: Conversation;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const deleteCourse = useDeleteCourse();
  const [confirmation, setConfirmation] = useState("");

  function close() {
    setConfirmation("");
    onClose();
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t("info.deleteCourseConfirmTitle", { title: conversation.title })}
      footer={
        <>
          <MobileButton variant="secondary" label={t("info.cancel")} onPress={close} />
          <MobileButton
            variant="danger"
            label={t("info.deleteConfirm")}
            disabled={deleteCourse.isPending || confirmation.trim() !== (conversation.title ?? "").trim()}
            onPress={() =>
              deleteCourse.mutate(conversation.courseId as string, {
                onSuccess: () => {
                  close();
                  onDeleted();
                },
                onError: (error: Error) => toast.error(error.message),
              })
            }
          />
        </>
      }
    >
      <View style={[styles.warning, { backgroundColor: ds.c["danger-bg"] }]}>
        <Icon name="warning" size={18} color={ds.c["error-text"]} />
        <DsText v="body-sm" c="error-text" style={styles.grow}>
          {t("info.deleteCourseWarning")}
        </DsText>
      </View>
      <MobileFieldLabel label={t("info.deleteTypeName")}>
        <MobileInput value={confirmation} onChangeText={setConfirmation} placeholder={conversation.title} autoComplete="off" autoCorrect={false} />
      </MobileFieldLabel>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  /* `px-4 pt-5 pb-8` */
  page: { paddingHorizontal: 16 },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { flex: 1, minWidth: 0, textAlign: "center" },
  spacer: { width: 44, height: 44 },
  hero: { marginTop: 16, alignItems: "center" },
  camera: { position: "absolute", right: -10, bottom: -10, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  title: { marginTop: 12, textAlign: "center" },
  meta: { marginTop: 4, textAlign: "center" },
  /* `mt-4 grid grid-cols-4 gap-2` */
  actions: { marginTop: 16, flexDirection: "row", gap: 8 },
  action: { flex: 1, minWidth: 0, height: 66, alignItems: "center", justifyContent: "center", gap: 6, borderRadius: dsRadius.xl },
  block: { marginTop: 16 },
  card: { overflow: "hidden", borderRadius: dsRadius.xl },
  manageRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  manageIcon: { width: 40, height: 40, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row", gap: 8 },
  tab: { flex: 1, minWidth: 0, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  member: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  dim: { opacity: 0.6 },
  memberAction: { height: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12, borderRadius: dsRadius.full },
  more: { width: 36, height: 36, marginRight: -8, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  delete: { marginTop: 24, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 26 },
  warning: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: dsRadius.xl },
});
