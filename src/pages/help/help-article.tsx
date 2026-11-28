import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { findArticle, findCategory, useHelpFaq, useHelpVideos, useSendArticleFeedback, type HelpVideo } from "@/modules/support";
import { DsText, dsRadius, Icon, MobileButton, MobileInput, MobileRadio, MobileRoundButton, Sheet, toast, useDs } from "@/shared/ui";
import { useHelpActions } from "./help-actions";
import { MobileHelpScreen } from "./help-screen";
import { ChipTabs, EmptyBlock, HelpCard, HelpRow, HelpRows, RowsSkeleton, ToneTile } from "./help-ui";
import { openVideo, useArticleText, useCategoryList, useHelpArticles, useHelpDate, useHelpPaths, videoDuration, type ArticleView } from "./use-help";

/*
 * Maqola, kategoriya, barcha maqolalar, videolar va FAQ — veb
 * `pages/help/help-article.tsx` ning mobil (tor ekran) varianti.
 */

const REASONS = ["outdated", "unclear", "different", "other"] as const;

function videoRow(video: HelpVideo, t: (key: string, options?: Record<string, unknown>) => string) {
  const duration = videoDuration(video.durationSeconds);
  return (
    <HelpRow
      key={`video-${video.id}`}
      icon="play-arrow"
      tone="bg-accent-violet-bg text-accent-violet-fg"
      title={video.title}
      subtitle={duration ? t("search.videoMeta", { duration }) : t("search.videoMetaNoDuration")}
      onPress={() => openVideo(video)}
    />
  );
}

function articleRows(articles: ArticleView[], t: (key: string, options?: Record<string, unknown>) => string, open: (id: string) => void, showCategory = false) {
  return articles.map((article) => (
    <HelpRow
      key={article.id}
      icon={article.icon}
      tone={findCategory(article.category)?.tone ?? "bg-brand-subtle text-brand"}
      title={article.title}
      subtitle={
        showCategory
          ? `${t(`categories.${article.category}.title`)} · ${t("search.readMinutes", { minutes: article.minutes })}`
          : t("category.readTime", { minutes: article.minutes })
      }
      onPress={() => open(article.id)}
    />
  ));
}

function useOpenArticle() {
  const router = useRouter();
  const paths = useHelpPaths();
  return (id: string) => router.push(paths.article(id) as never);
}

export function HelpCategoryPage() {
  const { t } = useTranslation("help");
  const { categoryId = "" } = useLocalSearchParams<{ categoryId: string }>();
  const paths = useHelpPaths();
  const dayMonth = useHelpDate();
  const open = useOpenArticle();
  const categories = useCategoryList();
  const category = categories.find((item) => item.id === categoryId);
  const [tag, setTag] = useState("all");
  if (!category) return <Redirect href={paths.home as never} />;
  const latest = category.articles.map((article) => article.updatedAt).sort().at(-1) ?? "";
  const visible = tag === "all" ? category.articles : category.articles.filter((article) => article.tag === tag);
  const tags = (category.tags ?? []).filter((item) => category.articles.some((article) => article.tag === item));

  return (
    <MobileHelpScreen title={t(`categories.${category.id}.title`)}>
      <HelpCard>
        <View style={styles.summary}>
          <ToneTile icon={category.icon} tone={category.tone} />
          <View style={styles.grow}>
            <DsText v="title-sm" w="600">
              {category.videos.length
                ? t("category.summary", {
                    articles: t("home.articleCount", { count: category.articles.length }),
                    videos: t("category.videos", { count: category.videos.length }),
                  })
                : t("home.articleCount", { count: category.articles.length })}
            </DsText>
            {latest ? (
              <DsText v="body-xs" c="ink-secondary">
                {t("category.updated", { date: dayMonth(latest) })}
              </DsText>
            ) : null}
          </View>
        </View>
      </HelpCard>
      {tags.length ? (
        <ChipTabs
          items={[{ id: "all", label: t("category.all") }, ...tags.map((item) => ({ id: item, label: t(`category.tags.${item}`) }))]}
          value={tag}
          onChange={setTag}
        />
      ) : null}
      <HelpRows>
        {articleRows(visible, t, open)}
        {tag === "all" ? category.videos.map((video) => videoRow(video, t)) : null}
      </HelpRows>
    </MobileHelpScreen>
  );
}

