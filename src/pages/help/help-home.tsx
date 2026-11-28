import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/modules/auth";
import {
  findCategory,
  ticketLabel,
  ticketTopic,
  ticketUnread,
  useHelpConfig,
  useHelpVideos,
  useSupportTickets,
  type HelpConfig,
  type HelpVideo,
  type SupportTicket,
} from "@/modules/support";
import { ROUTES } from "@/shared/config";
import { storage } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import { DsText, dsAlpha, dsRadius, Icon, useDs } from "@/shared/ui";
import { useHelpActions } from "./help-actions";
import { MobileHelpScreen } from "./help-screen";
import { HelpCard, HelpRow, HelpRows, HelpSection, HomeSkeleton, LoadError, OfflineBanner, StatusChip, ToneTile } from "./help-ui";
import {
  activeTicket,
  openVideo,
  useCategoryList,
  useHelpArticles,
  useHelpPaths,
  useHelpRole,
  useReplyMinutes,
  videoDuration,
  type ArticleView,
} from "./use-help";

/*
 * Yordam markazi bosh sahifasi — veb `pages/help/help-home.tsx` ning mobil
 * (tor ekran) varianti: salomlashuv va qidiruv, faol murojaat,
 * kategoriyalar, ko'p so'raladigan maqolalar, video qo'llanmalar, bog'lanish.
 */

