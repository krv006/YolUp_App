import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  LogOut,
  Send,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { useAttendancePage } from "@/modules/attendance";
import { useAuth } from "@/modules/auth";
import { useCoursePage } from "@/modules/course";
import { useLessonPage } from "@/modules/lesson";
import { SendNotificationSheet, useUnreadNotificationCount } from "@/modules/notification";
import { can, PERMISSIONS } from "@/modules/permission";
import { ROUTES } from "@/shared/config";
import {
  Button,
  CountBadge,
  IconButton,
  ListItem,
  radius,
  Screen,
  ScreenLoading,
  Separator,
  Text,
  useTheme,
} from "@/shared/ui";

/**
 * Administrator paneli — veb `admin-dashboard-page.tsx` porti.
 *
 * Reja (§6.1) admin bo'limini mobilga chiqarmaslikni tavsiya qilgan edi:
 * ko'p ustunli jadval telefonda o'qilmaydi. Amalda esa panelning O'ZI
 * uchta raqam va qisqa ro'yxatdan iborat — u telefonga bemalol sig'adi.
 * Chiqarilmagani faqat KENG jadvallar: to'liq kurs boshqaruvi veb'da qoladi.
 */
export function AdminDashboardPage() {
  const router = useRouter();
  const { palette } = useTheme();
  const { user, logout } = useAuth();
  const [sendOpen, setSendOpen] = useState(false);

  const courses = useCoursePage({ page_size: 10 });
  const lessons = useLessonPage({ page_size: 10 });
  const attendance = useAttendancePage({ page_size: 10 });
  const unread = useUnreadNotificationCount();

  const loading = courses.isLoading || lessons.isLoading || attendance.isLoading;
  const hasError = courses.isError || lessons.isError || attendance.isError;

  async function signOut() {
    await logout();
    router.replace(ROUTES.auth.login);
  }

  function refresh() {
    void courses.refetch();
    void lessons.refetch();
    void attendance.refetch();
  }

  if (loading) {
    return (
      <Screen>
        <ScreenLoading label="Panel yuklanmoqda…" />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={courses.isRefetching}
            onRefresh={refresh}
            tintColor={palette["muted-foreground"]}
          />
        }
      >
        <View style={styles.head}>
          <View style={styles.headBody}>
            <View style={styles.eyebrow}>
              <ShieldCheck size={13} color={palette["primary-text"]} />
              <Text variant="caption" tone="brand">
                ADMINISTRATOR
              </Text>
            </View>
            <Text variant="heading">{user?.name}</Text>
          </View>
          <IconButton
            accessibilityLabel="Bildirishnomalar"
            onPress={() => router.push("/notifications")}
          >
            <Bell size={20} color={palette["muted-foreground"]} />
            {(unread.data ?? 0) > 0 ? (
              <View style={styles.bellBadge}>
                <CountBadge count={unread.data ?? 0} />
              </View>
            ) : null}
          </IconButton>
        </View>

        {/*
         * Ba'zi ro'yxatlar super-admin ruxsatini talab qiladi. Xato bo'lsa
         * ekran bo'sh qolmaydi — sabab aytiladi, qolgani ko'rinaveradi.
         */}
        {hasError ? (
          <View style={[styles.notice, { backgroundColor: palette["warning-soft"] }]}>
            <Text variant="caption" style={{ color: palette["warning-strong"] }}>
              Ayrim ma'lumotlarni yuklash uchun ruxsat yetarli emas.
            </Text>
          </View>
        ) : null}

        <View style={styles.metrics}>
          <Metric
            icon={BookOpen}
            value={courses.data?.total ?? courses.data?.items.length ?? 0}
            label="Kurslar"
            tone="blue"
          />
          <Metric
            icon={CalendarDays}
            value={lessons.data?.total ?? lessons.data?.items.length ?? 0}
            label="Darslar"
            tone="violet"
          />
          <Metric
            icon={CheckCircle2}
            value={attendance.data?.total ?? attendance.data?.items.length ?? 0}
            label="Davomat"
            tone="emerald"
          />
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <ListItem
            title="O'qituvchilar"
            subtitle="Tasdiqlash va reyting"
            leading={<UsersRound size={20} color={palette["muted-foreground"]} />}
            chevron
            onPress={() => router.push(ROUTES.admin.teachers)}
          />
          {can(user, PERMISSIONS.NOTIFICATION_SEND) ? (
            <>
              <Separator inset={52} />
              <ListItem
                title="Xabar yuborish"
                subtitle="Barcha yoki tanlangan foydalanuvchilarga"
                leading={<Send size={20} color={palette["muted-foreground"]} />}
                chevron
                onPress={() => setSendOpen(true)}
              />
            </>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text variant="label" style={styles.cardTitle}>
            So'nggi kurslar
          </Text>
          {(courses.data?.items ?? []).map((course, index) => (
            <View key={course.id}>
              {index > 0 ? <Separator /> : null}
              <View style={styles.courseRow}>
                <View style={styles.courseBody}>
                  <Text variant="label" numberOfLines={1}>
                    {course.title}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {course.subject} · {course.teacher}
                  </Text>
                </View>
                <Text variant="caption" tone="muted">
                  {course.students}
                </Text>
              </View>
            </View>
          ))}
          {(courses.data?.items ?? []).length === 0 ? (
            <Text variant="caption" tone="muted">
              Kurs topilmadi.
            </Text>
          ) : null}
        </View>

        <Button
          title="Chiqish"
          variant="secondary"
          icon={<LogOut size={16} color={palette["secondary-foreground"]} />}
          onPress={() => void signOut()}
        />
      </ScrollView>

      <SendNotificationSheet open={sendOpen} onClose={() => setSendOpen(false)} />
    </Screen>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  tone: "blue" | "violet" | "emerald";
}) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.metric,
        { backgroundColor: palette[`tone-${tone}-bg`], borderColor: palette.border },
      ]}
    >
      <Icon size={20} color={palette[`tone-${tone}-fg`]} />
      <Text variant="subheading">{value}</Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  head: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 8 },
  headBody: { flex: 1, gap: 2 },
  eyebrow: { flexDirection: "row", alignItems: "center", gap: 5 },
  bellBadge: { position: "absolute", top: 4, right: 2 },
  notice: { padding: 12, borderRadius: radius.sm },
  metrics: { flexDirection: "row", gap: 10 },
  metric: {
    flex: 1,
    gap: 4,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 4,
    overflow: "hidden",
  },
  cardTitle: { padding: 12 },
  courseRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  courseBody: { flex: 1, gap: 2 },
});
