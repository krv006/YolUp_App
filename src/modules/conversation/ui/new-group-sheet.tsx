import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useCreateInviteLink, useInviteLink, useSubjects } from "@/modules/course";
import type { Conversation } from "@/shared/types";
import {
  DsText,
  dsRadius,
  Icon,
  MobileButton,
  MobileFieldLabel,
  MobileInput,
  MobilePickerField,
  QrCode,
  Sheet,
  Switch,
  toast,
  useDs,
} from "@/shared/ui";
import { conversationApi } from "../api/conversation.api";
import { conversationKeys } from "../model/conversation.keys";

interface GroupDraft {
  name: string;
  subject: string;
  description: string;
  lessonsPerWeek: string;
  fee: string;
}

const INVITE_DAYS = 7;
const EMPTY: GroupDraft = { name: "", subject: "", description: "", lessonsPerWeek: "3", fee: "" };

export interface NewGroupSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Yangi guruh (M6.8) — veb `new-conversation-dialog.tsx` ning tor ekran
 * varianti: nom, fan, qisqa tavsif va haftalik darslar soni (1–7). Guruh
 * yaratilgach "Guruh tayyor!" oynasi: taklif havolasi (avtomatik
 * yaratiladi), QR kod, muddat va "Tasdiqlash bilan" kaliti.
 *
 * Avvalgi mobil oynadagi kutilayotgan qo'shilish so'rovlari bu yerdan
 * olib tashlandi — vebda ular guruh ma'lumotlariga ko'chgan (4-bosqich).
 */
export function NewGroupSheet({ open, onClose }: NewGroupSheetProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const router = useRouter();
  const client = useQueryClient();
  const [group, setGroup] = useState<GroupDraft>(EMPTY);
  const [created, setCreated] = useState<Conversation | null>(null);
  const subjects = useSubjects(open);
  const create = useMutation({
    mutationFn: conversationApi.createGroup.bind(conversationApi),
    onSuccess: (room: Conversation) => {
      client.invalidateQueries({ queryKey: conversationKeys.all });
      setGroup(EMPTY);
      setCreated(room);
    },
  });

  function finish() {
    const room = created;
    setCreated(null);
    onClose();
    if (room) router.push(`/teacher/chats/${room.id}` as never);
  }

  function close() {
    onClose();
    setGroup(EMPTY);
  }

  if (created) return <GroupReadySheet room={created} open={open} onClose={finish} />;

  function update(field: keyof GroupDraft, value: string) {
    setGroup((current) => ({ ...current, [field]: value }));
  }

  function submit() {
    if (!group.name.trim() || !group.subject.trim()) return;
    const fee = Number(group.fee.replace(/\s/g, ""));
    create.mutate({
      name: group.name,
      subject: group.subject,
      description: group.description,
      lessonsPerWeek: group.lessonsPerWeek ? Number(group.lessonsPerWeek) : null,
      monthlyFee: Number.isFinite(fee) && fee > 0 ? fee : null,
    });
  }

  const lessons = Number(group.lessonsPerWeek) || 1;
  const subjectOptions = (subjects.data ?? []).map((item) => ({ value: item.value, label: item.label }));
  const subjectLabel = subjectOptions.find((item) => item.value === group.subject)?.label;

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t("newDialog.title")}
      description={t("newDialog.mobileSubtitle")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("newDialog.cancel")} onPress={close} />
          <MobileButton
            label={t("newDialog.create")}
            disabled={!group.name.trim() || !group.subject.trim() || create.isPending}
            onPress={submit}
          />
        </>
      }
    >
      <View style={styles.form}>
        <MobileFieldLabel label={t("newDialog.courseNameLabel")} gap={6}>
          <MobileInput value={group.name} onChangeText={(value) => update("name", value)} placeholder={t("newDialog.courseNamePlaceholder")} />
        </MobileFieldLabel>

        <MobileFieldLabel label={t("newDialog.subjectLabel")} gap={6}>
          <MobilePickerField
            type="select"
            value={group.subject}
            display={subjectLabel ?? t("newDialog.subjectPlaceholder")}
            placeholder={!subjectLabel}
            options={subjectOptions}
            ariaLabel={t("newDialog.subjectLabel")}
            onChange={(value) => update("subject", value)}
          />
        </MobileFieldLabel>

        <MobileFieldLabel label={t("newDialog.shortDescriptionLabel")} gap={6}>
          <MobileInput
            multiline
            value={group.description}
            onChangeText={(value) => update("description", value)}
            placeholder={t("newDialog.descriptionPlaceholder")}
          />
        </MobileFieldLabel>

        <View style={styles.lessons}>
          <View style={styles.grow}>
            <DsText v="body-sm" w="500">
              {t("newDialog.lessonsPerWeekLabel")}
            </DsText>
            <DsText v="caption" c="ink-secondary">
              {t("newDialog.lessonsHint")}
            </DsText>
          </View>
          {/* `h-13 rounded-full border-4 border-subtle bg-surface` */}
          <View style={[styles.stepper, { borderColor: ds.c.subtle, backgroundColor: ds.c.surface }]}>
            <StepButton
              icon="remove"
              label={t("newDialog.decrease")}
              disabled={lessons <= 1}
              onPress={() => update("lessonsPerWeek", String(Math.max(1, lessons - 1)))}
            />
            <DsText v="title-sm" style={styles.stepValue}>
              {t("newDialog.lessonsPerWeekValue", { count: lessons })}
            </DsText>
            <StepButton
              icon="add"
              label={t("newDialog.increase")}
              disabled={lessons >= 7}
              onPress={() => update("lessonsPerWeek", String(Math.min(7, lessons + 1)))}
            />
          </View>
        </View>

        {create.isError ? (
          <View style={[styles.error, { backgroundColor: ds.c["danger-bg"] }]}>
            <DsText v="body-sm" c="danger">
              {create.error.message}
            </DsText>
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}

function StepButton({ icon, label, disabled, onPress }: { icon: "add" | "remove"; label: string; disabled: boolean; onPress: () => void }) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.step, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.xs }, disabled && styles.dim]}
    >
      <Icon name={icon} size={20} color={ds.c.ink} />
    </Pressable>
  );
}

