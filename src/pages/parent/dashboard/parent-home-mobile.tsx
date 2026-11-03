import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Circle, Line } from "react-native-svg";
import { AddChildDialog, CreateChildDialog, LinkChildDialog, type ParentLink } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatDayTime, formatLocalized, formatRelativeShort } from "@/shared/lib";
import { Avatar, DsText, dsRadius, Icon, useDs, type DsColor, type IconName } from "@/shared/ui";
import { ChildChips, ParentErrorBanner, ParentLockedCard, ParentMobileHeader, ParentScreen } from "@/widgets/parent-shell";
import { HomeHero } from "./home-hero";
import { HomeRecent } from "./home-recent";
import { AttentionCard } from "./home-side";
import { PendingLinkActions } from "./pending-link-actions";
import { useParentHome } from "./use-parent-home";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type HomeView = NonNullable<ReturnType<typeof useParentHome>["view"]>;

/** O'zgarish chipi — `rounded-full px-2 py-0.5 text-caption-strong`, o'sishda yashil. */
function Delta({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  const ds = useDs();
  if (!value) return null;
  const up = value > 0;
  return (
    <View style={[styles.delta, { backgroundColor: ds.c[up ? "success-bg" : "danger-bg"] }]}>
      <Icon name="trending-up" size={14} color={ds.c[up ? "success-text" : "error-text"]} />
      <DsText v="caption-strong" c={up ? "success-text" : "error-text"}>
        {up ? "+" : ""}
        {value}
        {suffix}
      </DsText>
    </View>
  );
}

/** Statistika — chapda davomat halqasi (ikki qator), o'ngda o'rtacha ball va vazifalar. */
function MobileStats({ view, now }: { view: HomeView; now: number }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const percent = view.month.percent;
  return (
    <View style={styles.stats}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.navigate(ROUTES.parent.attendance as never)}
        style={({ pressed }) => [styles.statTall, { backgroundColor: ds.c.surface }, pressed && styles.pressed]}
      >
        <View style={styles.statHead}>
          <DsText v="title-sm" numberOfLines={1} style={styles.grow}>
            {t("home.stats.attendance")}
          </DsText>
          <Delta value={view.month.delta} suffix="%" />
        </View>
        <View style={styles.ring}>
          <Svg width={124} height={124} viewBox="0 0 124 124" style={styles.ringSvg}>
            <Circle cx={62} cy={62} r={RADIUS} fill="none" strokeWidth={12} stroke={ds.c["success-bg"]} />
            {percent !== null ? (
              <Circle
                cx={62}
                cy={62}
                r={RADIUS}
                fill="none"
                strokeWidth={12}
                strokeLinecap="round"
                stroke={ds.c.success}
                strokeDasharray={`${(percent / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              />
            ) : null}
          </Svg>
          <DsText v="h1" heading style={styles.ringValue}>
            {percent === null ? "—" : `${percent}%`}
          </DsText>
        </View>
        <DsText v="caption" c="ink-secondary" style={styles.center}>
          {formatLocalized(now, t("home.monthPattern"))} · {t("mobile.stats.lessons", { attended: view.month.attended, total: view.month.total })}
        </DsText>
      </Pressable>
      <View style={styles.statColumn}>
        <SmallStat
          icon="emoji-events"
          tone={{ bg: "accent-violet-bg", fg: "accent-violet-fg" }}
          value={view.score.average === null ? "—" : String(view.score.average)}
          label={t("home.stats.score")}
          aside={<Delta value={view.score.delta} />}
          onPress={() => router.navigate(ROUTES.parent.grades as never)}
        />
        <SmallStat
          icon="assignment"
          tone={{ bg: "accent-saffron-bg", fg: "accent-saffron-fg" }}
          value={`${view.homework.submitted} / ${view.homework.total}`}
          label={t("home.stats.homework")}
          aside={
            view.homework.remaining ? (
              <View style={[styles.delta, { backgroundColor: ds.c["warning-bg"] }]}>
                <DsText v="caption-strong" c="warning-text">
                  {t("home.stats.homeworkLeft", { count: view.homework.remaining })}
                </DsText>
              </View>
            ) : null
          }
          onPress={() => router.navigate(ROUTES.parent.homework as never)}
        />
      </View>
    </View>
  );
}

function SmallStat({
  icon,
  tone,
  value,
  label,
  aside,
  onPress,
}: {
  icon: IconName;
  tone: { bg: DsColor; fg: DsColor };
  value: string;
  label: string;
  aside: React.ReactNode;
  onPress: () => void;
}) {
  const ds = useDs();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.statSmall, { backgroundColor: ds.c.surface }, pressed && styles.pressed]}>
      <View style={styles.statSmallHead}>
        <View style={[styles.statIcon, { backgroundColor: ds.c[tone.bg] }]}>
          <Icon name={icon} size={20} color={ds.c[tone.fg]} />
        </View>
        {aside}
      </View>
      <DsText v="h2" heading w="600" numberOfLines={1} style={styles.statValue}>
        {value}
      </DsText>
      <DsText v="caption" c="ink-secondary" numberOfLines={1}>
        {label}
      </DsText>
    </Pressable>
  );
}

function MobileSkeleton() {
  const ds = useDs();
  const block = { backgroundColor: ds.c.skeleton };
  return (
    <View style={styles.skeleton} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.row}>
        <View style={[styles.pill, { width: 120 }, block]} />
        <View style={[styles.pill, { width: 104 }, block]} />
        <View style={[styles.pill, { width: 44 }, block]} />
      </View>
      <View style={[styles.skeletonHero, { backgroundColor: ds.c.surface }]}>
        <View style={[styles.line, { height: 24, width: 112 }, block]} />
        <View style={[styles.line, { height: 20, width: "80%" }, block]} />
        <View style={[styles.line, { height: 16, width: "60%" }, block]} />
        <View style={styles.row}>
          {Array.from({ length: 7 }, (_, index) => (
            <View key={index} style={[styles.skeletonDay, block]} />
          ))}
        </View>
      </View>
      <View style={styles.stats}>
        <View style={[styles.statTall, { height: 230, backgroundColor: ds.c.surface }]} />
        <View style={styles.statColumn}>
          <View style={[styles.statSmall, { height: 110, backgroundColor: ds.c.surface }]} />
          <View style={[styles.statSmall, { height: 110, backgroundColor: ds.c.surface }]} />
        </View>
      </View>
    </View>
  );
}

/** Hali farzand yo'q — veb `MobileConnect`: "?" rasmi, ikki usul va "Qanday ishlaydi?". */
export function MobileConnect() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const [dialog, setDialog] = useState<"link" | "create" | null>(null);
  const steps = t("home.connect.steps", { returnObjects: true }) as Array<{ title: string; description: string }>;
  return (
    <View style={styles.stack}>
      <View style={[styles.intro, { backgroundColor: ds.c.surface }]}>
        <View style={[styles.question, { backgroundColor: ds.c["brand-subtle"] }]}>
          {/* `size-18 rounded-full bg-gradient-to-b from-line-strong to-ink-tertiary` */}
          <View style={[styles.questionCore, { experimental_backgroundImage: `linear-gradient(to bottom, ${ds.c["line-strong"]}, ${ds.c["ink-tertiary"]})` }]}>
            <DsText v="h1" heading c="on-action" style={styles.questionMark}>
              ?
            </DsText>
          </View>
          <View style={[styles.questionBadge, { backgroundColor: ds.c.brand, borderColor: ds.c.surface }]}>
            <Icon name="person-add" size={20} color={ds.c["on-action"]} />
          </View>
        </View>
        <DsText v="h2" heading w="600" style={styles.introTitle}>
          {t("home.connect.title")}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" style={styles.center}>
          {t("home.connect.description")}
        </DsText>
      </View>
      {(["link", "create"] as const).map((kind) => (
        <Pressable
          key={kind}
          accessibilityRole="button"
          onPress={() => setDialog(kind)}
          style={({ pressed }) => [styles.option, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
        >
          <View style={[styles.optionIcon, { backgroundColor: ds.c[kind === "link" ? "brand-subtle" : "accent-green-bg"] }]}>
            <Icon name={kind === "link" ? "link" : "person-add"} size={24} color={ds.c[kind === "link" ? "brand" : "accent-green-fg"]} />
          </View>
          <View style={styles.grow}>
            <DsText v="title">{t(`addChild.${kind}Title`)}</DsText>
            <DsText v="body-xs" c="ink-secondary">
              {t(`mobile.connect.${kind}`)}
            </DsText>
          </View>
          <Icon name="chevron-right" size={20} color={ds.c["icon-tertiary"]} />
        </Pressable>
      ))}
      <View style={[styles.how, { backgroundColor: ds.c.surface }]}>
        <DsText v="title-sm">{t("mobile.connect.how")}</DsText>
        {(Array.isArray(steps) ? steps : []).slice(0, 2).map((step, index) => (
          <View key={step.title} style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: ds.c["brand-subtle"] }]}>
              <DsText v="caption-strong" c="brand">
                {index + 1}
              </DsText>
            </View>
            <View style={styles.grow}>
              <DsText v="title-sm">{step.title}</DsText>
              <DsText v="body-xs" c="ink-secondary">
                {step.description}
              </DsText>
            </View>
          </View>
        ))}
      </View>
      <LinkChildDialog open={dialog === "link"} onOpenChange={(open) => setDialog(open ? "link" : null)} />
      <CreateChildDialog open={dialog === "create"} onOpenChange={(open) => setDialog(open ? "create" : null)} />
    </View>
  );
}

/** Uzuq chiziq — `h-px w-4 border-t-2 border-dashed border-line-strong`. */
function DashedLink() {
  const ds = useDs();
  return (
    <Svg width={16} height={2}>
      <Line x1={0} y1={1} x2={16} y2={1} stroke={ds.c["line-strong"]} strokeWidth={2} strokeDasharray="4 3" />
    </Svg>
  );
}

/** So'rov yuborilgan, hali tasdiqlanmagan — veb `MobilePending`. */
function MobilePending({ link }: { link: ParentLink }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const [adding, setAdding] = useState(false);
  return (
    <View style={styles.stack}>
      <View style={[styles.intro, { backgroundColor: ds.c.surface }]}>
        <View style={styles.pair}>
          <Avatar variant="legacy" name={link.parent.name} src={link.parent.avatarUrl ?? undefined} size="lg" box={56} />
          <DashedLink />
          <View style={[styles.hourglass, { backgroundColor: ds.c["accent-teal-bg"] }]}>
            <Icon name="hourglass-empty" size={16} color={ds.c["accent-teal-fg"]} />
          </View>
          <DashedLink />
          <Avatar variant="legacy" name={link.student.name} src={link.student.avatarUrl ?? undefined} size="lg" box={56} />
        </View>
        <DsText v="h2" heading w="600" style={styles.introTitle}>
          {t("mobile.pending.title")}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" style={styles.center}>
          {t("mobile.pending.text", { username: link.student.username, name: link.student.name })}
        </DsText>
        <View style={[styles.waitChip, { backgroundColor: ds.c["accent-teal-bg"] }]}>
          <Icon name="schedule" size={14} color={ds.c["accent-teal-fg"]} />
          <DsText v="caption-strong" c="accent-teal-fg">
            {t("home.pending.chip", { time: formatRelativeShort(link.createdAt) })}
          </DsText>
        </View>
        <View style={styles.pendingActions}>
          <PendingLinkActions link={link} />
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setAdding(true)}
        style={({ pressed }) => [styles.option, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
      >
        <View style={[styles.optionIcon, { backgroundColor: ds.c["accent-green-bg"] }]}>
          <Icon name="person-add" size={24} color={ds.c["accent-green-fg"]} />
        </View>
        <View style={styles.grow}>
          <DsText v="title">{t("home.pending.addAnother")}</DsText>
          <DsText v="body-xs" c="ink-secondary">
            {t("home.pending.addAnotherHint")}
          </DsText>
        </View>
        <Icon name="chevron-right" size={20} color={ds.c["icon-tertiary"]} />
      </Pressable>
      <AddChildDialog open={adding} onOpenChange={setAdding} />
    </View>
  );
}

/**
 * Ota-onaning bosh sahifasi — veb `pages/parent/dashboard/parent-home-mobile.tsx`:
 * sarlavha, server xatosi yoki oflayn lentasi, farzand chiplari, so'ng holatga
 * qarab: farzand ulash, kutilayotgan so'rov, skelet yoki ko'k karta,
 * statistika, "E'tibor talab qiladi" va so'nggi darslar. Faollik tahlili
 * ruxsati o'chiq bo'lsa karta va statistika o'rnida qulf.
 */
export function ParentHomeMobile() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const home = useParentHome();
  const { status, child, view, now } = home;
  const ready = status === "ready" && !home.sectionsLoading && view && child;

  return (
    <ParentScreen tabs onRefresh={async () => home.retry()}>
      <ParentMobileHeader />
      {home.online && home.failed && (status === "ready" || status === "error") ? <ParentErrorBanner onRetry={home.retry} /> : null}
      {!home.online && status === "ready" ? (
        <View style={[styles.offline, { backgroundColor: ds.c["surface-inverse"] }]}>
          <Icon name="wifi" size={20} color={ds.c["ink-inverse"]} />
          <DsText v="body-sm" c="ink-inverse" style={styles.grow}>
            {t("mobile.offline", { time: formatDayTime(home.lastUpdated || now) })}
          </DsText>
        </View>
      ) : null}
      {status === "ready" && home.online ? <ChildChips /> : null}
      {status === "connect" ? <MobileConnect /> : null}
      {status === "pending" && home.pendingLink ? <MobilePending link={home.pendingLink} /> : null}
      {status === "loading" || status === "error" || (status === "ready" && home.sectionsLoading) ? <MobileSkeleton /> : null}
      {ready ? (
        <View style={[styles.stackLoose, !home.online && styles.offlineContent]} pointerEvents={home.online ? "auto" : "none"}>
          {home.locked ? (
            <ParentLockedCard childId={child.id} childName={child.name} />
          ) : (
            <>
              <HomeHero childName={child.name} hero={view.hero} week={view.week} todayCount={view.todayCount} teachers={home.teachers} now={now} />
              <MobileStats view={view} now={now} />
            </>
          )}
          <AttentionCard items={view.attention} childId={child.id} now={now} />
          {home.locked ? null : <HomeRecent items={view.recent} now={now} />}
        </View>
      ) : null}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  pressed: { opacity: 0.85 },
  row: { flexDirection: "row", gap: 8 },
  stack: { gap: 12 },
  stackLoose: { gap: 16 },
  offlineContent: { opacity: 0.55 },
  /* `flex items-center gap-3 rounded-2xl bg-surface-inverse px-4 py-3` */
  offline: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  delta: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: dsRadius.full },
  /* `grid grid-cols-2 gap-3`, chapdagi `row-span-2` */
  stats: { flexDirection: "row", gap: 12 },
  statTall: { flex: 1, minWidth: 0, gap: 12, padding: 16, borderRadius: 20 },
  statHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  ring: { alignSelf: "center", width: 124, height: 124, alignItems: "center", justifyContent: "center" },
  ringSvg: { position: "absolute", transform: [{ rotate: "-90deg" }] },
  /* `font-heading text-[26px]/8 font-semibold` */
  ringValue: { fontSize: 26, lineHeight: 32 },
  statColumn: { flex: 1, minWidth: 0, gap: 12 },
  statSmall: { flex: 1, gap: 8, padding: 16, borderRadius: 20 },
  statSmallHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  statIcon: { width: 36, height: 36, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  /* `font-heading text-[22px]/7 font-semibold` */
  statValue: { fontSize: 22, lineHeight: 28 },
  skeleton: { gap: 16 },
  pill: { height: 44, borderRadius: dsRadius.full },
  skeletonHero: { gap: 12, padding: 20, borderRadius: 24 },
  line: { borderRadius: dsRadius.full },
  skeletonDay: { flex: 1, height: 48, borderRadius: dsRadius.xl },
  /* `flex flex-col items-center gap-3 rounded-3xl bg-surface px-5 py-6 text-center` */
  intro: { alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 24, borderRadius: 24 },
  introTitle: { lineHeight: 28, textAlign: "center" },
  question: { width: 112, height: 112, borderRadius: 56, alignItems: "center", justifyContent: "center" },
  questionCore: { width: 72, height: 72, borderRadius: 36, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  questionMark: { fontSize: 28, lineHeight: 34 },
  questionBadge: { position: "absolute", right: -4, bottom: 4, width: 44, height: 44, borderRadius: 22, borderWidth: 4, alignItems: "center", justifyContent: "center" },
  option: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20 },
  optionIcon: { width: 48, height: 48, borderRadius: dsRadius["2xl"], alignItems: "center", justifyContent: "center" },
  how: { gap: 12, padding: 16, borderRadius: 20 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  pair: { flexDirection: "row", alignItems: "center", gap: 8 },
  hourglass: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  waitChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  pendingActions: { alignSelf: "stretch", marginTop: 4 },
});
