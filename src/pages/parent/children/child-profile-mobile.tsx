import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { ROUTES } from "@/shared/config";
import { DsText, dsRadius, Icon, MobilePageHeader, useDs, type DsColor, type IconName } from "@/shared/ui";
import { ParentScreen, useParentBack } from "@/widgets/parent-shell";
import { subjectLook } from "../attendance/attendance-styles";
import { ChildAvatar } from "./child-avatar";
import { UnlinkChildDialog } from "./unlink-child-dialog";
import { useChildProfile } from "./use-child-profile";

/**
 * Farzand profili — veb `child-profile-mobile.tsx`: avatar, ism, chiplar
 * (onlayn, guruhlar, oylik davomat), guruhlar ro'yxati (o'qituvchi va dars
 * kunlari), "Maxfiylik" (ruxsatlar, kirishlar, davomat) va ulanishni uzish.
 */
export function ChildProfileMobile({ childId }: { childId: string }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const back = useParentBack(ROUTES.parent.children);
  const profile = useChildProfile(childId);
  const { child } = profile;
  const weekdays = t("home.hero.weekdays", { returnObjects: true }) as string[];
  const [unlinking, setUnlinking] = useState(false);
  if (!profile.loading && !child && !profile.failed) return <Redirect href={ROUTES.parent.children as never} />;

  return (
    <ParentScreen onRefresh={async () => profile.retry()}>
      <MobilePageHeader title={t("profile.title")} backLabel={t("profile.breadcrumb")} onBack={back} />
      {!child ? (
        <View style={styles.stack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {[216, 150, 200].map((height) => (
            <View key={height} style={[styles.skeleton, { height, backgroundColor: ds.c.surface }]} />
          ))}
        </View>
      ) : (
        <>
          {/* `flex flex-col items-center gap-2 rounded-[20px] bg-surface px-4 py-5 text-center` */}
          <View style={[styles.hero, { backgroundColor: ds.c.surface }]}>
            <ChildAvatar child={child} size="lg" />
            <DsText v="h2" heading w="600" style={styles.name}>
              {child.name}
            </DsText>
            <DsText v="body-sm" c="ink-secondary" style={styles.center}>
              {[child.username, child.grade || t("profile.role")].join(" · ")}
            </DsText>
            <View style={styles.chips}>
              {child.isOnline ? (
                <View style={[styles.chip, { backgroundColor: ds.c["success-bg"] }]}>
                  <View style={[styles.dot, { backgroundColor: ds.c.success }]} />
                  <DsText v="caption-strong" c="success-text">
                    {t("profile.online")}
                  </DsText>
                </View>
              ) : null}
              {profile.groups.length ? (
                <View style={[styles.chip, { backgroundColor: ds.c["accent-blue-bg"] }]}>
                  <Icon name="groups" size={14} color={ds.c["accent-blue-fg"]} />
                  <DsText v="caption-strong" c="accent-blue-fg">
                    {t("profile.groupsChip", { count: profile.groups.length })}
                  </DsText>
                </View>
              ) : null}
              {profile.attendancePercent !== null ? (
                <View style={[styles.chip, { backgroundColor: ds.c["accent-violet-bg"] }]}>
                  <Icon name="trending-up" size={14} color={ds.c["accent-violet-fg"]} />
                  <DsText v="caption-strong" c="accent-violet-fg">
                    {t("profile.attendanceChip", { percent: profile.attendancePercent })}
                  </DsText>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <DsText v="title-lg" heading style={styles.sectionTitle}>
              {t("profile.groups")}
            </DsText>
            <View style={[styles.list, { backgroundColor: ds.c.surface }, profile.sectionsLoading && styles.loading]}>
              {profile.groups.map((group, index) => {
                const look = subjectLook(`${group.subject} ${group.language ? "language" : ""}`);
                return (
                  <View key={group.id} style={[styles.row, index < profile.groups.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
                    <View style={[styles.rowIcon, { backgroundColor: ds.c[look.bg] }]}>
                      <Icon name={look.icon} size={22} color={ds.c[look.fg]} />
                    </View>
                    <View style={styles.grow}>
                      <DsText v="title-sm" numberOfLines={1}>
                        {group.title}
                      </DsText>
                      <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                        {[group.teacher, group.schedule?.time].filter(Boolean).join(" · ")}
                      </DsText>
                    </View>
                    {group.schedule ? (
                      <View style={[styles.days, { backgroundColor: ds.c["accent-teal-bg"] }]}>
                        <Icon name="schedule" size={14} color={ds.c["accent-teal-fg"]} />
                        <DsText v="caption-strong" c="accent-teal-fg">
                          {group.schedule.days.map((day) => weekdays[day] ?? "").join(", ")}
                        </DsText>
                      </View>
                    ) : null}
                  </View>
                );
              })}
              {!profile.groups.length && !profile.sectionsLoading ? (
                <DsText v="body-sm" c="ink-tertiary" style={styles.empty}>
                  {t("profile.noGroups")}
                </DsText>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <DsText v="title-lg" heading style={styles.sectionTitle}>
              {t("mobile.profile.privacy")}
            </DsText>
            <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
              {(
                [
                  {
                    id: "permissions",
                    icon: "shield",
                    bg: "accent-violet-bg",
                    fg: "accent-violet-fg",
                    title: t("profile.permissions"),
                    text: t("mobile.profile.permissionsText"),
                    to: ROUTES.parent.childPermissions(child.id),
                  },
                  {
                    id: "logins",
                    icon: "history",
                    bg: "brand-subtle",
                    fg: "brand",
                    title: t("profile.logins"),
                    text: profile.newDevices ? t("profile.newDevices", { count: profile.newDevices }) : t("profile.noNewDevices"),
                    to: ROUTES.parent.childLogins(child.id),
                  },
                  {
                    id: "attendance",
                    icon: "event",
                    bg: "accent-green-bg",
                    fg: "accent-green-fg",
                    title: t("profile.attendance"),
                    text: t("mobile.profile.attendanceText"),
                    to: ROUTES.parent.attendance,
                  },
                ] as Array<{ id: string; icon: IconName; bg: DsColor; fg: DsColor; title: string; text: string; to: string }>
              ).map((row, index) => (
                <Pressable
                  key={row.id}
                  accessibilityRole="button"
                  onPress={() => {
                    if (row.id === "attendance") {
                      profile.select();
                      router.navigate(row.to as never);
                    } else router.push(row.to as never);
                  }}
                  style={({ pressed }) => [styles.row, index < 2 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }, pressed && { backgroundColor: ds.c.subtle }]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: ds.c[row.bg] }]}>
                    <Icon name={row.icon} size={22} color={ds.c[row.fg]} />
                  </View>
                  <View style={styles.grow}>
                    <DsText v="title-sm">{row.title}</DsText>
                    <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                      {row.text}
                    </DsText>
                  </View>
                  <Icon name="chevron-right" size={20} color={ds.c["icon-tertiary"]} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* `flex h-13 items-center justify-center gap-2 rounded-[20px] bg-surface text-button text-error-text` */}
          <Pressable
            accessibilityRole="button"
            onPress={() => setUnlinking(true)}
            style={({ pressed }) => [styles.unlink, { backgroundColor: pressed ? ds.c["danger-bg"] : ds.c.surface }]}
          >
            <Icon name="link-off" size={20} color={ds.c["error-text"]} />
            <DsText v="button" c="error-text">
              {t("profile.unlink.action")}
            </DsText>
          </Pressable>
          <UnlinkChildDialog child={child} open={unlinking} onOpenChange={setUnlinking} />
        </>
      )}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  stack: { gap: 16 },
  skeleton: { borderRadius: 20 },
  hero: { alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 20, borderRadius: 20 },
  name: { marginTop: 4, lineHeight: 28, textAlign: "center" },
  chips: { marginTop: 4, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 2 },
  section: { gap: 8 },
  /* `px-1 font-heading text-[18px]/6 font-semibold` */
  sectionTitle: { paddingHorizontal: 4 },
  list: { overflow: "hidden", borderRadius: 20 },
  loading: { opacity: 0.6 },
  /* `flex items-center gap-3 px-4 py-3.5` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  days: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: dsRadius.full },
  empty: { paddingHorizontal: 16, paddingVertical: 24, textAlign: "center" },
  unlink: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 20 },
});
