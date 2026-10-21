import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Link2, Search } from "lucide-react-native";
import { useCourseStudentPresence, useCourseStudents } from "@/modules/course";
import { env, ROUTES } from "@/shared/config";
import { Avatar, radius, Sheet, SheetButton, SheetFooter, Text, toast, useTheme } from "@/shared/ui";
import { useInviteToLesson } from "../model/live.queries";

export interface LessonInviteSheetProps {
  lessonId: string;
  courseId: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Darsga taklif qilish — veb `modules/live/ui/lesson-invite-dialog.tsx`.
 *
 * Vebda chetlashtirish tugmasi faqat sichqoncha ustida chiqadi (telefonda
 * ko'rinmaydi) — bu yerda ham yo'q; u ishtirokchilar ro'yxatida bor.
 * "Havolani nusxalash" vebdagi dars manzilini beradi (veb shu domenda).
 */
export function LessonInviteSheet({ lessonId, courseId, open, onClose }: LessonInviteSheetProps) {
  const { t } = useTranslation("live");
  const { palette } = useTheme();
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

  return (
    <Sheet
      open={open}
      onClose={() => {
        setSearch("");
        onClose();
      }}
      title={t("invite.title")}
      description={t("invite.description", { count: visible.length })}
    >
      <View style={styles.body}>
        <View
          style={[
            styles.search,
            { borderColor: focused ? palette.primary : palette.border, backgroundColor: palette.surface },
          ]}
        >
          <Search size={18} color={palette["subtle-foreground"]} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t("invite.searchPlaceholder")}
            placeholderTextColor={palette["subtle-foreground"]}
            style={[styles.input, { color: palette.foreground }]}
          />
        </View>

        {students.isLoading ? (
          <View style={styles.list}>
            {Array.from({ length: 3 }, (_, index) => (
              <View key={index} style={[styles.skeleton, { backgroundColor: palette.muted }]} />
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {visible.map((student) => {
              const called = invited.includes(student.id);
              const isOnline = online.get(student.id)?.isOnline === true;
              return (
                <View key={student.id} style={styles.row}>
                  <View>
                    <Avatar variant="legacy" name={student.name} tone={student.avatarTone} size="sm" />
                    {isOnline ? (
                      <View style={[styles.onlineDot, { borderColor: palette.surface, backgroundColor: palette.success }]} />
                    ) : null}
                  </View>
                  <View style={styles.grow}>
                    <Text variant="label" numberOfLines={1}>
                      {student.name}
                    </Text>
                    <Text variant="caption" numberOfLines={1} style={[styles.caption, { color: palette["subtle-foreground"] }]}>
                      {called ? t("invite.calledJustNow") : isOnline ? t("invite.online") : `@${student.username}`}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    disabled={invite.isPending || called}
                    onPress={() =>
                      invite.mutate(student.id, { onSuccess: () => setInvited((current) => [...current, student.id]) })
                    }
                    style={[
                      styles.call,
                      called
                        ? { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface }
                        : { backgroundColor: palette.primary },
                      (invite.isPending || called) && styles.dim,
                    ]}
                  >
                    <Text variant="label" style={{ color: called ? palette["subtle-foreground"] : palette["primary-foreground"] }}>
                      {called ? t("invite.called") : t("invite.invite")}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
            {!visible.length ? (
              <Text variant="label" style={[styles.empty, { color: palette["subtle-foreground"] }]}>
                {t("invite.empty")}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      <SheetFooter>
        <SheetButton
          title={t("invite.copyLink")}
          icon={<Link2 size={16} color={palette.foreground} />}
          onPress={() => void copyLink()}
        />
        <SheetButton
          variant="primary"
          title={t("invite.sendToAll")}
          disabled={invite.isPending}
          onPress={() =>
            invite.mutate(undefined, {
              onSuccess: () => {
                setInvited(visible.map((student) => student.id));
                toast.success(t("invite.sentToAll"));
              },
            })
          }
        />
      </SheetFooter>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  caption: { fontWeight: "500" },
  dim: { opacity: 0.6 },
  body: { gap: 12 },
  /* `h-12 rounded-xl border px-3.5 gap-2.5` */
  search: { height: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderWidth: 1, borderRadius: radius.xl },
  input: { flex: 1, height: "100%", fontSize: 16, fontFamily: "Onest-Regular" },
  list: { gap: 4 },
  skeleton: { height: 56, borderRadius: radius.xl },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8, borderRadius: radius.xl },
  /* `absolute right-0 bottom-0 size-3 border-2 bg-success` */
  onlineDot: { position: "absolute", right: 0, bottom: 0, width: 12, height: 12, borderWidth: 2, borderRadius: radius.full },
  call: { height: 36, justifyContent: "center", paddingHorizontal: 16, borderRadius: radius.full },
  empty: { paddingVertical: 16, textAlign: "center", fontWeight: "400" },
});
