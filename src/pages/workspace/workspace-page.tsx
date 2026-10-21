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
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { useCourses } from "@/modules/course";
import { ROLES } from "@/shared/constants";
import { AppBar, AppBarAction, radius, Screen, Text, useTheme } from "@/shared/ui";
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
 *  2. OTA-ONA ham bor. Vebda ota-onaning o'z navigatsiyasi beshta
 *     bo'limdan iborat (`parent-layout.tsx`), telefonda esa ularning
 *     ustiga Profil qo'shilib oltita tab chiqardi va yorliqlar
 *     kesilardi ("Davoma…", "Vazifa…"). Ikkinchi darajali uchtasi shu
 *     yerga yig'ildi.
 *
 * Shu sababli roldan qat'i nazar BIR XIL naqsh: tab qatorida kundalik
 * bo'limlar, qolgani Ish maydonida.
 */
const CARDS: readonly WorkspaceCard[] = [
  // --- o'qituvchi va o'quvchi (veb bilan bir xil) ---
  // Tartib vebdagidek: Test, Vazifalar, Tahlil, AI, Mock test.
  // "Vazifalar" (o'qituvchi) Uy vazifalari bosqichida o'z sahifasi bilan
  // qo'shiladi — vebda u butun `HomeworkWorkspace` vidjetini ochadi.
  { id: "quizzes", icon: FileQuestion, to: "quizzes", roles: ["teacher", "student"] },
  { id: "analytics", icon: BarChart3, to: "analytics", roles: ["teacher", "student"] },
  { id: "ai", icon: Sparkles, to: "ai", roles: ["teacher"], tone: "gold" },
  { id: "exams", icon: ClipboardCheck, to: "exams", roles: ["teacher", "student"], tone: "green" },

  // --- ota-ona (mobilga xos, izohi yuqorida) ---
  { id: "attendance", icon: CalendarCheck2, to: "attendance", roles: ["parent"], mobileText: true },
  { id: "homework", icon: ListChecks, to: "homework", roles: ["parent"], mobileText: true },
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
        {role !== "student" && courses.length > 0 ? (
          <View style={styles.statsRow}>
            <StatCard
              icon={<UsersRound size={18} color={palette["primary-foreground"]} />}
              tone={palette.primary}
              value={String(courses.length)}
              label={t("statGroups")}
            />
            <StatCard
              icon={<UserRound size={18} color={palette["primary-foreground"]} />}
              tone={palette.success}
              value={String(studentTotal)}
              label={t("statStudents")}
            />
            <StatCard
              icon={<ClipboardList size={18} color={palette["primary-foreground"]} />}
              tone={palette["saffron-strong"]}
              value="—"
              label={t("statUnchecked")}
            />
          </View>
        ) : null}

        <Text variant="label" style={styles.sectionTitle}>
          {tm("workspace.modullar")}
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
    </Screen>
  );
}

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
      <Text variant="heading">{value}</Text>
      <Text variant="label" tone="muted" numberOfLines={1} style={styles.cardText}>
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
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
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
