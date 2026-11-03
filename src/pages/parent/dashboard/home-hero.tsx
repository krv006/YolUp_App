import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { parentHome, type HeroState, type WeekSummary } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized } from "@/shared/lib";
import type { AttendanceRow } from "@/shared/types";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";
import { clock, lessonEnd } from "./home-format";

export interface HomeHeroProps {
  childName: string;
  hero: HeroState;
  week: WeekSummary;
  todayCount: number;
  teachers: Map<string, string>;
  now: number;
}

/**
 * Ko'k bosh karta — veb `home-hero.tsx` ning `compact` shoxi: holat chipi
 * (jonli dars / bugun / bo'sh kun), sarlavha, dars ma'lumoti, jonli darsda
 * fokus chizig'i yoki hafta kunlari, pastda xulosa va "Batafsil".
 */
export function HomeHero({ childName, hero, week, todayCount, teachers, now }: HomeHeroProps) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const first = childName.split(" ")[0] || childName;

  let chip: { label: string; live?: boolean };
  let title: string;
  let meta: string;
  let liveRow: AttendanceRow | null = null;

  if (hero.kind === "live") {
    const minutes = Math.max(0, Math.floor((now - Date.parse(hero.lesson.startsAt)) / 60_000));
    chip = { label: t("home.hero.liveChip", { count: minutes }), live: true };
    title = hero.row ? t("home.hero.liveTitle", { name: first }) : t("home.hero.liveNotJoined", { name: first });
    meta = [
      hero.lesson.courseTitle,
      hero.row?.joinedAt ? t("home.hero.joinedAt", { time: clock(hero.row.joinedAt) }) : `${clock(hero.lesson.startsAt)} – ${clock(lessonEnd(hero.lesson))}`,
      teachers.get(hero.lesson.courseId),
    ]
      .filter(Boolean)
      .join(" · ");
    liveRow = hero.row;
  } else if (hero.kind === "today") {
    chip = { label: t("home.hero.todayChip", { time: clock(hero.focus.startsAt) }) };
    title = t("home.hero.todayTitle", { name: first, count: todayCount });
    meta = [hero.focus.courseTitle, `${clock(hero.focus.startsAt)} – ${clock(lessonEnd(hero.focus))}`, teachers.get(hero.focus.courseId)]
      .filter(Boolean)
      .join(" · ");
  } else {
    chip = { label: t("home.hero.freeChip") };
    title = t("home.hero.freeTitle", { name: first });
    meta = hero.next
      ? t("home.hero.nextLesson", {
          day: formatLocalized(hero.next.startsAt, t("home.dayPattern")),
          time: clock(hero.next.startsAt),
          course: hero.next.courseTitle,
        })
      : t("home.hero.noUpcoming");
  }

  const focus = liveRow ? parentHome.liveFocusPercent(liveRow, now) : null;

  return (
    // `relative flex flex-col gap-4 overflow-hidden rounded-3xl (24px) bg-brand p-5 text-on-action`
    <View style={[styles.card, { backgroundColor: ds.c.brand }]}>
      <View pointerEvents="none" style={[styles.blobTop, { backgroundColor: ds.c["on-brand-subtle"] }]} />
      <View pointerEvents="none" style={[styles.blobBottom, { backgroundColor: ds.c["on-brand-subtle"] }]} />
      <View style={styles.head}>
        <View style={[styles.chip, { backgroundColor: chip.live ? ds.c.surface : ds.c["on-brand-subtle"] }]}>
          {chip.live ? <View style={[styles.liveDot, { backgroundColor: ds.c.danger }]} /> : <Icon name="schedule" size={14} color={ds.c["on-action"]} />}
          <DsText v="caption-strong" c={chip.live ? "error-text" : "on-action"}>
            {chip.label}
          </DsText>
        </View>
        <DsText v="h2" heading w="600" c="on-action" style={styles.title}>
          {title}
        </DsText>
        <DsText v="body-sm" c="on-action" style={styles.meta}>
          {meta}
        </DsText>
      </View>
      {liveRow ? <LiveFocus focus={focus} /> : <WeekStrip week={week} now={now} />}
      <View style={styles.footer}>
        <DsText v="body-sm" c="on-action" style={styles.summary}>
          {liveRow?.joinedAt ? t("mobile.hero.joined", { time: clock(liveRow.joinedAt) }) : t("home.hero.weekSummary", { attended: week.attended, total: week.total })}
        </DsText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate(ROUTES.parent.attendance as never)}
          style={({ pressed }) => [styles.action, { backgroundColor: ds.c.surface, opacity: pressed ? 0.9 : 1 }]}
        >
          <DsText v="button">{liveRow ? t("mobile.hero.watch") : t("mobile.hero.details")}</DsText>
        </Pressable>
      </View>
    </View>
  );
}

