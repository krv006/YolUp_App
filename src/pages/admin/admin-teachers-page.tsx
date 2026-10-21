import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, BarChart3, ShieldCheck, Star, Users } from "lucide-react-native";
import { useApproveTeacher, usePendingTeachers, useTeachers } from "@/modules/auth";
import { ROUTES } from "@/shared/config";
import type { AuthUser } from "@/shared/types";
import {
  Avatar,
  PortalButton,
  PortalCard,
  PortalHeading,
  portalPage,
  PortalSectionHead,
  Screen,
  SelectField,
  Text,
  useLegacyColors,
  useTheme,
} from "@/shared/ui";
import { TeacherStatsSheet } from "./teacher-stats-sheet";

type TeacherView = "pending" | "all";

/**
 * O'qituvchilar — veb `admin-teachers-page.tsx`: tasdiqlanishi kerak
 * bo'lganlar yoki barcha o'qituvchilar, reyting, statistika va tasdiqlash.
 * `?teacher=<id>` bilan kelinsa (bildirishnomadan) o'sha qatorga aylanadi.
 *
 * Vebda tor ekranda bo'lim sarlavhasi tanlagich yonida 110px ga siqiladi —
 * bu yerda tanlagich sarlavha ostida, to'liq kenglikda.
 */
export function AdminTeachersPage() {
  const { t } = useTranslation("admin");
  const router = useRouter();
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const { teacher: highlightId } = useLocalSearchParams<{ teacher?: string }>();
  const pending = usePendingTeachers();
  const teachers = useTeachers();
  const approve = useApproveTeacher();
  const [statsTarget, setStatsTarget] = useState<AuthUser | null>(null);
  const [view, setView] = useState<TeacherView>("pending");
  const query = view === "pending" ? pending : teachers;
  const list = query.data ?? [];

  // Vebdagi `scrollIntoView({ block: "center" })`.
  const scrollRef = useRef<ScrollView>(null);
  const [listY, setListY] = useState(0);
  const [rowY, setRowY] = useState<number | null>(null);
  useEffect(() => {
    if (rowY == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(listY + rowY - 200, 0), animated: true });
  }, [listY, rowY]);

  return (
    <Screen padded={false}>
      <ScrollView
        ref={scrollRef}
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={portalPage}
        refreshControl={
          <RefreshControl
            refreshing={pending.isRefetching || teachers.isRefetching}
            onRefresh={() => {
              void pending.refetch();
              void teachers.refetch();
            }}
            tintColor={palette["muted-foreground"]}
          />
        }
      >
        <PortalHeading
          eyebrowIcon={ShieldCheck}
          eyebrow={t("teachers.eyebrow")}
          title={t("teachers.title")}
          description={t("teachers.subtitle")}
          actions={
            <PortalButton
              variant="primary"
              size="link"
              icon={ArrowLeft}
              label={t("teachers.backToDashboard")}
              onPress={() => (router.canGoBack() ? router.back() : router.replace(ROUTES.admin.dashboard))}
            />
          }
        />

        <PortalCard style={styles.panel}>
          <PortalSectionHead
            eyebrowIcon={view === "pending" ? ShieldCheck : Users}
            eyebrow={view === "pending" ? t("teachers.pendingEyebrow") : t("teachers.allEyebrow")}
            title={view === "pending" ? t("teachers.pendingTitle") : t("teachers.allTitle")}
          />
          <SelectField
            hideLabel
            label={t("teachers.viewLabel")}
            icon={view === "pending" ? <ShieldCheck size={17} color={colors.muted} /> : <Users size={17} color={colors.muted} />}
            value={view}
            onChange={(value) => setView(value as TeacherView)}
            options={[
              { value: "pending", label: t("teachers.viewPending", { count: pending.data?.length ?? 0 }) },
              { value: "all", label: t("teachers.viewAll", { count: teachers.data?.length ?? 0 }) },
            ]}
          />

          {query.isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={palette.primary} />
              <Text variant="label" style={{ color: colors.muted }}>
                {t("teachers.loading")}
              </Text>
            </View>
          ) : null}

          {/* `.admin-teacher-list` — orasi 4 */}
          <View style={styles.list} onLayout={(event) => setListY(event.nativeEvent.layout.y)}>
            {list.map((teacher, index) => (
              <TeacherRow
                key={teacher.id}
                teacher={teacher}
                last={index === list.length - 1}
                highlighted={teacher.id === highlightId}
                onLayoutY={teacher.id === highlightId ? setRowY : undefined}
                onStats={setStatsTarget}
                action={
                  view === "pending" ? (
                    <PortalButton
                      size="sm"
                      variant="primary"
                      label={t("teachers.approve")}
                      loading={approve.isPending && approve.variables === teacher.id}
                      onPress={() => approve.mutate(teacher.id)}
                    />
                  ) : undefined
                }
              />
            ))}
            {!query.isLoading && !list.length ? (
              <Text variant="body" style={{ color: colors.muted }}>
                {view === "pending" ? t("teachers.noPending") : t("teachers.noTeachers")}
              </Text>
            ) : null}
          </View>
        </PortalCard>
      </ScrollView>

      <TeacherStatsSheet teacher={statsTarget} onClose={() => setStatsTarget(null)} />
    </Screen>
  );
}

/** `.admin-teacher-row` — 12 4, pastki chiziq, avatar, ism, reyting va amallar. */
function TeacherRow({
  teacher,
  last,
  highlighted,
  onLayoutY,
  onStats,
  action,
}: {
  teacher: AuthUser;
  last: boolean;
  highlighted: boolean;
  onLayoutY?: (y: number) => void;
  onStats: (teacher: AuthUser) => void;
  action?: ReactNode;
}) {
  const { t } = useTranslation("admin");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const ratingCount = teacher.ratingCount ?? 0;
  return (
    <View
      onLayout={onLayoutY ? (event) => onLayoutY(event.nativeEvent.layout.y) : undefined}
      style={[
        styles.row,
        !last && { borderBottomWidth: 1, borderColor: colors.border },
        highlighted && { backgroundColor: palette["primary-tint"] },
      ]}
    >
      <Avatar name={teacher.name} src={teacher.avatarUrl} size="sm" />
      <View style={styles.identity}>
        <Text variant="label" numberOfLines={1}>
          {teacher.name}
        </Text>
        <Text variant="caption" numberOfLines={1} style={[styles.small, { color: colors.muted }]}>
          @{teacher.username}
        </Text>
      </View>
      {/* `RatingSummary compact` — baho bo'lmasa ko'rinmaydi. */}
      {ratingCount && teacher.avgRating != null ? (
        <View style={styles.rating}>
          <Star size={13} color={palette.warning} fill={palette.warning} />
          <Text variant="caption" style={styles.ratingText}>
            {teacher.avgRating.toFixed(1)}
          </Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("stats.openAria", { name: teacher.name })}
        onPress={() => onStats(teacher)}
        style={({ pressed }) => [
          styles.iconButton,
          { borderColor: colors.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
        ]}
      >
        <BarChart3 size={16} color={colors.foreground} />
      </Pressable>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  /* `.admin-teacher-panel` — 20 bo'shliq */
  panel: { padding: 20, gap: 14 },
  loading: { alignItems: "center", gap: 10, paddingVertical: 16 },
  list: { gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 8 },
  identity: { flex: 1, minWidth: 0, gap: 2 },
  small: { fontSize: 11, lineHeight: 16.5 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 13, fontWeight: "700" },
  /* `.icon-button` — 36x36, radius 10 */
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 10 },
});
