import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth, useIsStudent } from "@/modules/auth";
import { SupportDialog, useHelpFaq, useHelpVideos, type FaqItem } from "@/modules/support";
import { ROUTES } from "@/shared/config";
import { storage } from "@/shared/lib";
import { DsText, dsRadius, MobileListCard, MobileListRow, MobileSearchField, MobileSectionTitle, Sheet, useDs, type IconName } from "@/shared/ui";
import { ProfileSubPage } from "./profile-shell";
import { SETTINGS_TONES } from "./settings-tones";

const FAQ_TONE = "bg-brand-subtle text-ink";

interface HelpItem {
  id: string;
  icon: IconName;
  tone: string;
  title: string;
  hint: string;
  action: () => void;
}

function duration(seconds: number | null): string {
  if (!seconds) return "";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Yordam markazi — veb `help-center-page.tsx`: qidiruv, ko'p so'raladigan
 * savollar (backenddagilari javob oynasini, qo'llanmalar tegishli bo'limni
 * ochadi), video qo'llanmalar, qo'llab-quvvatlashga murojaat (`?ticket=`
 * bilan bildirishnomadan to'g'ridan-to'g'ri yozishma) va o'qituvchida
 * tanishuvni qayta ko'rsatish.
 */
export function HelpCenterPage() {
  const { t } = useTranslation("account");
  const ds = useDs();
  const router = useRouter();
  const { user } = useAuth();
  const student = useIsStudent();
  const params = useLocalSearchParams<{ ticket?: string }>();
  const [query, setQuery] = useState("");
  const [faq, setFaq] = useState<FaqItem | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const faqItems = useHelpFaq();
  const videos = useHelpVideos();
  const ticketId = params.ticket ?? null;
  const go = (href: string) => router.navigate(href as never);
  const item = (id: string, icon: IconName, tone: string, action: () => void): HelpItem => ({
    id,
    icon,
    tone,
    title: t(`help.items.${id}.title`),
    hint: t(`help.items.${id}.hint`),
    action,
  });

  const guides: HelpItem[] = student
    ? [
        item("joinLesson", "help", FAQ_TONE, () => go(ROUTES.student.schedule)),
        item("joinGroup", "person-add", FAQ_TONE, () => go(ROUTES.student.chats)),
        item("submitHomework", "task-alt", FAQ_TONE, () => go(ROUTES.student.homework)),
        item("takeTest", "quiz", FAQ_TONE, () => go(ROUTES.student.tests)),
      ]
    : [
        item("startLesson", "help", FAQ_TONE, () => go(ROUTES.teacher.dashboard)),
        item("addStudent", "person-add", FAQ_TONE, () => go(ROUTES.teacher.chats)),
        item("checkHomework", "task-alt", FAQ_TONE, () => router.push(ROUTES.teacher.homework as never, { withAnchor: true })),
      ];

  const remoteFaq: HelpItem[] = (faqItems.data ?? []).map((entry) => ({
    id: `faq-${entry.id}`,
    icon: "help",
    tone: FAQ_TONE,
    title: entry.question,
    hint: entry.answer.replace(/\s+/g, " ").slice(0, 90),
    action: () => setFaq(entry),
  }));

  const videoItems: HelpItem[] = (videos.data ?? []).map((entry) => ({
    id: `video-${entry.id}`,
    icon: "play-circle-fill",
    tone: SETTINGS_TONES.violet,
    title: entry.title,
    hint: duration(entry.durationSeconds) || t("help.videoHint"),
    action: () => void Linking.openURL(entry.url),
  }));

  const sections: Array<{ id: string; items: HelpItem[] }> = [
    { id: "faq", items: [...remoteFaq, ...guides] },
    { id: "videos", items: videoItems },
    {
      id: "contact",
      items: [
        item("support", "forum", SETTINGS_TONES.success, () => setSupportOpen(true)),
        ...(student
          ? []
          : [
              item("tour", "school", SETTINGS_TONES.success, () => {
                storage.remove(`yolup:onboarding:${user?.id ?? ""}`);
                go(ROUTES.teacher.dashboard);
              }),
            ]),
      ],
    },
  ];

  const term = query.trim().toLowerCase();
  const visible = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((entry) => !term || `${entry.title} ${entry.hint}`.toLowerCase().includes(term)),
    }))
    .filter((section) => section.items.length);

  function closeSupport(open: boolean) {
    if (open) return;
    setSupportOpen(false);
    if (ticketId) router.setParams({ ticket: undefined });
  }

  return (
    <ProfileSubPage title={t("page.helpTitle")}>
      <View style={styles.body}>
        <MobileSearchField value={query} onChange={setQuery} placeholder={t("help.search")} clearLabel={t("page.cancel")} />

        {visible.map((section) => (
          <View key={section.id} style={styles.section}>
            <MobileSectionTitle>{t(`help.sections.${section.id}`)}</MobileSectionTitle>
            <MobileListCard>
              {section.items.map((entry, index) => (
                <MobileListRow
                  key={entry.id}
                  icon={entry.icon}
                  tone={entry.tone}
                  title={entry.title}
                  subtitle={entry.hint}
                  last={index === section.items.length - 1}
                  onPress={entry.action}
                />
              ))}
            </MobileListCard>
          </View>
        ))}

        {visible.length ? null : (
          <View style={[styles.empty, { backgroundColor: ds.c.surface }]}>
            <DsText v="body-sm" c="ink-secondary" style={styles.center}>
              {t("help.empty")}
            </DsText>
          </View>
        )}
      </View>

      <Sheet variant="app" open={Boolean(faq)} onClose={() => setFaq(null)} title={faq?.question ?? ""}>
        <DsText v="body-sm">{faq?.answer}</DsText>
      </Sheet>

      <SupportDialog open={supportOpen || Boolean(ticketId)} onOpenChange={closeSupport} ticketId={ticketId} />
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  body: { gap: 20 },
  section: { gap: 14 },
  empty: { paddingHorizontal: 16, paddingVertical: 24, borderRadius: dsRadius.xl },
});