/** Jonli darsdagi fokus — `rounded-2xl bg-on-brand-subtle p-4`, `h-2` chiziq. */
function LiveFocus({ focus }: { focus: number | null }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  return (
    <View style={[styles.focus, { backgroundColor: ds.c["on-brand-subtle"] }]}>
      <View style={styles.focusHead}>
        <DsText v="body-sm" c="on-action">
          {t("home.hero.focusTitle")}
        </DsText>
        <DsText v="title" c="on-action">
          {focus === null ? "—" : `${focus}%`}
        </DsText>
      </View>
      <View style={[styles.track, { backgroundColor: ds.c["on-brand-subtle"] }]}>
        <View style={[styles.fillBar, { width: `${focus ?? 0}%`, backgroundColor: ds.c.success }]} />
      </View>
    </View>
  );
}

const DOT: Record<string, { bg?: "success" | "saffron" | "danger" | "on-brand-subtle"; icon?: "check" | "schedule" | "close"; today?: boolean }> = {
  attended: { bg: "success", icon: "check" },
  late: { bg: "saffron", icon: "schedule" },
  missed: { bg: "danger", icon: "close" },
  today: { today: true },
  none: { bg: "on-brand-subtle" },
};

/** Hafta kunlari — `grid grid-cols-7 gap-1.5 rounded-2xl bg-on-brand-subtle p-3`, kun `size-8`. */
function WeekStrip({ week, now }: { week: WeekSummary; now: number }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const labels = t("home.hero.weekdays", { returnObjects: true }) as string[];
  const today = new Date(now).toDateString();
  return (
    <View style={[styles.week, { backgroundColor: ds.c["on-brand-subtle"] }]}>
      {week.days.map((day, index) => {
        const dot = DOT[day.state] ?? DOT.none;
        const isToday = day.date.toDateString() === today;
        return (
          <View key={day.date.toISOString()} style={styles.day} accessibilityLabel={`${labels[index] ?? ""} · ${t(`home.hero.dayState.${day.state}`)}`}>
            <DsText v="caption" w={isToday ? "600" : "500"} c="on-action" style={isToday ? null : styles.dim}>
              {labels[index]}
            </DsText>
            <View
              style={[
                styles.dot,
                dot.today ? { borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(255, 255, 255, 0.6)" } : { backgroundColor: ds.c[dot.bg ?? "on-brand-subtle"] },
              ]}
            >
              {dot.icon ? <Icon name={dot.icon} size={16} color={ds.c["on-action"]} /> : null}
              {dot.today ? <View style={styles.todayDot} /> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16, overflow: "hidden", padding: 20, borderRadius: 24 },
  /* `absolute -top-20 -right-16 size-56` va `-bottom-10 -left-12 size-28` doiralar */
  blobTop: { position: "absolute", top: -80, right: -64, width: 224, height: 224, borderRadius: 112 },
  blobBottom: { position: "absolute", bottom: -40, left: -48, width: 112, height: 112, borderRadius: 56 },
  head: { gap: 8 },
  chip: { alignSelf: "flex-start", height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: dsRadius.full },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  title: { lineHeight: 28 },
  meta: { opacity: 0.85 },
  focus: { gap: 12, padding: 16, borderRadius: dsRadius["2xl"] },
  focusHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  track: { height: 8, overflow: "hidden", borderRadius: 4 },
  fillBar: { height: "100%", borderRadius: 4 },
  week: { flexDirection: "row", gap: 6, padding: 12, borderRadius: dsRadius["2xl"] },
  day: { flex: 1, alignItems: "center", gap: 8 },
  dim: { opacity: 0.85 },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255, 255, 255, 0.7)" },
  footer: { flexDirection: "row", alignItems: "center", gap: 12 },
  summary: { flex: 1, minWidth: 0, opacity: 0.9 },
  action: { height: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: dsRadius.full },
});
