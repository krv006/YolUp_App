import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  FileQuestion,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { ROLES } from "@/shared/constants";
import { radius, Screen, ScreenHeader, Text, useTheme } from "@/shared/ui";

interface WorkspaceCard {
  id: string;
  icon: LucideIcon;
  /** Berilmasa — "tez orada", bosilmaydi (veb bilan bir xil qoida). */
  to?: string;
  studentOnly?: boolean;
  hiddenForStudent?: boolean;
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
 * │ Mock Test va AI esa HECH QAYERDAN ochilmasdi — marshrutlari bor,     │
 * │ havolasi yo'q edi.                                                    │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * 🟡 MOSLASH: vebda kartochkalar to'r (grid) bo'lib yonma-yon turadi.
 * Telefonda ular bir ustunli ro'yxat — tor ekranda ikki ustunli kartochka
 * matni ikki-uch qatorga sinadi va o'qilmaydi.
 */
const CARDS: readonly WorkspaceCard[] = [
  { id: "quizzes", icon: FileQuestion, to: "quizzes" },
  { id: "analytics", icon: BarChart3, to: "/analytics" },
  { id: "ai", icon: Sparkles, to: "ai", hiddenForStudent: true },
  { id: "mock", icon: ClipboardCheck, to: "/mock-tests", studentOnly: true },
];

export function WorkspacePage() {
  const { t } = useTranslation("workspace");
  const router = useRouter();
  const { user } = useAuth();

  const isStudent = user?.role === ROLES.STUDENT;
  const cards = CARDS.filter(
    (card) => (!card.studentOnly || isStudent) && !(card.hiddenForStudent && isStudent)
  );

  /*
   * Nisbiy yo'l ("quizzes") joriy rol bo'limiga tegishli: o'qituvchida
   * `/teacher/quizzes`, o'quvchida `/student/quizzes`. Veb ham shunday
   * qiladi (`to: "../quizzes"`), shuning uchun ro'yxat bitta bo'lib
   * qolaveradi.
   */
  const rolePrefix = isStudent ? "/student" : "/teacher";

  return (
    <Screen scroll>
      <ScreenHeader title={t("title")} subtitle={t("subtitle")} subtitleLines={2} />

      <View style={styles.list}>
        {cards.map((card) => (
          <WorkspaceRow
            key={card.id}
            icon={card.icon}
            title={t(`cards.${card.id}.title`)}
            description={t(`cards.${card.id}.description`)}
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
