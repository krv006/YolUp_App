import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useIsStudent } from "@/modules/auth";
import { ROUTES } from "@/shared/config";
import { storage } from "@/shared/lib";
import { DsText, dsRadius, MobileListCard, MobileListRow, MobileSearchField, MobileSectionTitle, toast, useDs, type IconName } from "@/shared/ui";
import { ProfileSubPage } from "./profile-shell";
import { SETTINGS_TONES } from "./settings-tones";

const FAQ_TONE = "bg-brand-subtle text-ink";

interface HelpItem {
  id: string;
  icon: IconName;
  tone: string;
  action: () => void;
}

/**
 * Yordam markazi — veb `help-center-page.tsx`: qidiruv, ko'p so'raladigan
 * savollar (tegishli bo'limni ochadi), video qo'llanmalar, aloqa va
 * o'qituvchida tanishuvni qayta ko'rsatish.
 */
export function HelpCenterPage() {
  const { t } = useTranslation("account");
  const ds = useDs();
  const router = useRouter();
  const { user } = useAuth();
  const student = useIsStudent();
  const [query, setQuery] = useState("");
  const soon = () => toast.info(t("help.soon"));
  const go = (href: string) => router.navigate(href as never);

  const sections: Array<{ id: string; items: HelpItem[] }> = [
    {
      id: "faq",
      items: student
        ? [
            { id: "joinLesson", icon: "help", tone: FAQ_TONE, action: () => go(ROUTES.student.schedule) },
            { id: "joinGroup", icon: "person-add", tone: FAQ_TONE, action: () => go(ROUTES.student.chats) },
            { id: "submitHomework", icon: "task-alt", tone: FAQ_TONE, action: () => go(ROUTES.student.homework) },
            { id: "takeTest", icon: "quiz", tone: FAQ_TONE, action: () => go(ROUTES.student.tests) },
          ]
        : [
            { id: "startLesson", icon: "help", tone: FAQ_TONE, action: () => go(ROUTES.teacher.dashboard) },
            { id: "addStudent", icon: "person-add", tone: FAQ_TONE, action: () => go(ROUTES.teacher.chats) },
            { id: "checkHomework", icon: "task-alt", tone: FAQ_TONE, action: () => router.push(ROUTES.teacher.homework as never, { withAnchor: true }) },
          ],
    },
    { id: "videos", items: [{ id: "intro", icon: "play-circle-fill", tone: SETTINGS_TONES.violet, action: soon }] },
    {
      id: "contact",
      items: [
        { id: "support", icon: "forum", tone: SETTINGS_TONES.success, action: soon },
        ...(student
          ? []
          : [
              {
                id: "tour",
                icon: "school" as IconName,
                tone: SETTINGS_TONES.success,
                action: () => {
                  storage.remove(`yolup:onboarding:${user?.id ?? ""}`);
                  go(ROUTES.teacher.dashboard);
                },
              },
            ]),
      ],
    },
  ];

  const term = query.trim().toLowerCase();
  const visible = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !term || `${t(`help.items.${item.id}.title`)} ${t(`help.items.${item.id}.hint`)}`.toLowerCase().includes(term)),
    }))
    .filter((section) => section.items.length);

  return (
    <ProfileSubPage title={t("page.helpTitle")}>
      <View style={styles.body}>
        <MobileSearchField value={query} onChange={setQuery} placeholder={t("help.search")} clearLabel={t("page.cancel")} />

        {visible.map((section) => (
          <View key={section.id} style={styles.section}>
            <MobileSectionTitle>{t(`help.sections.${section.id}`)}</MobileSectionTitle>
            <MobileListCard>
              {section.items.map((item, index) => (
                <MobileListRow
                  key={item.id}
                  icon={item.icon}
                  tone={item.tone}
                  title={t(`help.items.${item.id}.title`)}
                  subtitle={t(`help.items.${item.id}.hint`)}
                  last={index === section.items.length - 1}
                  onPress={item.action}
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
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  body: { gap: 20 },
  section: { gap: 14 },
  empty: { paddingHorizontal: 16, paddingVertical: 24, borderRadius: dsRadius.xl },
});
