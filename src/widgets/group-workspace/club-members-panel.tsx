import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useAddClubMembers, useClubMembers, useRemoveClubMember, type ClubAudience } from "@/modules/course";
import { Avatar, DsText, dsRadius, Icon, MobileButton, Sheet, Skeleton, toast, useDs } from "@/shared/ui";
import { AudiencePicker } from "@/widgets/audience-picker";
import { PanelHeading } from "./panel-heading";

const EMPTY: ClubAudience = { courseIds: [], studentIds: [] };

/**
 * Speaking club a'zolari — veb `club-members-panel.tsx`: ro'yxat,
 * a'zoni chiqarish va "Qo'shish" (guruhlar yoki alohida o'quvchilar).
 */
export function ClubMembersPanel({ clubId }: { clubId: string | null }) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const members = useClubMembers(clubId);
  const add = useAddClubMembers();
  const remove = useRemoveClubMember();
  const [addOpen, setAddOpen] = useState(false);
  const [audience, setAudience] = useState<ClubAudience>(EMPTY);
  const list = members.data ?? [];

  function submit() {
    if (!clubId) return;
    add.mutate(
      { id: clubId, audience },
      {
        onSuccess: (count) => {
          toast.success(t("club.added", { count }));
          setAudience(EMPTY);
          setAddOpen(false);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.head}>
        <PanelHeading eyebrow={t("club.eyebrow")} title={t("club.membersTitle", { count: list.length })} />
        <MobileButton icon="person-add" label={t("club.add")} onPress={() => setAddOpen(true)} style={styles.add} />
      </View>

      {/* `rounded-xl bg-surface` */}
      <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
        {members.isLoading
          ? Array.from({ length: 3 }, (_, index) => (
              <View key={index} style={[styles.row, index < 2 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
                <Skeleton width={40} height={40} style={styles.round} />
                <View style={styles.grow}>
                  <Skeleton width="55%" height={14} />
                </View>
              </View>
            ))
          : list.map((member, index) => (
              <View key={member.id} style={[styles.row, index < list.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
                <Avatar variant="legacy" name={member.name} src={member.avatarUrl ?? undefined} size="sm" box={40} />
                <View style={styles.grow}>
                  <DsText v="title-sm" numberOfLines={1}>
                    {member.name}
                  </DsText>
                  <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                    @{member.username}
                  </DsText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("students.removeAria", { name: member.name })}
                  disabled={remove.isPending}
                  onPress={() =>
                    clubId &&
                    remove.mutate({ id: clubId, studentId: member.id }, { onError: (error: Error) => toast.error(error.message) })
                  }
                  style={({ pressed }) => [styles.remove, pressed && { backgroundColor: ds.c["error-bg"] }, remove.isPending && styles.dim]}
                >
                  <Icon name="close" size={18} color={ds.c["ink-tertiary"]} />
                </Pressable>
              </View>
            ))}
        {!members.isLoading && !list.length ? (
          <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
            {t("club.empty")}
          </DsText>
        ) : null}
      </View>

      <Sheet
        variant="app"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("club.add")}
        description={t("club.addHint")}
        footer={
          <>
            <MobileButton variant="secondary" label={t("students.cancel")} onPress={() => setAddOpen(false)} />
            <MobileButton
              label={t("club.add")}
              disabled={(!audience.courseIds.length && !audience.studentIds.length) || add.isPending}
              onPress={submit}
            />
          </>
        }
      >
        <AudiencePicker value={audience} onChange={setAudience} />
      </Sheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  /* `gap-4 px-4 pt-5 pb-8` */
  page: { gap: 16, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  head: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  add: { height: 40, paddingHorizontal: 16 },
  list: { overflow: "hidden", borderRadius: dsRadius.xl },
  /* `gap-3 px-4 py-3` */
  row: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  grow: { flex: 1, minWidth: 0 },
  round: { borderRadius: 20 },
  remove: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.5 },
  empty: { paddingHorizontal: 16, paddingVertical: 24, textAlign: "center" },
});
