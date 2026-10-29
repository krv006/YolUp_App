import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useCourseStudentPresence, useCourseStudents } from "@/modules/course";
import { env, ROUTES } from "@/shared/config";
import { formatRelativeShort } from "@/shared/lib";
import { Avatar, bodyFont, DsText, dsRadius, dsType, Icon, Sheet, toast, useDs } from "@/shared/ui";
import { useInviteToLesson } from "../model/live.queries";

export interface LessonInviteSheetProps {
  lessonId: string;
  courseId: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Darsga taklif qilish — veb `lesson-invite-dialog.tsx` ning tor ekran
 * varianti: sarlavha yonida belgi, qidiruv, o'quvchilar (holati bilan) va
 * har biriga "Taklif"; pastda "Havolani nusxalash" va "Hammaga yuborish".
 *
 * "Havolani nusxalash" vebdagi dars manzilini beradi (veb shu domenda).
 */
export function LessonInviteSheet({ lessonId, courseId, open, onClose }: LessonInviteSheetProps) {
  const { t } = useTranslation("live");
  const ds = useDs();
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [invited, setInvited] = useState<string[]>([]);
  const students = useCourseStudents(courseId, { page_size: 100 }, open);
  const presence = useCourseStudentPresence(courseId, open);
  const invite = useInviteToLesson(lessonId);

  const online = useMemo(() => new Map((presence.data ?? []).map((row) => [row.id, row])), [presence.data]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = (students.data?.items ?? []).map((item) => item.student);
    if (!query) return items;
    return items.filter((student) => `${student.name} ${student.username}`.toLowerCase().includes(query));
  }, [students.data, search]);

  async function copyLink() {
    try {
      await Clipboard.setStringAsync(`${env.apiUrl}${ROUTES.live(lessonId)}`);
      toast.success(t("invite.linkCopied"));
    } catch {
      toast.error(t("invite.linkCopyFailed"));
    }
  }

  function inviteAll() {
    invite.mutate(undefined, {
      onSuccess: () => {
        setInvited(visible.map((student) => student.id));
        toast.success(t("invite.sentToAll"));
      },
    });
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => {
        setSearch("");
        onClose();
      }}
      icon={
        // `size-11 rounded-md bg-brand-subtle`
        <View style={[styles.icon, { backgroundColor: ds.c["brand-subtle"] }]}>
          <Icon name="person-add" size={22} color={ds.c.brand} />
        </View>
      }
      headingTitle
      title={t("invite.title")}
      description={t("invite.description", { count: visible.length })}
      footerPadding={{ top: 16, bottom: 28 }}
      footer={
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void copyLink()}
            style={({ pressed }) => [styles.footerButton, { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }]}
          >
            <Icon name="link" size={18} color={ds.c.brand} />
            <DsText v="button" c="brand" numberOfLines={1}>
              {t("invite.copyLink")}
            </DsText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={invite.isPending}
            onPress={inviteAll}
            style={({ pressed }) => [
              styles.footerButton,
              { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
              invite.isPending && styles.dim,
            ]}
          >
            <Icon name="notifications-outline" size={18} color={ds.c["on-action"]} />
            <DsText v="button" c="on-action" numberOfLines={1}>
              {t("invite.sendToAll")}
            </DsText>
          </Pressable>
        </View>
      }
    >
      {/* `h-13 rounded-xl border-[1.5px] bg-subtle px-4 gap-2.5` */}
      <View style={[styles.search, { backgroundColor: ds.c.subtle, borderColor: focused ? ds.c.focus : "transparent" }]}>
        <Icon name="search" size={20} color={ds.c["ink-secondary"]} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t("invite.searchPlaceholder")}
          placeholderTextColor={ds.c["ink-secondary"]}
          selectionColor={ds.c.brand}
          style={[styles.input, { color: ds.c.ink }]}
        />
      </View>

      {students.isLoading ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={[styles.skeleton, { backgroundColor: ds.c.muted }]} />
          ))}
        </View>
      ) : (
        <View>
          {visible.map((student) => {
            const called = invited.includes(student.id);
            const state = online.get(student.id);
            const status = state?.isOnline
              ? t("invite.online").toLowerCase()
              : state?.lastSeen
                ? formatRelativeShort(state.lastSeen)
                : t("invite.offline");
            return (
              <View key={student.id} style={styles.row}>
                <Avatar variant="legacy" name={student.name} tone={student.avatarTone} size="sm" box={36} />
                <View style={styles.grow}>
                  <DsText v="title-sm" w="600" numberOfLines={1}>
                    {student.name}
                  </DsText>
                  <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                    @{student.username} · {status}
                  </DsText>
                </View>
                {called ? (
                  <View style={styles.called}>
                    <Icon name="check" size={16} color={ds.c.brand} />
                    <DsText v="button" c="brand">
                      {t("invite.called")}
                    </DsText>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    disabled={invite.isPending}
                    onPress={() => invite.mutate(student.id, { onSuccess: () => setInvited((current) => [...current, student.id]) })}
                    style={({ pressed }) => [styles.call, { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }, invite.isPending && styles.dim]}
                  >
                    <Icon name="notifications-outline" size={16} color={ds.c.brand} />
                    <DsText v="button" c="brand">
                      {t("invite.invite")}
                    </DsText>
                  </Pressable>
                )}
              </View>
            );
          })}
          {!visible.length ? (
            <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
              {t("invite.empty")}
            </DsText>
          ) : null}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  icon: { width: 44, height: 44, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  /* `grid-cols-2 gap-2.5`, tugma `h-11 rounded-full gap-1.5` */
  footer: { flex: 1, flexDirection: "row", gap: 10 },
  footerButton: { flex: 1, minWidth: 0, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 8, borderRadius: dsRadius.full },
  search: { height: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, borderWidth: 1.5, borderRadius: dsRadius.xl },
  input: { flex: 1, minWidth: 0, height: "100%", padding: 0, fontFamily: bodyFont("400"), fontSize: dsType.body.fontSize },
  skeletons: { gap: 8 },
  skeleton: { height: 56, borderRadius: dsRadius.xl },
  /* `py-[13px] gap-3` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  called: { height: 40, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16 },
  call: { height: 40, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, borderRadius: dsRadius.full },
  empty: { paddingVertical: 16, textAlign: "center" },
});
