import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck } from "lucide-react-native";
import { useApproveTeacher, usePendingTeachers, useTeachers } from "@/modules/auth";
import { RatingSummary } from "@/modules/lesson";
import type { AuthUser } from "@/shared/types";
import {
  Avatar,
  Badge,
  Button,
  IconButton,
  radius,
  Screen,
  ScreenLoading,
  Separator,
  Text,
  useTheme,
} from "@/shared/ui";

/**
 * O'qituvchilarni tasdiqlash — veb `admin-teachers-page.tsx` porti.
 *
 * Tasdiqlanmagan o'qituvchi kurs va dars YARATA OLMAYDI (backend 403 beradi),
 * shuning uchun kutayotganlar ro'yxati tepada va ajratib ko'rsatiladi.
 */
export function AdminTeachersPage() {
  const { t } = useTranslation("mobile");
  const router = useRouter();
  const { palette } = useTheme();

  const pending = usePendingTeachers();
  const teachers = useTeachers();
  const approve = useApproveTeacher();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/admin/dashboard");
  }

  if (pending.isLoading || teachers.isLoading) {
    return (
      <Screen>
        <ScreenLoading label={t("admin.oqituvchilar_yuklanmoqda")} />
      </Screen>
    );
  }

  const waiting = pending.data ?? [];
  const all = teachers.data ?? [];

  return (
    <Screen padded={false}>
      <View style={[styles.head, { borderBottomColor: palette.border }]}>
        <IconButton accessibilityLabel={t("admin.orqaga")} onPress={goBack}>
          <ArrowLeft size={22} color={palette.foreground} />
        </IconButton>
        <Text variant="subheading" style={styles.title}>
          {t("admin.oqituvchilar")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
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
        {waiting.length > 0 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: palette["warning-soft"], borderColor: palette.border },
            ]}
          >
            <View style={styles.cardHead}>
              <ShieldCheck size={16} color={palette["warning-strong"]} />
              <Text variant="label" style={{ color: palette["warning-strong"] }}>
                Tasdiq kutmoqda ({waiting.length})
              </Text>
            </View>

            {waiting.map((teacher, index) => (
              <View key={teacher.id}>
                {index > 0 ? <Separator /> : null}
                <TeacherRow
                  teacher={teacher}
                  action={
                    <Button
                      title={t("admin.tasdiqlash")}
                      fullWidth={false}
                      loading={approve.isPending}
                      onPress={() => approve.mutate(teacher.id)}
                    />
                  }
                />
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text variant="label" style={styles.cardTitle}>
            Barcha o'qituvchilar ({all.length})
          </Text>

          {all.map((teacher, index) => (
            <View key={teacher.id}>
              {index > 0 ? <Separator /> : null}
              <TeacherRow
                teacher={teacher}
                action={
                  teacher.isApproved ? (
                    <Badge label={t("admin.tasdiqlangan")} tone="success" />
                  ) : (
                    <Badge label={t("admin.kutmoqda")} tone="warning" />
                  )
                }
              />
            </View>
          ))}

          {all.length === 0 ? (
            <Text variant="caption" tone="muted">
              {t("admin.oqituvchi_topilmadi")}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function TeacherRow({ teacher, action }: { teacher: AuthUser; action?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Avatar name={teacher.name} src={teacher.avatarUrl} size="md" />
      <View style={styles.rowBody}>
        <Text variant="label" numberOfLines={1}>
          {teacher.name}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          @{teacher.username}
        </Text>
        <RatingSummary average={teacher.avgRating} count={teacher.ratingCount ?? 0} />
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { flex: 1 },
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 12,
    gap: 4,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 4 },
  cardTitle: { paddingBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  rowBody: { flex: 1, gap: 3 },
});