export function HelpArticlesPage() {
  const { t } = useTranslation("help");
  const router = useRouter();
  const paths = useHelpPaths();
  const open = useOpenArticle();
  const { all } = useHelpArticles();
  const faq = useHelpFaq();
  return (
    <MobileHelpScreen title={t("category.allArticles")}>
      <HelpRows>
        {(faq.data ?? []).map((item) => (
          <HelpRow
            key={`faq-${item.id}`}
            icon="help"
            tone="bg-brand-subtle text-brand"
            title={item.question}
            subtitle={t("search.faqMeta")}
            onPress={() => router.push(paths.faq(item.id) as never)}
          />
        ))}
        {articleRows(all, t, open, true)}
      </HelpRows>
    </MobileHelpScreen>
  );
}

export function HelpVideosPage() {
  const { t } = useTranslation("help");
  const videos = useHelpVideos();
  return (
    <MobileHelpScreen title={t("category.allVideos")}>
      {videos.isLoading ? (
        <RowsSkeleton rows={3} />
      ) : videos.data?.length ? (
        <HelpRows>{videos.data.map((video) => videoRow(video, t))}</HelpRows>
      ) : (
        <EmptyBlock icon="play-circle" title={t("category.empty")} />
      )}
    </MobileHelpScreen>
  );
}

function FeedbackSheet({ open, onClose, onSend }: { open: boolean; onClose: () => void; onSend: (reason: string, comment: string) => void }) {
  const { t } = useTranslation("help");
  const [reason, setReason] = useState<string>("different");
  const [comment, setComment] = useState("");
  return (
    <Sheet
      variant="app"
      open={open}
      onClose={onClose}
      title={t("article.feedback.title")}
      description={t("article.feedback.description")}
      footer={<MobileButton label={t("article.feedback.send")} onPress={() => onSend(reason, comment.trim())} />}
    >
      <View style={styles.feedback} accessibilityRole="radiogroup">
        {REASONS.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="radio"
            accessibilityState={{ checked: reason === item }}
            onPress={() => setReason(item)}
            style={styles.reason}
          >
            <MobileRadio checked={reason === item} />
            <DsText v="body" style={styles.grow}>
              {t(`article.feedback.${item}`)}
            </DsText>
          </Pressable>
        ))}
        <View style={styles.field}>
          <DsText v="body-sm" w="500">
            {t("article.feedback.comment")}
          </DsText>
          <MobileInput
            multiline
            value={comment}
            maxLength={500}
            onChangeText={setComment}
            placeholder={t("article.feedback.commentPlaceholder")}
          />
        </View>
      </View>
    </Sheet>
  );
}

function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  const ds = useDs();
  return (
    // `h-11 flex-1 rounded-full border border-line-strong px-5 text-body-sm font-semibold`
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.outline, { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : "transparent" }]}
    >
      <DsText v="body-sm" w="600">
        {label}
      </DsText>
    </Pressable>
  );
}

function NeedHelpRow({ category }: { category?: string }) {
  const { t } = useTranslation("help");
  const { openNewTicket } = useHelpActions();
  return (
    <HelpRows>
      <HelpRow
        icon="forum"
        tone="bg-success-bg text-success-fg"
        title={t("article.needHelpMobile")}
        subtitle={t("article.needHelpHint")}
        onPress={() => openNewTicket(category ? { category } : undefined)}
      />
    </HelpRows>
  );
}

