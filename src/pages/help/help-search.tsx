import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clearRecentSearches, findCategory, recentSearches, rememberSearch, searchEntries } from "@/modules/support";
import { DsGradient, DsText, Icon, MobileSearchField, useDs } from "@/shared/ui";
import { useHelpActions } from "./help-actions";
import { ChipTabs, EmptyBlock, HelpCard, Highlight, Pills, ToneTile } from "./help-ui";
import { openVideo, useHelpPaths, useHelpSearchEntries, videoDuration, type HelpSearchEntry } from "./use-help";

/*
 * Qidiruv — veb `pages/help/help-search.tsx` dagi `HelpSearchPage` ning mobil
 * varianti: so'nggi qidiruvlar, tavsiyalar, maqola/video filtrlari, topilmadi
 * holati. Kompyuterdagi ochiladigan ro'yxat (`HeroSearch`) mobilda yo'q.
 */

const POPULAR_TOPICS = ["forgotPassword", "joinLesson", "submitHomework", "paymentCharged", "notifications"];

type SearchTab = "all" | "articles" | "videos";

function useOpenEntry() {
  const router = useRouter();
  const paths = useHelpPaths();
  return (entry: HelpSearchEntry, query: string) => {
    rememberSearch(query);
    if (entry.kind === "video") openVideo(entry.video);
    else if (entry.kind === "faq") router.push(paths.faq(entry.id) as never);
    else router.push(paths.article(entry.id) as never);
  };
}

/** `min-h-[69px] border-b px-4 py-3 gap-3` — sarlavhada qidiruv so'zi ajratilgan. */
function EntryRow({ entry, query, onOpen, last, suggestion = false }: { entry: HelpSearchEntry; query: string; onOpen: () => void; last: boolean; suggestion?: boolean }) {
  const { t } = useTranslation("help");
  const ds = useDs();
  const category = entry.kind === "article" ? findCategory(entry.article.category) : null;
  const icon = suggestion ? "search" : entry.kind === "video" ? "play-arrow" : entry.kind === "faq" ? "help" : entry.article.icon;
  const tone = suggestion
    ? "bg-brand-subtle text-brand"
    : entry.kind === "video"
      ? "bg-accent-violet-bg text-accent-violet-fg"
      : (category?.tone ?? "bg-brand-subtle text-brand");
  const meta = suggestion
    ? entry.kind === "article"
      ? t(`categories.${entry.article.category}.title`)
      : ""
    : entry.kind === "article"
      ? `${t(`categories.${entry.article.category}.title`)} · ${t("search.readMinutes", { minutes: entry.article.minutes })}`
      : entry.kind === "video"
        ? entry.video.durationSeconds
          ? t("search.videoMeta", { duration: videoDuration(entry.video.durationSeconds) })
          : t("search.videoMetaNoDuration")
        : t("search.faqMeta");
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
        pressed && { backgroundColor: ds.c.subtle },
      ]}
    >
      <ToneTile icon={icon} tone={tone} />
      <View style={styles.rowText}>
        <DsText v="title-sm" w="600" numberOfLines={1}>
          <Highlight text={entry.title} query={query} />
        </DsText>
        {meta ? (
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
            {meta}
          </DsText>
        ) : null}
      </View>
      <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
    </Pressable>
  );
}

