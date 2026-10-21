import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  CalendarCheck2,
  FileQuestion,
  ListChecks,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { useCourses } from "@/modules/course";
import { ROLES } from "@/shared/constants";
import { useMemo, useState } from "react";
import { InviteStudentsSheet, NewGroupSheet } from "@/modules/conversation";
import { useLessons } from "@/modules/lesson";
import { AppBar, AppBarAction, Icon, radius, Screen, Text, useTheme, type IconName } from "@/shared/ui";
import { NotificationBell } from "@/modules/notification";

type WorkspaceRole = "teacher" | "student" | "parent";

interface WorkspaceCard {
  id: string;
  icon: LucideIcon;
  /** Berilmasa — "tez orada", bosilmaydi (veb bilan bir xil qoida). */
  to?: string;
  /** Qaysi rollarda ko'rinadi. */
  roles: readonly WorkspaceRole[];
  /**
   * Ikonka kvadratining rangi — vebda har modul o'z rangiga ega.
   * `brand` ko'k, `gold` sariq (AI), `green` yashil.
   */
  tone?: "brand" | "gold" | "green";
  /**
   * Matni `mobile` lug'atidan olinadi.
   *
   * `workspace.json` 🟢 veb bilan bayt-bayt bir xil; vebda bunday
   * kartochka yo'q, shuning uchun uning matni u yerga qo'shilmaydi.
   */
  mobileText?: boolean;
}

/**
 * Ish maydoni — veb `pages/workspace/workspace-page.tsx` porti.
 *
 * ┌─ NEGA BU SAHIFA KERAK ────────────────────────────────────────────────┐
 * │ Veb'da yon panelning uchta bo'limi bor: Chat, Kalendar va Workspace  │
 * │ (`nav.json:rail`). Test, Tahlil, AI va Mock Test — hammasi shu       │
 * │ sahifaning ichida.                                                    │
 * │                                                                       │
 * │ Mobilda Workspace umuman yo'q edi: uning o'rniga to'g'ridan-to'g'ri  │
 * │ "Test" tabi qo'yilgandi. Natijada Tahlil faqat Profil ekranidan,     │
 * │ Mock Test va AI esa HECH QAYERDAN ochilmasdi.                         │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * 🟡 MOSLASH, veb'dan ikki farq bilan:
 *
 *  1. Kartochkalar BIR USTUNLI ro'yxat. Vebda ular to'r bo'lib yonma-yon
 *     turadi; tor ekranda ikki ustunli kartochka matni uch qatorga sinib
 *     o'qilmaydi.
 *
 *  2. OTA-ONA ham bor. Vebda ota-onaning o'z navigatsiyasi oltita
 *     bo'limdan iborat (`parent-layout.tsx`), telefonda esa ularning
 *     ustiga Profil qo'shilib yettita tab chiqardi va yorliqlar
 *     kesilardi ("Davoma…", "Vazifa…"). Ikkinchi darajali to'rttasi shu
 *     yerga yig'ildi.
 *
 * Shu sababli roldan qat'i nazar BIR XIL naqsh: tab qatorida kundalik
 * bo'limlar, qolgani Ish maydonida.
 */
const CARDS: readonly WorkspaceCard[] = [
  // --- o'qituvchi va o'quvchi (veb bilan bir xil) ---
  // Tartib vebdagidek: Test, Vazifalar (faqat o'qituvchi), Tahlil, AI, Mock test.
  { id: "quizzes", icon: FileQuestion, to: "quizzes", roles: ["teacher", "student"] },
  { id: "assignments", icon: ClipboardList, to: "assignments", roles: ["teacher"] },
  { id: "analytics", icon: BarChart3, to: "analytics", roles: ["teacher", "student"] },
  { id: "ai", icon: Sparkles, to: "ai", roles: ["teacher"], tone: "gold" },
  { id: "exams", icon: ClipboardCheck, to: "exams", roles: ["teacher", "student"], tone: "green" },

  // --- ota-ona (mobilga xos, izohi yuqorida) ---
  { id: "attendance", icon: CalendarCheck2, to: "attendance", roles: ["parent"], mobileText: true },
  { id: "homework", icon: ListChecks, to: "homework", roles: ["parent"], mobileText: true },
  { id: "examsChild", icon: ClipboardCheck, to: "exams", roles: ["parent"], mobileText: true, tone: "green" },
  /*
   * Ota-onada matn BOSHQA kalitdan: "natijalaringiz" o'quvchiga aytiladi,
   * ota-ona esa FARZANDINING natijalarini ko'radi.
   */
  { id: "ratingChild", icon: Trophy, to: "grades", roles: ["parent"], mobileText: true },
];