export function HelpArticlePage() {
  const { t, i18n } = useTranslation("help");
  const { articleId = "" } = useLocalSearchParams<{ articleId: string }>();
  const ds = useDs();
  const paths = useHelpPaths();
  const dayMonth = useHelpDate();
  const text = useArticleText();
  const open = useOpenArticle();
  const { all } = useHelpArticles();
  const send = useSendArticleFeedback();
  const [done, setDone] = useState(false);
  const [asking, setAsking] = useState(false);
  const raw = findArticle(articleId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const article = useMemo(() => (raw ? text(raw) : null), [raw, i18n.language]);

  if (!article || !all.some((item) => item.id === article.id)) return <Redirect href={paths.home as never} />;

  const category = findCategory(article.category);
  const related = all.filter((item) => item.category === article.category && item.id !== article.id).slice(0, 4);

  function submit(helpful: boolean, reason?: string, comment?: string) {
    send.mutate({ article: articleId, helpful, reason, comment, language: i18n.language });
    setAsking(false);
    setDone(true);
    toast.success(t("article.sent"));
  }

  /*
   * 🟡 Vebda sahifa havolasi ulashiladi; ilovada veb manzili yo'q — maqola
   * matnining o'zi (sarlavha, kirish, qadamlar) tizim oynasi orqali.
   */
  function share() {
    if (!article) return;
    const steps = article.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
    void Share.share({ title: article.title, message: [article.title, article.intro, steps, article.tip].filter(Boolean).join("\n\n") }).catch(
      () => undefined
    );
  }

  return (
    <MobileHelpScreen title={t("article.title")} action={<MobileRoundButton icon="share" iconSize={20} label={t("article.share")} onPress={share} />}>
      <View style={styles.head}>
        <DsText v="caption-strong" c="brand" style={styles.upper}>
          {t(`categories.${article.category}.title`)}
        </DsText>
        <DsText v="h2" heading>
          {article.title}
        </DsText>
        <View style={styles.meta}>
          <Icon name="clock" size={14} color={ds.c["ink-secondary"]} />
          <DsText v="body-xs" c="ink-secondary">
            {t("article.meta", { minutes: article.minutes, date: dayMonth(article.updatedAt) })}
          </DsText>
        </View>
      </View>

      {/* `gap-4 px-4 py-5` */}
      <HelpCard style={styles.body}>
        <DsText v="body">{article.intro}</DsText>
        <View style={styles.steps}>
          {article.steps.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: ds.c["brand-subtle"] }]}>
                <DsText v="body-sm" w="600" c="brand">
                  {index + 1}
                </DsText>
              </View>
              <DsText v="body" style={[styles.grow, styles.stepText]}>
                {step}
              </DsText>
            </View>
          ))}
        </View>
        {article.tip ? (
          <View style={[styles.tip, { backgroundColor: ds.c["brand-subtle"] }]}>
            <Icon name="info" size={18} color={ds.c.brand} />
            <DsText v="body-sm" c="brand" style={styles.grow}>
              {article.tip}
            </DsText>
          </View>
        ) : null}
      </HelpCard>

      <HelpCard style={styles.feedbackCard}>
        {done ? (
          <View style={styles.thanks}>
            <ToneTile icon="check-circle" tone="bg-success-bg text-success-fg" size={36} />
            <DsText v="title-sm" w="600" style={styles.grow}>
              {t("article.thanks")}
            </DsText>
          </View>
        ) : (
          <View style={styles.helpful}>
            <DsText v="title-sm" w="600">
              {t("article.helpful")}
            </DsText>
            <View style={styles.answers}>
              <OutlineButton label={t("article.yes")} onPress={() => submit(true)} />
              <OutlineButton label={t("article.no")} onPress={() => setAsking(true)} />
            </View>
          </View>
        )}
      </HelpCard>

      <NeedHelpRow category={article.category} />

      {related.length ? (
        <View style={styles.related}>
          <DsText v="title" w="400">
            {t("article.similar")}
          </DsText>
          <HelpRows>
            {related.map((item) => (
              <HelpRow
                key={item.id}
                icon={item.icon}
                tone={category?.tone ?? "bg-brand-subtle text-brand"}
                title={item.title}
                subtitle={t("category.readTime", { minutes: item.minutes })}
                onPress={() => open(item.id)}
              />
            ))}
          </HelpRows>
        </View>
      ) : null}

      <FeedbackSheet open={asking} onClose={() => setAsking(false)} onSend={(reason, comment) => submit(false, reason, comment)} />
    </MobileHelpScreen>
  );
}

export function HelpFaqPage() {
  const { t } = useTranslation("help");
  const { faqId = "" } = useLocalSearchParams<{ faqId: string }>();
  const paths = useHelpPaths();
  const faq = useHelpFaq();
  const item = faq.data?.find((entry) => entry.id === faqId);
  let content: ReactNode;
  if (faq.isLoading) content = <RowsSkeleton rows={2} />;
  else if (!item) return <Redirect href={paths.home as never} />;
  else
    content = (
      <>
        {/* `gap-3 px-5 py-5` */}
        <HelpCard style={styles.faq}>
          <DsText v="h3" heading>
            {item.question}
          </DsText>
          <DsText v="body">{item.answer}</DsText>
        </HelpCard>
        <NeedHelpRow />
      </>
    );
  return <MobileHelpScreen title={t("article.title")}>{content}</MobileHelpScreen>;
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  upper: { textTransform: "uppercase", letterSpacing: 0.4 },
  summary: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  head: { gap: 6 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  body: { gap: 16, paddingHorizontal: 16, paddingVertical: 20 },
  steps: { gap: 14 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepText: { paddingTop: 2 },
  tip: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.lg },
  feedbackCard: { paddingHorizontal: 16, paddingVertical: 16 },
  thanks: { flexDirection: "row", alignItems: "center", gap: 12 },
  helpful: { gap: 12 },
  answers: { flexDirection: "row", gap: 12 },
  outline: { flex: 1, height: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, borderWidth: 1, borderRadius: 22 },
  related: { gap: 12 },
  feedback: { gap: 16, paddingBottom: 4 },
  reason: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 6 },
  field: { gap: 8 },
  faq: { gap: 12, paddingHorizontal: 20, paddingVertical: 20 },
});
