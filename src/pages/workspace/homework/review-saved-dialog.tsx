import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { CenterDialog, DsText, dsRadius, Icon, useDs } from "@/shared/ui";

export interface ReviewSaved {
  kind: "graded" | "resubmit";
  studentName: string;
  grade: number | null;
  reviewed: number;
  total: number;
  next: { id: string; name: string } | null;
}

export interface ReviewSavedDialogProps {
  saved: ReviewSaved | null;
  onNext: (id: string) => void;
  onBack: () => void;
  onClose: () => void;
}

/**
 * Baho yoki qayta topshirish so'rovidan keyingi oyna — veb
 * `review-saved-dialog.tsx` (`AppDialog variant="confirm"`, markazda):
 * natija, "Tekshirildi N / M" chizig'i, "Keyingi: {ism}" yoki "Barcha ishlar
 * tekshirildi".
 */
export function ReviewSavedDialog({ saved, onNext, onBack, onClose }: ReviewSavedDialogProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const graded = saved?.kind !== "resubmit";
  const reviewed = saved?.reviewed ?? 0;
  const total = Math.max(saved?.total ?? 0, reviewed);
  const percent = total ? Math.round((reviewed / total) * 100) : 0;
  const next = saved?.next ?? null;

  const primary = (label: string, onPress: () => void, arrow = false) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
    >
      <DsText v="button" c="on-action" numberOfLines={1} style={styles.shrink}>
        {label}
      </DsText>
      {arrow ? <Icon name="arrow-forward" size={18} color={ds.c["on-action"]} /> : null}
    </Pressable>
  );
  const secondary = (label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.outline,
        { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
      ]}
    >
      <DsText v="button">{label}</DsText>
    </Pressable>
  );

  return (
    <CenterDialog open={Boolean(saved)} onClose={onClose} maxWidth={400}>
      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: graded ? ds.c["success-bg"] : ds.c["brand-subtle"] }]}>
          <Icon name={graded ? "check-circle" : "refresh"} size={28} color={graded ? ds.c["success-fg"] : ds.c.brand} />
        </View>
        <DsText v="title-lg" w="600" style={styles.center}>
          {graded ? t("reviewSaved.gradedTitle") : t("reviewSaved.resubmitTitle")}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" style={styles.center}>
          {graded
            ? t("reviewSaved.gradedText", { name: saved?.studentName ?? "", grade: saved?.grade ?? "—" })
            : t("reviewSaved.resubmitText", { name: saved?.studentName ?? "" })}
        </DsText>

        {/* `gap-2 rounded-2xl bg-subtle/60 p-4` */}
        <View style={[styles.progress, { backgroundColor: ds.c.subtle }]}>
          <View style={styles.progressHead}>
            <DsText v="body-sm" w="600" style={styles.shrink}>
              {next ? t("reviewSaved.progress", { done: reviewed, total }) : t("reviewSaved.allDone")}
            </DsText>
            <DsText v="caption-strong" c="ink-secondary" numeric>
              {percent}%
            </DsText>
          </View>
          {/* `h-1.5 rounded-full bg-surface`, ichi `bg-success` */}
          <View style={[styles.track, { backgroundColor: ds.c.surface }]}>
            <View style={[styles.fill, { width: `${percent}%`, backgroundColor: ds.c.success }]} />
          </View>
        </View>

        <View style={styles.actions}>
          {next ? (
            <>
              {primary(t("reviewSaved.next", { name: next.name }), () => onNext(next.id), true)}
              {secondary(t("reviewSaved.back"), onBack)}
            </>
          ) : (
            <>
              {primary(t("reviewSaved.back"), onBack)}
              {secondary(t("reviewSaved.close"), onClose)}
            </>
          )}
        </View>
      </View>
    </CenterDialog>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: "center", gap: 12, padding: 24 },
  center: { textAlign: "center" },
  shrink: { flexShrink: 1 },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  progress: { alignSelf: "stretch", gap: 8, padding: 16, borderRadius: dsRadius["2xl"] },
  progressHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  track: { height: 6, overflow: "hidden", borderRadius: dsRadius.full },
  fill: { height: "100%", borderRadius: dsRadius.full },
  actions: { alignSelf: "stretch", gap: 8, marginTop: 4 },
  /* `h-12 w-full rounded-full` */
  button: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20, borderRadius: dsRadius.full },
  outline: { borderWidth: 1 },
});
