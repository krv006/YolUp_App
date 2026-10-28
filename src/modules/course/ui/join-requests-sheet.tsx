import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { formatRelativeShort } from "@/shared/lib";
import { Avatar, DsText, dsRadius, Icon, MobileButton, Sheet, useDs } from "@/shared/ui";
import { useCourseRequests, useRespondCourseRequest } from "../model/course.queries";

export interface JoinRequestsSheetProps {
  courseId: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Qo'shilish so'rovlari — veb `join-requests-dialog.tsx` (pastki oyna):
 * har so'rovda rad etish va qabul qilish, pastda "Hammasini qabul qilish".
 * Vaqt `formatRelativeShort` bilan: Hermes'da `Intl.RelativeTimeFormat` yo'q.
 */
export function JoinRequestsSheet({ courseId, open, onClose }: JoinRequestsSheetProps) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const requests = useCourseRequests({ page_size: 50 }, open);
  const respond = useRespondCourseRequest();
  const rows = (requests.data?.items ?? []).filter((item) => !courseId || item.courseId === courseId);

  async function acceptAll() {
    await Promise.allSettled(rows.map((row) => respond.mutateAsync({ enrollmentId: row.id, action: "approve" })));
    onClose();
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={onClose}
      title={t("addStudent.requestsTitle", { count: rows.length })}
      description={t("addStudent.requestsDescription")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("addStudent.close")} onPress={onClose} />
          <MobileButton label={t("addStudent.acceptAll", { count: rows.length })} disabled={!rows.length || respond.isPending} onPress={() => void acceptAll()} />
        </>
      }
    >
      {requests.isLoading ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={[styles.skeleton, { backgroundColor: ds.c.muted }]} />
          ))}
        </View>
      ) : rows.length ? (
        <View style={styles.list}>
          {rows.map((row) => (
            <View key={row.id} style={styles.row}>
              <Avatar variant="legacy" name={row.student.name} tone={row.student.avatarTone} size="md" />
              <View style={styles.grow}>
                <DsText v="title-sm" numberOfLines={1}>
                  {row.student.name}
                </DsText>
                <DsText v="body-xs" c="ink-tertiary" numberOfLines={1}>
                  {row.createdAt ? formatRelativeShort(row.createdAt) : ""}
                </DsText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("addStudent.decline")}
                disabled={respond.isPending}
                onPress={() => respond.mutate({ enrollmentId: row.id, action: "decline" })}
                style={[styles.round, { borderWidth: 1, borderColor: ds.c.line, backgroundColor: ds.c.surface }]}
              >
                <Icon name="close" size={18} color={ds.c.ink} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("addStudent.accept")}
                disabled={respond.isPending}
                onPress={() => respond.mutate({ enrollmentId: row.id, action: "approve" })}
                style={[styles.round, { backgroundColor: ds.c.brand }]}
              >
                <Icon name="check" size={18} color={ds.c["ink-inverse"]} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
          {t("addStudent.requestsEmpty")}
        </DsText>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  list: { gap: 12 },
  skeleton: { height: 48, borderRadius: dsRadius.md },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  round: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  empty: { paddingHorizontal: 4, paddingVertical: 24, textAlign: "center" },
});
