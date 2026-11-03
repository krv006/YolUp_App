import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import type { AttentionItem } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatDayTime } from "@/shared/lib";
import { DsText, dsRadius, Icon, useDs, type DsColor, type IconName } from "@/shared/ui";

const DAY_MS = 86_400_000;

/**
 * "E'tibor talab qiladi" — veb `home-side.tsx` `AttentionCard`: yaqin
 * muddatli vazifa, notanish qurilmadan kirish va yangi imtihon natijasi;
 * har biri o'z bo'limini ochadi.
 */
export function AttentionCard({ items, childId, now }: { items: AttentionItem[]; childId: string; now: number }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const today = new Date(now).toDateString();
  const tomorrow = new Date(now + DAY_MS).toDateString();
  const go = (href: string) => router.push(href as never, { withAnchor: true });

  return (
    <View style={styles.section}>
      <DsText v="title">{t("home.attention.title")}</DsText>
      <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
        {items.length ? (
          items.map((item, index) => {
            let icon: IconName;
            let tone: { bg: DsColor; fg: DsColor };
            let title: string;
            let meta: string;
            let open: () => void;
            if (item.kind === "homework") {
              const due = item.assignment.dueAt ?? "";
              const dueDay = new Date(due).toDateString();
              icon = "hourglass-empty";
              tone = { bg: "accent-saffron-bg", fg: "accent-saffron-fg" };
              title =
                dueDay === today
                  ? t("home.attention.homeworkToday")
                  : dueDay === tomorrow
                    ? t("home.attention.homeworkTomorrow")
                    : t("home.attention.homeworkSoon");
              meta = `${item.assignment.title} · ${formatDayTime(due)}`;
              open = () => router.navigate(ROUTES.parent.homework as never);
            } else if (item.kind === "login") {
              icon = "shield";
              tone = { bg: "danger-bg", fg: "error-text" };
              title = t("home.attention.login");
              meta = `${item.device} · ${formatDayTime(item.at)}`;
              open = () => go(ROUTES.parent.childLogins(childId));
            } else {
              icon = "emoji-events";
              tone = { bg: "accent-blue-bg", fg: "accent-blue-fg" };
              title = t("home.attention.exam");
              meta = t("home.attention.examMeta", { title: item.exam.title });
              open = () => router.navigate(ROUTES.parent.exams as never);
            }
            return (
              <Pressable
                key={`${item.kind}-${index}`}
                accessibilityRole="button"
                onPress={open}
                style={({ pressed }) => [styles.row, index < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }, pressed && { backgroundColor: ds.c.subtle }]}
              >
                <View style={[styles.icon, { backgroundColor: ds.c[tone.bg] }]}>
                  <Icon name={icon} size={20} color={ds.c[tone.fg]} />
                </View>
                <View style={styles.text}>
                  <DsText v="body" w="600" numberOfLines={1}>
                    {title}
                  </DsText>
                  <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                    {meta}
                  </DsText>
                </View>
                <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
              </Pressable>
            );
          })
        ) : (
          <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
            {t("home.attention.empty")}
          </DsText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  /* `flex flex-col overflow-hidden rounded-[20px] bg-surface` */
  list: { overflow: "hidden", borderRadius: 20 },
  /* `flex items-center gap-3 px-4 py-3.5` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  icon: { width: 40, height: 40, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0, gap: 2 },
  empty: { paddingHorizontal: 16, paddingVertical: 28, textAlign: "center" },
});
