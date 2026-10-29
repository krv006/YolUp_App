import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { useQuizzes } from "@/modules/quiz";
import { useGlobalSearch, type SearchHit, type SearchType } from "@/modules/search";
import { ROUTES } from "@/shared/config";
import {
  Avatar,
  bodyFont,
  DsGradient,
  DsText,
  dsRadius,
  dsType,
  Icon,
  MobileEmptyCard,
  MobilePageHeader,
  MobileSegment,
  SearchClear,
  toneColors,
  useDs,
  type IconName,
} from "@/shared/ui";

type Filter = "all" | SearchType;

/**
 * Qidiruv (M5.9–5.10) — veb `pages/workspace/workspace-search-page.tsx`:
 * kamida 2 harf, backend qidiruvi (`useGlobalSearch`), natijalar guruhlar,
 * darslar, testlar, xabarlar va odamlar bo'limlarida; "Bugun / Ertaga" vaqt
 * ko'rinishi.
 */
export function WorkspaceSearchPage() {
  const { t } = useTranslation("workspace");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isStudent = useIsStudent();
  const routes = useRoleRoutes();

  const [term, setTerm] = useState("");
  const [focused, setFocused] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const search = useGlobalSearch(term, filter);
  const enabled = search.active;

  const quizzes = useQuizzes(null, !isStudent);
  const conversations = useConversations(isStudent ? "student" : "teacher");
  const months = tl("list.months", { returnObjects: true }) as string[];

  const byType = (type: SearchType) => search.items.filter((item) => item.type === type);
  const groups = byType("groups");
  const lessonHits = byType("lessons");
  const quizHits = byType("quizzes");
  const messageHits = byType("messages");
  const people = byType("people");
  const countOf = (type: SearchType) => search.counts[type] ?? 0;
  const total = (Object.values(search.counts) as number[]).reduce((sum, value) => sum + value, 0);

  const filters: Array<{ id: Filter; label: string }> = [
    { id: "all", label: t("filterAll", { count: total }) },
    { id: "groups", label: t("filterGroups") },
    { id: "lessons", label: t("filterLessons") },
    { id: "quizzes", label: t("filterQuizzes") },
    { id: "messages", label: t("filterMessages") },
    { id: "people", label: t("filterPeople") },
  ];

  const show = (id: Filter) => filter === "all" || filter === id;
  const go = (href: string) => router.push(href as never);

  function openQuiz(hit: SearchHit) {
    const quiz = quizzes.data?.find((entry) => entry.id === hit.id);
    go(isStudent ? ROUTES.student.test(hit.id) : quiz && quiz.status !== "draft" ? ROUTES.teacher.testResults(hit.id) : ROUTES.teacher.test(hit.id));
  }

  function lessonMoment(value: string | null): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return `${t("mobileSearch.today")}, ${time}`;
    if (date.toDateString() === tomorrow.toDateString()) return `${t("mobileSearch.tomorrow")}, ${time}`;
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <DsGradient name="auth" />
        <MobilePageHeader
          title={t("searchTitle")}
          backLabel={t("searchBack")}
          onBack={() => (router.canGoBack() ? router.back() : router.replace((isStudent ? ROUTES.student.workspace : ROUTES.teacher.workspace) as never))}
        />

        {/* `mt-5 h-12 rounded-full border-[1.5px] bg-surface px-4.5 gap-3` */}
        <View style={[styles.search, { backgroundColor: ds.c.surface, borderColor: focused ? ds.c.focus : "transparent" }]}>
          <Icon name="search" size={20} color={ds.c["ink-secondary"]} />
          <TextInput
            autoFocus
            value={term}
            onChangeText={setTerm}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={ds.c["ink-secondary"]}
            accessibilityLabel={t("searchPlaceholder")}
            selectionColor={ds.c.brand}
            autoCorrect={false}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[styles.input, { color: ds.c.ink, fontFamily: bodyFont(term ? "500" : "400") }]}
          />
          {term ? <SearchClear label={t("mobileSearch.clear")} onPress={() => setTerm("")} /> : null}
        </View>

        {enabled && (total > 0 || filter !== "all") ? (
          <View style={styles.block}>
            <MobileSegment scroll items={filters} value={filter} onChange={setFilter} />
          </View>
        ) : null}

        {!enabled ? (
          <DsText v="body-sm" c="ink-secondary" style={styles.hint}>
            {t("searchHint")}
          </DsText>
        ) : search.loading && !search.items.length ? (
          <View style={[styles.card, styles.block, { backgroundColor: ds.c.surface }]}>
            {Array.from({ length: 4 }, (_, index) => (
              <View key={index} style={[styles.row, index < 3 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
                <View style={[styles.icon, { backgroundColor: ds.c.skeleton }]} />
                <View style={[styles.text, styles.skeletonText]}>
                  <View style={[styles.skeletonLine, { width: 176, backgroundColor: ds.c.skeleton }]} />
                  <View style={[styles.skeletonLine, styles.skeletonShort, { backgroundColor: ds.c.skeleton }]} />
                </View>
              </View>
            ))}
          </View>
        ) : !search.items.length ? (
          <View style={styles.block}>
            <MobileEmptyCard icon="search" title={t("mobileSearch.emptyTitle")} description={t("mobileSearch.emptyHint", { query: term.trim() })} />
          </View>
        ) : null}

        {show("groups") && groups.length ? (
          <ResultSection title={t("mobileSearch.groups", { count: countOf("groups") })}>
            {groups.map((hit, index) => (
              <ResultRow
                key={hit.id}
                icon="person"
                tone="bg-brand-subtle text-ink"
                title={hit.title}
                hint={hit.subtitle}
                last={index === groups.length - 1}
                onPress={() => {
                  const room = conversations.data?.find((item) => item.courseId === hit.id);
                  go(room ? routes.chat(room.id) : routes.chats);
                }}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("lessons") && lessonHits.length ? (
          <ResultSection title={t("mobileSearch.lessons", { count: countOf("lessons") })}>
            {lessonHits.map((hit, index) => (
              <ResultRow
                key={hit.id}
                icon="clock"
                tone="bg-accent-teal-bg text-accent-teal-fg"
                title={hit.subtitle && hit.subtitle !== hit.title ? `${hit.subtitle} — ${hit.title}` : hit.title}
                hint={lessonMoment(hit.startsAt)}
                last={index === lessonHits.length - 1}
                onPress={() => go(routes.schedule)}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("quizzes") && quizHits.length ? (
          <ResultSection title={t("mobileSearch.quizzes", { count: countOf("quizzes") })}>
            {quizHits.map((hit, index) => (
              <ResultRow
                key={hit.id}
                icon="quiz"
                tone="bg-accent-violet-bg text-accent-violet-fg"
                title={hit.title}
                hint={hit.subtitle}
                last={index === quizHits.length - 1}
                onPress={() => openQuiz(hit)}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("messages") && messageHits.length ? (
          <ResultSection title={t("mobileSearch.messages", { count: countOf("messages") })}>
            {messageHits.map((hit, index) => (
              <ResultRow
                key={hit.id}
                icon="chat"
                tone="bg-success-bg text-success-fg"
                title={hit.title}
                hint={[hit.subtitle, hit.sender].filter(Boolean).join(" · ")}
                last={index === messageHits.length - 1}
                onPress={() => go(hit.roomId ? routes.chat(hit.roomId) : routes.chats)}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("people") && people.length ? (
          <ResultSection title={t("mobileSearch.people", { count: countOf("people") })}>
            {people.map((hit, index) => (
              <ResultRow
                key={hit.id}
                avatar={{ name: hit.title, src: hit.avatarUrl }}
                title={hit.title}
                hint={hit.subtitle}
                last={index === people.length - 1}
                onPress={() => go(hit.roomId ? routes.chat(hit.roomId) : routes.chats)}
              />
            ))}
          </ResultSection>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  const ds = useDs();
  return (
    <View style={styles.section}>
      <DsText>{title}</DsText>
      <View style={[styles.card, { backgroundColor: ds.c.surface }]}>{children}</View>
    </View>
  );
}

function ResultRow({
  icon,
  tone,
  avatar,
  title,
  hint,
  last,
  onPress,
}: {
  icon?: IconName;
  tone?: string;
  avatar?: { name: string; src: string | null };
  title: string;
  hint: string;
  last: boolean;
  onPress: () => void;
}) {
  const ds = useDs();
  const colors = toneColors(tone ?? "", ds);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
        pressed && { backgroundColor: ds.c.subtle },
      ]}
    >
      {avatar ? (
        <Avatar variant="legacy" name={avatar.name} src={avatar.src ?? undefined} size="sm" box={40} />
      ) : (
        <View style={[styles.icon, { backgroundColor: colors.bg }]}>
          <Icon name={icon ?? "search"} size={20} color={colors.fg ?? ds.c.ink} />
        </View>
      )}
      <View style={styles.text}>
        <DsText v="title" numberOfLines={1}>
          {title}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
          {hint}
        </DsText>
      </View>
      <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: { paddingHorizontal: 16 },
  search: { marginTop: 20, height: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, borderWidth: 1.5, borderRadius: dsRadius.full },
  input: { flex: 1, minWidth: 0, height: "100%", paddingVertical: 0, fontSize: dsType.body.fontSize },
  block: { marginTop: 20 },
  hint: { marginTop: 20, paddingHorizontal: 4 },
  /* `mt-5 gap-2.5` */
  section: { marginTop: 20, gap: 10 },
  card: { overflow: "hidden", borderRadius: dsRadius.xl },
  /* `border-b px-4 py-3.75 gap-3` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  icon: { width: 40, height: 40, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0 },
  skeletonText: { gap: 8 },
  skeletonLine: { height: 14, maxWidth: "100%", borderRadius: dsRadius.full },
  skeletonShort: { width: 112, height: 12 },
});