function callPhone(phone: string) {
  void Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`).catch(() => undefined);
}

function StatusLine({ config }: { config: HelpConfig | undefined }) {
  const { t } = useTranslation("help");
  const ds = useDs();
  const minutes = useReplyMinutes();
  if (!config || config.online === null) return null;
  return (
    // `mt-4 flex items-center gap-2 text-caption text-white/90`
    <View style={styles.status}>
      <View style={[styles.statusDot, { backgroundColor: config.online ? ds.c.success : dsAlpha("#ffffff", 0.5) }]} />
      <DsText v="caption" style={[styles.grow, { color: dsAlpha("#ffffff", 0.9) }]}>
        {config.online ? t("home.online", { minutes }) : t("home.offline")}
        {config.hours ? ` · ${config.hours}` : ""}
      </DsText>
    </View>
  );
}

function ArticleRows({ articles }: { articles: ArticleView[] }) {
  const router = useRouter();
  const paths = useHelpPaths();
  return (
    <HelpRows>
      {articles.map((article) => (
        <HelpRow
          key={article.id}
          icon={article.icon}
          tone={findCategory(article.category)?.tone ?? "bg-brand-subtle text-brand"}
          title={article.title}
          subtitle={article.hint}
          onPress={() => router.push(paths.article(article.id) as never)}
        />
      ))}
    </HelpRows>
  );
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  const { t } = useTranslation("help");
  const ds = useDs();
  const router = useRouter();
  const paths = useHelpPaths();
  const unread = ticketUnread(ticket);
  const topic = ticketTopic(ticket.category);
  const meta = [ticketLabel(ticket), unread ? t("home.newReply") : ""].filter(Boolean).join(" · ");
  return (
    <HelpCard>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(paths.ticket(ticket.id) as never)}
        style={({ pressed }) => [styles.ticket, pressed && { backgroundColor: ds.c.subtle }]}
      >
        <ToneTile icon={topic?.icon ?? "forum"} tone={topic?.tone ?? "bg-danger-bg text-error-text"} />
        <View style={[styles.grow, styles.ticketText]}>
          <View style={styles.inline}>
            <DsText v="title" w="600" numberOfLines={1} style={styles.shrink}>
              {ticket.subject}
            </DsText>
            {unread ? <View style={[styles.dot, { backgroundColor: ds.c.brand }]} /> : null}
          </View>
          <View style={[styles.inline, styles.wrap]}>
            <StatusChip status={ticket.status} />
            {meta ? (
              <DsText v="caption" c="ink-secondary">
                {meta}
              </DsText>
            ) : null}
          </View>
        </View>
        <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
      </Pressable>
    </HelpCard>
  );
}

function VideoCard({ video }: { video: HelpVideo }) {
  const ds = useDs();
  const duration = videoDuration(video.durationSeconds);
  return (
    // `flex flex-col gap-2 rounded-xl bg-surface p-2`
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={video.title}
      onPress={() => openVideo(video)}
      style={({ pressed }) => [styles.video, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
    >
      {/* `h-29 rounded-lg bg-gradient-to-br from-brand to-brand-strong` */}
      <View style={[styles.videoThumb, { experimental_backgroundImage: `linear-gradient(135deg, ${ds.c.brand}, ${ds.c["brand-strong"]})` }]}>
        <View style={[styles.videoPlay, { backgroundColor: ds.c.surface }]}>
          <Icon name="play-arrow" size={24} color={ds.c.brand} />
        </View>
        {duration ? (
          <View style={styles.videoDuration}>
            <DsText v="caption-strong" style={styles.white}>
              {duration}
            </DsText>
          </View>
        ) : null}
      </View>
      <View style={styles.videoText}>
        <DsText v="body-sm" w="600" numberOfLines={1}>
          {video.title}
        </DsText>
        {video.description ? (
          <DsText v="caption" c="ink-secondary" numberOfLines={1}>
            {video.description}
          </DsText>
        ) : null}
      </View>
    </Pressable>
  );
}

function ContactRows({ config }: { config: HelpConfig | undefined }) {
  const { t } = useTranslation("help");
  const router = useRouter();
  const paths = useHelpPaths();
  const role = useHelpRole();
  const { user } = useAuth();
  const minutes = useReplyMinutes();
  const { openNewTicket } = useHelpActions();
  const rows = [
    { id: "ticket", icon: "forum", tone: "bg-brand-subtle text-brand", title: t("home.ticketRow"), hint: t("home.ticketRowHint", { minutes }), run: () => openNewTicket() },
    config?.telegram
      ? {
          id: "telegram",
          icon: "send",
          tone: "bg-brand-subtle text-brand",
          title: t("home.telegram"),
          hint: [config.telegram, config.hours].filter(Boolean).join(" · "),
          run: () => void Linking.openURL(config.telegramUrl).catch(() => undefined),
        }
      : null,
    config?.phone
      ? {
          id: "phone",
          icon: "call",
          tone: "bg-success-bg text-success-fg",
          title: t("home.phone"),
          hint: [config.phone, config.hours].filter(Boolean).join(" · "),
          run: () => callPhone(config.phone),
        }
      : null,
    { id: "tickets", icon: "chat", tone: "bg-accent-violet-bg text-accent-violet-fg", title: t("home.myTickets"), hint: t("home.myTicketsHint"), run: () => router.push(paths.tickets as never) },
    role === "teacher"
      ? {
          id: "tour",
          icon: "school",
          tone: "bg-success-bg text-success-fg",
          title: t("home.tour"),
          hint: t("home.tourHint"),
          run: () => {
            storage.remove(`yolup:onboarding:${user?.id ?? ""}`);
            router.navigate(ROUTES.teacher.dashboard as never);
          },
        }
      : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <HelpRows>
      {rows.map((row) => (
        <HelpRow key={row.id} icon={row.icon} tone={row.tone} title={row.title} subtitle={row.hint} onPress={row.run} />
      ))}
    </HelpRows>
  );
}

function Hero() {
  const { t } = useTranslation("help");
  const ds = useDs();
  const { user } = useAuth();
  const router = useRouter();
  const paths = useHelpPaths();
  const config = useHelpConfig();
  const name = (user?.firstName || user?.name || "").split(" ")[0];

  return (
    // `rounded-2xl bg-brand px-5 pt-5 pb-5 text-white`
    <View style={[styles.hero, { backgroundColor: ds.c.brand }]}>
      {name ? (
        <DsText v="caption-strong" style={[styles.upper, { color: dsAlpha("#ffffff", 0.8) }]}>
          {t("home.greeting", { name })}
        </DsText>
      ) : null}
      <DsText v="h2" heading style={[styles.white, styles.heroTitle]}>
        {t("home.heading")}
      </DsText>
      {/* `mt-4 h-12 rounded-full bg-surface px-4 gap-3 text-body-sm text-ink-secondary` */}
      <Pressable
        accessibilityRole="search"
        accessibilityLabel={t("home.search")}
        onPress={() => router.push(paths.search() as never)}
        style={[styles.heroSearch, { backgroundColor: ds.c.surface }]}
      >
        <Icon name="search" size={20} color={ds.c["ink-secondary"]} />
        <DsText v="body-sm" c="ink-secondary" numberOfLines={1} style={styles.grow}>
          {t("home.search")}
        </DsText>
      </Pressable>
      <StatusLine config={config.data} />
    </View>
  );
}

function CategoryGrid() {
  const { t } = useTranslation("help");
  const ds = useDs();
  const router = useRouter();
  const paths = useHelpPaths();
  const categories = useCategoryList();
  return (
    // `grid grid-cols-2 gap-3`
    <View style={styles.grid}>
      {categories.map((category) => (
        <Pressable
          key={category.id}
          accessibilityRole="button"
          onPress={() => router.push(paths.category(category.id) as never)}
          style={({ pressed }) => [styles.category, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
        >
          <ToneTile icon={category.icon} tone={category.tone} size={36} />
          <View style={styles.categoryText}>
            <DsText v="body-sm" w="600" numberOfLines={1}>
              {t(`categories.${category.id}.short`)}
            </DsText>
            <DsText v="caption" c="ink-secondary">
              {t("home.articleCount", { count: category.articles.length })}
            </DsText>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function HelpHome() {
  const { t } = useTranslation("help");
  const router = useRouter();
  const paths = useHelpPaths();
  const online = useOnlineStatus();
  const config = useHelpConfig();
  const tickets = useSupportTickets();
  const videos = useHelpVideos();
  const { popular } = useHelpArticles();
  const active = activeTicket(tickets.data);
  const loading = tickets.isLoading && videos.isLoading;
  const failed = !online && !tickets.data && !videos.data;
  const videoList = videos.data ?? [];

  function retry() {
    void tickets.refetch();
    void videos.refetch();
    void config.refetch();
  }

  if (failed)
    return (
      <MobileHelpScreen title={t("title")}>
        <OfflineBanner />
        <LoadError onRetry={retry} />
        {config.data?.phone ? (
          <HelpSection title={t("states.urgent")}>
            <HelpRows>
              <HelpRow
                icon="call"
                tone="bg-success-bg text-success-fg"
                title={t("home.phone")}
                subtitle={[config.data.phone, config.data.hours].filter(Boolean).join(" · ")}
                onPress={() => callPhone(config.data?.phone ?? "")}
              />
            </HelpRows>
          </HelpSection>
        ) : null}
      </MobileHelpScreen>
    );

  return (
    <MobileHelpScreen title={t("title")}>
      {loading ? (
        <HomeSkeleton />
      ) : (
        <>
          <Hero />
          {active ? (
            <HelpSection title={t("home.activeTicket")} action={{ label: t("home.all"), onPress: () => router.push(paths.tickets as never) }}>
              <TicketCard ticket={active} />
            </HelpSection>
          ) : null}
          <HelpSection title={t("home.categories")}>
            <CategoryGrid />
          </HelpSection>
          <HelpSection title={t("home.faq")} action={{ label: t("home.all"), onPress: () => router.push(paths.articles as never) }}>
            <ArticleRows articles={popular} />
          </HelpSection>
          {videoList.length ? (
            <HelpSection title={t("home.videos")} action={{ label: t("home.all"), onPress: () => router.push(paths.videos as never) }}>
              {/* `-mx-4 flex gap-3 overflow-x-auto px-4`, karta `w-58` */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videosRow} contentContainerStyle={styles.videos}>
                {videoList.map((video) => (
                  <View key={video.id} style={styles.videoItem}>
                    <VideoCard video={video} />
                  </View>
                ))}
              </ScrollView>
            </HelpSection>
          ) : null}
          <HelpSection title={t("home.contact")}>
            <ContactRows config={config.data} />
          </HelpSection>
        </>
      )}
    </MobileHelpScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  white: { color: "#ffffff" },
  upper: { textTransform: "uppercase", letterSpacing: 0.4 },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  wrap: { flexWrap: "wrap" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  status: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  hero: { paddingHorizontal: 20, paddingVertical: 20, borderRadius: dsRadius["2xl"] },
  heroTitle: { marginTop: 8 },
  heroSearch: { marginTop: 16, height: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderRadius: 24 },
  ticket: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  ticketText: { gap: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  category: { width: "47.5%", flexGrow: 1, gap: 16, padding: 16, borderRadius: dsRadius.xl },
  categoryText: { gap: 2, minWidth: 0 },
  videosRow: { marginHorizontal: -16 },
  videos: { gap: 12, paddingHorizontal: 16 },
  videoItem: { width: 232 },
  video: { gap: 8, padding: 8, borderRadius: dsRadius.xl },
  videoThumb: { height: 116, alignItems: "center", justifyContent: "center", borderRadius: dsRadius.lg, overflow: "hidden" },
  videoPlay: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", paddingLeft: 2 },
  videoDuration: { position: "absolute", right: 8, bottom: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.7)" },
  videoText: { paddingHorizontal: 6, paddingBottom: 4, minWidth: 0 },
});
