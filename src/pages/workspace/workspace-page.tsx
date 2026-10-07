import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  BarChart3,
  ClipboardCheck,
  CalendarCheck2,
  ChevronRight,
  FileQuestion,
  ListChecks,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { ROLES } from "@/shared/constants";
import { radius, Screen, ScreenHeader, Text, useTheme } from "@/shared/ui";

type WorkspaceRole = "teacher" | "student" | "parent";

interface WorkspaceCard {
  id: string;
  icon: LucideIcon;
  /** Berilmasa — "tez orada", bosilmaydi (veb bilan bir xil qoida). */
  to?: string;
  /** Qaysi rollarda ko'rinadi. */
  roles: readonly WorkspaceRole[];
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
  { id: "quizzes", icon: FileQuestion, to: "quizzes", roles: ["teacher", "student"] },
  { id: "exams", icon: ClipboardCheck, to: "exams", roles: ["teacher", "student"] },
  { id: "analytics", icon: BarChart3, to: "/analytics", roles: ["teacher", "student"] },
  { id: "ai", icon: Sparkles, to: "ai", roles: ["teacher"] },

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

  /*
   * Nisbiy yo'l ("quizzes") joriy rol bo'limiga tegishli: o'qituvchida
   * `/teacher/quizzes`, o'quvchida `/student/quizzes`. Veb ham shunday
   * qiladi (`to: "../quizzes"`), shuning uchun ro'yxat bitta bo'lib
   * qolaveradi.
   */
  const rolePrefix = `/${role}`;

  return (
    <Screen scroll>
      <ScreenHeader title={t("title")} subtitle={t("subtitle")} subtitleLines={2} />

      <View style={styles.list}>
        {cards.map((card) => (
          <WorkspaceRow
            key={card.id}
            icon={card.icon}
            title={
              card.mobileText
                ? tm(`workspace.${card.id}.title`)
                : t(`cards.${card.id}.title`)
            }
            description={
              card.mobileText
                ? tm(`workspace.${card.id}.description`)
                : t(`cards.${card.id}.description`)
            }
            soonLabel={card.to ? undefined : t("soon")}
            onPress={
              card.to
                ? () => router.push(card.to!.startsWith("/") ? card.to! : `${rolePrefix}/${card.to!}`)
                : undefined
            }
          />
        ))}
      </View>
    </Screen>
  );
}

function WorkspaceRow({
  icon: Icon,
  title,
  description,
  soonLabel,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  soonLabel?: string;
  onPress?: () => void;
}) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
          // "Tez orada" kartochkasi so'niq — bosib bo'lmasligi ko'rinib tursin.
          opacity: !onPress ? 0.55 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: palette["primary-tint"] }]}>
        <Icon size={20} color={palette["primary-text"]} />
      </View>

      <View style={styles.body}>
        <Text variant="label">{title}</Text>
        <Text variant="caption" tone="muted">
          {description}
        </Text>
        {soonLabel ? (
          <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
            {soonLabel}
          </Text>
        ) : null}
      </View>

      {onPress ? <ChevronRight size={18} color={palette["muted-foreground"]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, paddingTop: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2 },
});