/**
 * "Guruh tayyor!" (M6.9) — veb `GroupReadyDialog` ning tor ekran varianti.
 * Havola bo'lmasa avtomatik yaratiladi (7 kun, tasdiq bilan); kalit
 * o'zgarsa havola yangi sozlama bilan qayta yaratiladi. "Ulashish" —
 * tizim ulashish oynasi.
 */
function GroupReadySheet({ room, open, onClose }: { room: Conversation; open: boolean; onClose: () => void }) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const courseId = room.courseId ?? null;
  const link = useInviteLink(courseId, open);
  const createLink = useCreateInviteLink();
  const [requireApproval, setRequireApproval] = useState(true);
  const requested = useRef(false);

  const current = link.data ?? null;

  useEffect(() => {
    if (!courseId || link.isLoading || current || requested.current) return;
    requested.current = true;
    createLink.mutate({ courseId, input: { requireApproval, expiresInDays: INVITE_DAYS } });
  }, [courseId, link.isLoading, current, createLink, requireApproval]);

  function toggleApproval(next: boolean) {
    setRequireApproval(next);
    if (courseId) createLink.mutate({ courseId, input: { requireApproval: next, expiresInDays: INVITE_DAYS } });
  }

  async function copy() {
    if (!current?.url) return;
    try {
      await Clipboard.setStringAsync(current.url);
      toast.success(t("newDialog.inviteCopied"));
    } catch {
      toast.error(t("newDialog.inviteCopyFailed"));
    }
  }

  async function share() {
    if (!current?.url) return;
    try {
      await Share.share({ title: room.title, message: current.url });
    } catch {
      return;
    }
    onClose();
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={onClose}
      title={t("newDialog.readyTitle")}
      description={room.title}
      footer={
        <>
          <MobileButton variant="secondary" label={t("newDialog.later")} onPress={onClose} />
          <MobileButton label={t("newDialog.inviteShare")} disabled={!current?.url} onPress={() => void share()} />
        </>
      }
    >
      {/* `-mt-1 h-11 rounded-xl bg-accent-green-bg px-4 gap-2.5` */}
      <View style={[styles.created, { backgroundColor: ds.c["accent-green-bg"] }]}>
        <Icon name="check-circle" size={18} color={ds.c["success-fg"]} />
        <DsText v="body-sm" c="success-fg" numberOfLines={1} style={styles.grow}>
          {t("newDialog.createdToast")}
        </DsText>
      </View>

      <DsText v="title-lg" heading w="500">
        {t("newDialog.inviteTitle")}
      </DsText>

      {/* `rounded-xl bg-subtle p-4 gap-3` */}
      <View style={[styles.invite, { backgroundColor: ds.c.subtle }]}>
        <View style={styles.inviteRow}>
          <Icon name="chat" size={18} color={ds.c.brand} />
          <DsText v="title" numberOfLines={1} style={styles.grow}>
            {current?.url ?? t("newDialog.invitePending")}
          </DsText>
          <Pressable
            accessibilityRole="button"
            disabled={!current?.url}
            onPress={() => void copy()}
            style={({ pressed }) => [
              styles.copy,
              { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] },
              !current?.url && styles.half,
            ]}
          >
            <DsText v="button-sm" c="brand">
              {t("newDialog.inviteCopy")}
            </DsText>
          </Pressable>
        </View>

        <View style={styles.qrRow}>
          {/* `size-22 rounded-xl bg-surface p-5` */}
          <View style={[styles.qr, { backgroundColor: ds.c.surface }]}>
            {current?.url ? <QrCode value={current.url} size={48} /> : <Icon name="qr" size={28} color={ds.c["icon-tertiary"]} />}
          </View>
          <View style={styles.qrText}>
            <DsText v="body-sm" c="ink-secondary">
              {t("newDialog.inviteDescription", { title: room.title })}
            </DsText>
            <View style={[styles.expiry, { backgroundColor: ds.c["accent-teal-bg"] }]}>
              <Icon name="schedule" size={14} color={ds.c["accent-teal-fg"]} />
              <DsText v="caption-strong" c="accent-teal-fg">
                {t("newDialog.inviteExpiry", { count: INVITE_DAYS })}
              </DsText>
            </View>
          </View>
        </View>
      </View>

      {/* `mt-3.5 mb-3 px-4 gap-3` */}
      <View style={styles.approval}>
        <View style={[styles.approvalIcon, { backgroundColor: ds.c["accent-green-bg"] }]}>
          <Icon name="check-circle" size={22} color={ds.c["accent-green-fg"]} />
        </View>
        <View style={styles.grow}>
          <DsText v="title">{t("newDialog.approvalLabel")}</DsText>
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
            {t("newDialog.approvalHint")}
          </DsText>
        </View>
        <Switch size="lg" checked={requireApproval} onCheckedChange={toggleApproval} accessibilityLabel={t("newDialog.approvalLabel")} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.4 },
  half: { opacity: 0.5 },
  /* `-mt-1 gap-4` */
  form: { marginTop: -4, gap: 16 },
  lessons: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepper: { height: 52, flexDirection: "row", alignItems: "center", borderWidth: 4, borderRadius: dsRadius.full },
  step: { width: 44, height: 44, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  /* `w-16 text-center` */
  stepValue: { width: 64, textAlign: "center" },
  error: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.md },
  created: { marginTop: -4, height: 44, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, borderRadius: dsRadius.xl },
  invite: { gap: 12, padding: 16, borderRadius: dsRadius.xl },
  inviteRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  /* `h-9 px-4 rounded-full bg-brand-subtle` */
  copy: { height: 36, justifyContent: "center", paddingHorizontal: 16, borderRadius: dsRadius.full },
  qrRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  qr: { width: 88, height: 88, padding: 20, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  qrText: { flex: 1, minWidth: 0, alignItems: "flex-start", gap: 8 },
  /* `rounded-full px-2.5 py-1 gap-1.5` */
  expiry: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  approval: { marginTop: 14, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  approvalIcon: { width: 40, height: 40, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
});