export function WorkspacePage() {
  const { t } = useTranslation("workspace");
  // Mobilga xos kartochkalar matni (izohi `mobileText` da).
  const { t: tm } = useTranslation("mobile");
  const router = useRouter();
  const { user } = useAuth();

  const role: WorkspaceRole =
    user?.role === ROLES.STUDENT ? "student" : user?.role === ROLES.PARENT ? "parent" : "teacher";
  const cards = CARDS.filter((card) => card.roles.includes(role));

  const { palette } = useTheme();

  /* Statistika uchun — vebdagi kabi kurslar ro'yxatidan hisoblanadi. */
  const coursesQuery = useCourses();
  const courses = coursesQuery.data ?? [];
  const studentTotal = courses.reduce((sum, course) => sum + (course.studentCount || 0), 0);

  /*
   * Nisbiy yo'l ("quizzes") joriy rol bo'limiga tegishli: o'qituvchida
   * `/teacher/quizzes`, o'quvchida `/student/quizzes`. Veb ham shunday
   * qiladi (`to: "../quizzes"`), shuning uchun ro'yxat bitta bo'lib
   * qolaveradi.
   */
  const rolePrefix = `/${role}`;
  const isStudent = role === "student";
  const [inviteFor, setInviteFor] = useState<string | null>(null);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const lessons = useLessons({ page_size: 200 }, role === "teacher");
  const monthNames = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];

  const [now] = useState(() => Date.now());

  // Har guruhning eng yaqin darsi — veb `nextLessonByCourse`.
  const nextLessonByCourse = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of [...(lessons.data ?? [])].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )) {
      if (new Date(item.startsAt).getTime() < now || item.status === "finished") continue;
      if (!map.has(item.courseId)) map.set(item.courseId, item.startsAt);
    }
    return map;
  }, [lessons.data, now]);

  function formatNext(value: string | undefined): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${date.getDate()}-${(monthNames[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  return (
    <Screen scroll padded={false}>
      <AppBar title={t("title")}>
        <AppBarAction
          name="search"
          label={t("search")}
          onPress={() => router.push(`${rolePrefix}/search`)}
        />
        <NotificationBell />
      </AppBar>

      <View style={styles.body}>
        {/* Izoh qatori — vebda sarlavha ostida alohida turadi. */}
        <Text variant="label" tone="muted" style={styles.subtitle}>
          {t("subtitle")}
        </Text>

        {/*
          * Statistika kartochkalari — vebdagi kabi uchta: guruhlar soni,
          * o'quvchilar yig'indisi va tekshirilmagan ishlar. Oxirgisi
          * VEBDA HAM shunchaki "—": backend bu sonni bermaydi.
          *
          * Vebda bu qator faqat o'qituvchida va guruh bo'lganda
          * ko'rinadi — shu shart ham ko'chirildi.
          */}
        {role === "teacher" && courses.length > 0 ? (
          <View style={styles.statsRow}>
            <StatCard
              icon={<Icon name="groups" size={18} color={palette["primary-foreground"]} />}
              tone={palette.primary}
              value={String(courses.length)}
              label={t("statGroups")}
            />
            <StatCard
              icon={<Icon name="person" size={18} color={palette["primary-foreground"]} />}
              tone={palette.success}
              value={String(studentTotal)}
              label={t("statStudents")}
            />
            <StatCard
              icon={<Icon name="assign" size={18} color={palette["primary-foreground"]} />}
              tone={palette["saffron-strong"]}
              value="—"
              label={t("statUnchecked")}
            />
          </View>
        ) : null}

        <View style={styles.section}>
        <Text variant="label" style={styles.sectionTitle}>
          {t("modules")}
        </Text>

        {/*
          * IKKI USTUNLI to'r — vebdagi kabi.
          *
          * Ilgari bu bir ustunli ro'yxat edi: "tor ekranda ikki ustunli
          * kartochka matni uch qatorga sinib o'qilmaydi" degan sabab
          * bilan. Vebning yangi dizayni 390px da ikki ustun bilan
          * ishlaydi va matn o'qiladi, shuning uchun u naqsh olindi.
          */}
        <View style={styles.grid}>
          {cards.map((card) => (
            <WorkspaceCard
              key={card.id}
              icon={card.icon}
              tone={card.tone ?? "brand"}
              title={
                card.mobileText ? tm(`workspace.${card.id}.title`) : t(`cards.${card.id}.title`)
              }
              description={
                card.mobileText
                  ? tm(`workspace.${card.id}.description`)
                  : t(`cards.${card.id}.description`)
              }
              soonLabel={card.to ? undefined : t("soon")}
              onPress={
                card.to
                  ? () =>
                      router.push(
                        card.to!.startsWith("/") ? card.to! : `${rolePrefix}/${card.to!}`
                      )
                  : undefined
              }
            />
          ))}
        </View>
        </View>

        {/* Tezkor amallar — veb `QUICK` (faqat o'qituvchi). */}
        {isStudent || role === "parent" ? null : (
          <View style={styles.section}>
            <Text variant="label" style={styles.sectionTitle}>
              {t("quickActions")}
            </Text>
            {QUICK.map((item) => {
              const key = `quick${item.id.charAt(0).toUpperCase()}${item.id.slice(1)}`;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`${rolePrefix}/${item.to}`)}
                  style={({ pressed }) => [
                    styles.quick,
                    { backgroundColor: pressed ? palette["surface-subtle"] : palette.surface, borderColor: palette.border },
                  ]}
                >
                  <View style={[styles.quickIcon, { backgroundColor: palette[item.tone] }]}>
                    <Icon name={item.icon} size={18} color="#ffffff" />
                  </View>
                  <View style={styles.grow}>
                    <Text variant="label" numberOfLines={1}>
                      {t(key)}
                    </Text>
                    <Text variant="caption" numberOfLines={1} style={{ color: palette["subtle-foreground"] }}>
                      {item.id === "grading"
                        ? t("quickGradingUnknown")
                        : item.id === "materials"
                          ? t("quickMaterialsUnknown")
                          : t(`${key}Hint`)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Mening guruhlarim — veb (faqat o'qituvchi). */}
        {isStudent || role === "parent" ? null : courses.length ? (
          <View style={styles.section}>
            <View style={styles.groupsHead}>
              <Text variant="label" style={[styles.sectionTitle, styles.grow]}>
                {t("myGroups")}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => router.push(`${rolePrefix}/chats`)}>
                <Text variant="label" style={{ color: palette.primary }}>
                  {t("allGroups")}
                </Text>
              </Pressable>
            </View>
            {courses.slice(0, 4).map((course) => {
              const next = formatNext(nextLessonByCourse.get(course.id));
              return (
                <View key={course.id} style={[styles.group, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                  <View style={styles.groupHead}>
                    <View style={[styles.groupAvatar, { backgroundColor: palette["primary-soft"] }]}>
                      <Text variant="subheading" style={[styles.groupInitials, { color: palette.primary }]}>
                        {course.title.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.grow}>
                      <Text variant="body" numberOfLines={1} style={styles.groupTitle}>
                        {course.title}
                      </Text>
                      <Text variant="caption" numberOfLines={1} style={{ color: palette["subtle-foreground"] }}>
                        {t("groupMeta", { count: course.studentCount ?? 0 })}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("createGroup")}
                      onPress={() => setInviteFor(course.title)}
                      style={({ pressed }) => [styles.invite, { backgroundColor: palette["primary-soft"], opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Icon name="add" size={18} color={palette.primary} />
                    </Pressable>
                  </View>
                  <View style={styles.progressBlock}>
                    <View style={styles.progressHead}>
                      <Text variant="caption" style={[styles.grow, { color: palette["muted-foreground"] }]}>
                        {t("groupProgress")}
                      </Text>
                      <Text variant="caption" style={styles.strong}>
                        —
                      </Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: palette["surface-subtle"] }]} />
                  </View>
                  <View style={[styles.nextLesson, { backgroundColor: palette["surface-subtle"] }]}>
                    <Icon name="clock" size={15} color={palette["muted-foreground"]} />
                    <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
                      {next ? t("nextLesson", { value: next }) : t("noNextLesson")}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyGroups}>
            <View style={[styles.emptyIcon, { backgroundColor: palette["primary-soft"] }]}>
              <Icon name="groups" size={28} color={palette.primary} />
            </View>
            <Text variant="subheading" style={styles.center}>
              {t("emptyTitle")}
            </Text>
            <Text variant="label" style={[styles.subtitle, styles.center, { color: palette["muted-foreground"] }]}>
              {t("emptyDescription")}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setNewGroupOpen(true)}
              style={({ pressed }) => [styles.emptyAction, { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }]}
            >
              <Icon name="add" size={18} color={palette["primary-foreground"]} />
              <Text variant="label" style={{ color: palette["primary-foreground"] }}>
                {t("createGroup")}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <InviteStudentsSheet open={Boolean(inviteFor)} onClose={() => setInviteFor(null)} title={inviteFor ?? ""} />
      <NewGroupSheet open={newGroupOpen} onClose={() => setNewGroupOpen(false)} />
    </Screen>
  );
}

/** Veb `QUICK` — havolalar vebdagidek (ba'zilari hali vaqtincha manzilga). */
const QUICK: ReadonlyArray<{ id: string; icon: IconName; tone: "primary" | "success" | "saffron-strong" | "destructive"; to: string }> = [
  { id: "homework", icon: "assign", tone: "primary", to: "quizzes" },
  { id: "attendance", icon: "check-circle", tone: "success", to: "analytics" },
  { id: "grading", icon: "done-all", tone: "saffron-strong", to: "quizzes" },
  { id: "materials", icon: "assign", tone: "destructive", to: "quizzes" },
];

/**
 * Statistika kartochkasi — veb to'ridagi uchta element.
 *
 * O'lchamlar veb DOM'idan: kartochka radius 24, chegara 1px, ichki
 * bo'shliq 12, oraliq 8; ikonka kvadrati 36x36 radius 16.
 */
function StatCard({
  icon,
  tone,
  value,
  label,
}: {
  icon: ReactNode;
  tone: string;
  value: string;
  label: string;
}) {
  const { palette } = useTheme();

  return (
    <View
      style={[styles.stat, { backgroundColor: palette.card, borderColor: palette.border }]}
    >
      <View style={[styles.statIcon, { backgroundColor: tone }]}>{icon}</View>
      <Text variant="subheading">{value}</Text>
      <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Modul kartochkasi — veb to'ridagi element.
 *
 * O'lchamlar veb DOM'idan (390px): kartochka radius 24, chegara 1px,
 * ichki bo'shliq 16, oraliq 8; ikonka kvadrati 44x44 radius 16, ichida
 * OQ ikonka; sarlavha 16/24 qalinlik 600; tavsif 14/20 qalinlik 400.
 */
function WorkspaceCard({
  icon: Icon,
  tone,
  title,
  description,
  soonLabel,
  onPress,
}: {
  icon: LucideIcon;
  tone: "brand" | "gold" | "green";
  title: string;
  description: string;
  soonLabel?: string;
  onPress?: () => void;
}) {
  const { palette } = useTheme();

  const toneColor = {
    brand: palette.primary,
    gold: palette["saffron-strong"],
    green: palette["success-strong"],
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
          // "Tez orada" kartochkasi so'niq — bosib bo'lmasligi ko'rinib tursin.
          opacity: !onPress ? 0.55 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: toneColor }]}>
        <Icon size={22} color={palette["primary-foreground"]} />
      </View>

      <Text variant="label" style={styles.cardTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text variant="label" tone="muted" style={styles.cardText}>
        {description}
      </Text>
      {soonLabel ? (
        <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
          {soonLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /* Veb: bo'lim bo'shlig'i 16, elementlar orasi 16. */
  /* Veb: `flex-col gap-6 p-4` */
  body: { padding: 16, gap: 24 },
  section: { gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  strong: { fontWeight: "600" },
  /* `rounded-2xl border bg-surface p-4 gap-3` */
  quick: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  quickIcon: { width: 40, height: 40, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  groupsHead: { flexDirection: "row", alignItems: "baseline", gap: 12 },
  group: { gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  groupAvatar: { width: 44, height: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  groupInitials: { fontSize: 14, lineHeight: 20 },
  groupTitle: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  invite: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  progressBlock: { gap: 6 },
  progressHead: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  progressTrack: { height: 6, borderRadius: radius.full },
  nextLesson: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.xl },
  emptyGroups: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingVertical: 40 },
  emptyIcon: { width: 64, height: 64, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  emptyAction: { marginTop: 4, height: 48, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, borderRadius: radius.full },
  subtitle: { fontWeight: "400" },
  sectionTitle: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  /* Ikki ustun: kartochka kengligi 173, oraliq 12 (390 - 32 = 358). */
  /* Veb: `grid grid-cols-3 gap-2` — oraliq 8 (12 da yorliq kesilardi). */
  statsRow: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    padding: 12,
    gap: 8,
    borderRadius: radius["2xl"],
    borderWidth: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "48%",
    minHeight: 178,
    padding: 16,
    gap: 8,
    borderRadius: radius["2xl"],
    borderWidth: 1,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  cardText: { fontWeight: "400" },
});