function SectionHead({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.head}>
      <DsText v="title" w="400" style={styles.grow}>
        {title}
      </DsText>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
          <DsText v="body-sm" c="brand">
            {action.label}
          </DsText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function HelpSearchPage() {
  const { t } = useTranslation("help");
  const ds = useDs();
  const router = useRouter();
  const paths = useHelpPaths();
  const insets = useSafeAreaInsets();
  const { openNewTicket } = useHelpActions();
  const openEntry = useOpenEntry();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? "");
  const [tab, setTab] = useState<SearchTab>("all");
  const [recent, setRecent] = useState(recentSearches);
  const entries = useHelpSearchEntries();
  const results = useMemo(() => searchEntries(entries, query), [entries, query]);
  const articles = results.filter((entry) => entry.kind !== "video");
  const videos = results.filter((entry) => entry.kind === "video");
  const visible = tab === "articles" ? articles : tab === "videos" ? videos : results;
  const term = query.trim();

  function update(value: string) {
    setQuery(value);
    setTab("all");
    router.setParams({ q: value.trim() || undefined });
  }

  const suggestions = term ? results.filter((entry) => entry.kind === "article").slice(0, 4) : [];
  const popular = entries.filter((entry) => entry.kind === "article" && POPULAR_TOPICS.includes(entry.id));
  const popularBlock = (
    <View style={styles.section}>
      <SectionHead title={t("search.popular")} />
      <Pills items={popular.map((entry) => ({ id: entry.id, label: entry.title, onPress: () => openEntry(entry, entry.title) }))} />
    </View>
  );

  const recentBlock = recent.length ? (
    <View style={styles.section}>
      <SectionHead title={t("search.recent")} action={{ label: t("search.clear"), onPress: () => setRecent(clearRecentSearches()) }} />
      <Pills items={recent.map((item) => ({ id: item, label: item, onPress: () => update(item) }))} />
    </View>
  ) : null;

  const list = (items: HelpSearchEntry[], suggestion = false) => (
    <HelpCard style={styles.rows}>
      {items.map((entry, index) => (
        <EntryRow
          key={`${entry.kind}-${entry.id}`}
          entry={entry}
          query={suggestion ? term : query}
          suggestion={suggestion}
          last={index === items.length - 1}
          onOpen={() => openEntry(entry, term)}
        />
      ))}
    </HelpCard>
  );

  const body =
    term && term.length < 4 && suggestions.length ? (
      <>
        {recentBlock}
        <View style={styles.section}>
          <SectionHead title={t("search.suggestions")} />
          {list(suggestions, true)}
        </View>
      </>
    ) : !term ? (
      <>
        {recentBlock}
        {popularBlock}
      </>
    ) : results.length ? (
      <>
        {videos.length && articles.length ? (
          <ChipTabs
            items={[
              { id: "all" as const, label: `${t("search.allTab")} · ${results.length}` },
              { id: "articles" as const, label: `${t("search.articles")} · ${articles.length}` },
              { id: "videos" as const, label: `${t("search.videos")} · ${videos.length}` },
            ]}
            value={tab}
            onChange={setTab}
          />
        ) : null}
        {list(visible)}
        <HelpCard>
          <Pressable
            accessibilityRole="button"
            onPress={() => openNewTicket()}
            style={({ pressed }) => [styles.notFound, pressed && { backgroundColor: ds.c.subtle }]}
          >
            <ToneTile icon="forum" tone="bg-success-bg text-success-fg" />
            <View style={styles.rowText}>
              <DsText v="title-sm" w="600">
                {t("search.notFound")}
              </DsText>
              <DsText v="body-sm" c="ink-secondary">
                {t("search.notFoundHint")}
              </DsText>
            </View>
            <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
          </Pressable>
        </HelpCard>
      </>
    ) : (
      <>
        <EmptyBlock
          icon="search"
          title={t("search.emptyTitleShort")}
          text={t("search.emptyTextLong")}
          action={{ label: t("home.send"), icon: "add", onPress: () => openNewTicket() }}
        />
        {popularBlock}
      </>
    );

  return (
    // `flex h-full flex-col bg-canvas bg-auth-gradient px-4 pt-5 pb-6 gap-5`
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <DsGradient name="auth" />
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchRow}>
          <MobileSearchField
            value={query}
            onChange={update}
            placeholder={t("home.search")}
            clearLabel={t("search.clear")}
            autoFocus
            style={styles.grow}
          />
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace(paths.home as never);
            }}
          >
            <DsText v="body-sm" c="brand">
              {t("search.cancel")}
            </DsText>
          </Pressable>
        </View>
        {body}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  page: { paddingHorizontal: 16, gap: 20 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  section: { gap: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  rows: { paddingVertical: 4 },
  row: { minHeight: 69, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  notFound: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
});
