import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Rect } from "react-native-svg";
import { AddChildDialog, parentFamily } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatRelativeShort } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import { Avatar, DsText, dsRadius, Icon, MobileRoundButton, MobileTitleHeader, useDs, type DsColor } from "@/shared/ui";
import { ParentErrorBanner, ParentScreen } from "@/widgets/parent-shell";
import { MobileConnect } from "../dashboard/parent-home-mobile";
import { PendingLinkActions } from "../dashboard/pending-link-actions";
import { ChildAvatar } from "./child-avatar";
import { visitWhen } from "./family-format";
import { useParentFamily } from "./use-parent-family";

/**
 * Farzandlar — veb `pages/parent/children/family-mobile.tsx`: har farzand
 * kartasi (oylik davomat, darslar, o'rtacha ball; tanlanganida oxirgi
 * faollik) bosilsa profil ochiladi; kutilayotgan so'rovlar uzuq ramkada
 * eslatish va bekor qilish bilan.
 */
export function FamilyMobile() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const online = useOnlineStatus();
  const family = useParentFamily("month");
  const [adding, setAdding] = useState(false);
  const empty = !family.loading && !family.rows.length && !family.pending.length && !family.failed;

  return (
    <ParentScreen tabs onRefresh={async () => family.retry()}>
      <MobileTitleHeader
        eyebrow={t("family.eyebrowBase")}
        title={t("family.title")}
        action={<MobileRoundButton icon="person-add" label={t("switcher.add")} background="surface" onPress={() => setAdding(true)} />}
      />
      {online && family.failed ? <ParentErrorBanner onRetry={family.retry} /> : null}
      {family.loading ? (
        <View style={styles.list} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {[0, 1].map((item) => (
            <View key={item} style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />
          ))}
        </View>
      ) : empty ? (
        <MobileConnect />
      ) : (
        <>
          {family.rows.map((row) => {
            const selected = row.child.id === family.selectedChildId;
            const tone: DsColor =
              row.attendance === null ? "ink" : parentFamily.isGoodAttendance(row.attendance) ? "success-text" : "warning-text";
            const stats: Array<{ value: string; label: string; tone: DsColor }> = [
              { value: row.attendance === null ? "—" : `${row.attendance}%`, label: t("family.stats.attendance"), tone },
              { value: String(row.attended), label: t("family.stats.lessons"), tone: "ink" },
              { value: row.score === null ? "—" : String(row.score), label: t("family.stats.score"), tone: "ink" },
            ];
            return (
              <Pressable
                key={row.child.id}
                accessibilityRole="button"
                onPress={() => router.push(ROUTES.parent.child(row.child.id) as never)}
                style={({ pressed }) => [styles.card, { backgroundColor: ds.c.surface, borderColor: selected ? ds.c.brand : "transparent" }, pressed && styles.pressed]}
              >
                <View style={styles.cardHead}>
                  <ChildAvatar child={row.child} size="sm" />
                  <View style={styles.grow}>
                    <DsText v="title" numberOfLines={1}>
                      {row.child.name}
                    </DsText>
                    <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                      {[row.child.username, row.child.grade].filter(Boolean).join(" · ")}
                    </DsText>
                  </View>
                  {selected ? (
                    <View style={[styles.chip, { backgroundColor: ds.c["success-bg"] }]}>
                      <Icon name="check-circle" size={14} color={ds.c["success-text"]} />
                      <DsText v="caption-strong" c="success-text">
                        {t("family.selected")}
                      </DsText>
                    </View>
                  ) : (
                    <Icon name="chevron-right" size={20} color={ds.c["icon-tertiary"]} />
                  )}
                </View>
                {/* `grid grid-cols-3 rounded-2xl bg-subtle px-2 py-3 text-center` */}
                <View style={[styles.stats, { backgroundColor: ds.c.subtle }, row.loading && styles.loading]}>
                  {stats.map((stat) => (
                    <View key={stat.label} style={styles.stat}>
                      <DsText v="h2" heading w="600" c={stat.tone} style={styles.statValue}>
                        {stat.value}
                      </DsText>
                      <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                        {stat.label}
                      </DsText>
                    </View>
                  ))}
                </View>
                {selected ? (
                  <View style={styles.activity}>
                    <Icon name="history" size={16} color={ds.c["icon-tertiary"]} />
                    <DsText v="body-xs" c="ink-secondary" numberOfLines={1} style={styles.grow}>
                      {row.lastVisit
                        ? t("family.activity", { course: row.lastVisit.course, when: visitWhen(row.lastVisit.at, family.now, t) })
                        : t("family.noActivity")}
                    </DsText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
          {family.pending.map((link) => (
            <View key={link.id} style={styles.pending}>
              <DashedFrame />
              <View style={styles.cardHead}>
                <Avatar variant="legacy" name={link.student.name} src={link.student.avatarUrl ?? undefined} size="md" box={44} />
                <View style={styles.grow}>
                  <DsText v="title-sm" numberOfLines={1}>
                    {link.student.name}
                  </DsText>
                  <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                    {t("family.pending", { username: link.student.username })}
                  </DsText>
                </View>
                <View style={[styles.chip, { backgroundColor: ds.c["accent-teal-bg"] }]} accessibilityLabel={formatRelativeShort(link.createdAt)}>
                  <Icon name="schedule" size={14} color={ds.c["accent-teal-fg"]} />
                  <DsText v="caption-strong" c="accent-teal-fg">
                    {t("switcher.pending")}
                  </DsText>
                </View>
              </View>
              <PendingLinkActions link={link} />
            </View>
          ))}
        </>
      )}
      <AddChildDialog open={adding} onOpenChange={setAdding} />
    </ParentScreen>
  );
}

/**
 * `border-2 border-dashed border-line-strong rounded-[20px]` — Android
 * `borderStyle: "dashed"` ni burchakli ramkada notekis chizadi, shuning uchun SVG.
 */
function DashedFrame() {
  const ds = useDs();
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={(event) => setSize(event.nativeEvent.layout)}>
      {size.width ? (
        <Svg width={size.width} height={size.height}>
          <Rect x={1} y={1} width={size.width - 2} height={size.height - 2} rx={19} fill="none" stroke={ds.c["line-strong"]} strokeWidth={2} strokeDasharray="6 4" />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.9 },
  list: { gap: 12 },
  skeleton: { height: 172, borderRadius: 20 },
  /* `flex flex-col gap-3 rounded-[20px] border-2 bg-surface p-4` */
  card: { gap: 12, padding: 16, borderWidth: 2, borderRadius: 20 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  chip: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  stats: { flexDirection: "row", paddingHorizontal: 8, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  loading: { opacity: 0.6 },
  stat: { flex: 1, alignItems: "center" },
  /* `font-heading text-[20px]/7 font-semibold` */
  statValue: { lineHeight: 28 },
  activity: { flexDirection: "row", alignItems: "center", gap: 8 },
  pending: { gap: 12, padding: 16, borderRadius: 20 },
});
