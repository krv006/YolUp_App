import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMyAnalytics } from "@/modules/analytics";
import { useAuth, useRoleRoutes } from "@/modules/auth";
import { ROLES } from "@/shared/constants";
import {
  DsGradient,
  MobileListCard,
  MobileListRow,
  MobileListSkeleton,
  MobileRoundButton,
  MobileSectionTitle,
  MobileStatsCard,
  MobileTitleHeader,
  PullRefresh,
  useDs,
  type IconName,
} from "@/shared/ui";
import { LogoutDialog, SwitchAccountDialog } from "./profile-dialogs";

const SETTINGS: ReadonlyArray<{ id: string; icon: IconName; tone: string }> = [
  { id: "personal", icon: "person", tone: "bg-brand-subtle text-ink" },
  { id: "account", icon: "shield", tone: "bg-success-bg text-success" },
  { id: "system", icon: "settings", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
  { id: "help", icon: "help", tone: "bg-accent-violet-bg text-accent-violet-fg" },
];

/**
 * Profil — veb `profile-page.tsx` (tor ekran): rol va "Profil", sozlamalar
 * tugmasi; oy natijalari kartasi (baho, baholar soni, davomat); "Sozlamalar"
 * va "Faollik" ro'yxatlari; akkaunt almashtirish va chiqish.
 */
export function ProfilePage() {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const routes = useRoleRoutes();
  const { user } = useAuth();
  const analytics = useMyAnalytics();
  const [switchOpen, setSwitchOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const months = tl("list.monthsLong", { returnObjects: true }) as string[];

  const courses = analytics.data?.kind === "teacher" ? analytics.data.courses : [];
  const rates = courses.map((course) => course.attendanceRate).filter((value): value is number => value !== null);
  const attendance = rates.length ? Math.round(rates.reduce((sum, value) => sum + value, 0) / rates.length) : null;
  const rating = user?.avgRating ?? null;
  const ratingLabel = rating === null ? "—" : rating.toFixed(1).replace(".", ",");
  const ratingCount = user?.ratingCount ?? 0;
  const certificates = user?.certificates.length ?? 0;
  const role = user?.role === ROLES.TEACHER ? "teacher" : (user?.role?.toLowerCase() ?? "student");
  const eyebrow = t("page.mobile.eyebrow", { role: tn(`roles.${role}`, { defaultValue: user?.role ?? "" }) });
  const open = (path: string) => router.push(`${routes.profile}/${path}` as never);

  const activity: ReadonlyArray<{ id: string; icon: IconName; tone: string; subtitle: string }> = [
    { id: "ratings", icon: "star", tone: "bg-accent-saffron-bg text-accent-saffron-fg", subtitle: t("page.mobile.ratingsHint", { value: ratingLabel, count: ratingCount }) },
    // Veb #160: o'quvchi profilida "Sertifikatlar" yo'q.
    ...(user?.role === ROLES.STUDENT
      ? []
      : [{ id: "certificates", icon: "check-circle" as const, tone: "bg-success-bg text-success", subtitle: t("page.mobile.certificatesHint", { count: certificates }) }]),
    { id: "logins", icon: "clock", tone: "bg-brand-subtle text-brand", subtitle: t("page.loginsRowHint") },
  ];

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView style={styles.fill} contentContainerStyle={[styles.page, { paddingTop: insets.top + 22 }]} refreshControl={<PullRefresh onRefresh={() => analytics.refetch()} />}>
        <DsGradient name="auth" />
        <MobileTitleHeader
          eyebrow={eyebrow}
          title={t("page.title")}
          action={analytics.isLoading ? undefined : <MobileRoundButton icon="settings" label={t("page.systemTitle")} onPress={() => open("system")} />}
        />

        {analytics.isLoading ? (
          <MobileListSkeleton card rows={4} />
        ) : (
          <>
            <MobileStatsCard
              label={t("page.mobile.monthResults", { month: months[new Date().getMonth()] ?? "" })}
              actionLabel={t("page.mobile.details")}
              onAction={() => open("ratings")}
              items={[
                { id: "rating", value: ratingLabel, label: t("page.mobile.rating") },
                { id: "count", value: ratingCount, label: t("page.mobile.ratingCount") },
                { id: "attendance", value: attendance === null ? "—" : `${attendance}%`, label: t("page.mobile.attendance") },
              ]}
            />

            <View style={styles.section}>
              <MobileSectionTitle>{t("page.settings")}</MobileSectionTitle>
              <MobileListCard>
                {SETTINGS.map((item, index) => (
                  <MobileListRow
                    key={item.id}
                    icon={item.icon}
                    tone={item.tone}
                    title={t(`page.${item.id}Title`)}
                    subtitle={t(`page.${item.id}Hint`)}
                    last={index === SETTINGS.length - 1}
                    onPress={() => open(item.id)}
                  />
                ))}
              </MobileListCard>
            </View>

            <View style={styles.section}>
              <MobileSectionTitle>{t("page.mobile.activity")}</MobileSectionTitle>
              <MobileListCard>
                {activity.map((item, index) => (
                  <MobileListRow
                    key={item.id}
                    icon={item.icon}
                    tone={item.tone}
                    title={t(`page.${item.id}Title`)}
                    subtitle={item.subtitle}
                    last={index === activity.length - 1}
                    onPress={() => open(item.id)}
                  />
                ))}
              </MobileListCard>
            </View>

            <MobileListCard>
              <MobileListRow
                icon="groups"
                tone="bg-brand-subtle text-brand"
                title={t("page.switchAccount")}
                subtitle={t("page.switchAccountHint")}
                onPress={() => setSwitchOpen(true)}
              />
              <MobileListRow
                icon="logout"
                tone="bg-danger-bg text-error-text"
                title={t("page.logout")}
                titleColor="error-text"
                chevron={false}
                last
                onPress={() => setLogoutOpen(true)}
              />
            </MobileListCard>
          </>
        )}
      </ScrollView>

      <SwitchAccountDialog open={switchOpen} onOpenChange={setSwitchOpen} />
      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* `gap-5.5 px-4 pt-5.5` */
  page: { gap: 22, paddingHorizontal: 16, paddingBottom: 24 },
  section: { gap: 12 },
});
