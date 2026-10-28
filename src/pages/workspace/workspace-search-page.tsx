import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { useLessons } from "@/modules/lesson";
import { quizDisplayTitle, useQuizzes } from "@/modules/quiz";
import {
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

type Filter = "all" | "groups" | "lessons" | "quizzes" | "messages";

/**
 * Qidiruv (M5.9–5.10) — veb `pages/workspace/workspace-search-page.tsx`:
 * kamida 2 harf, natijalar guruhlar, darslar (guruh nomi bo'yicha ham),
 * testlar va xabarlar bo'limlarida; "Bugun / Ertaga" vaqt ko'rinishi.
 *
 * Farq: test va dars natijalari mobilning hozirgi sahifalarini ochadi
 * (Workspace marshrutlari 5-bosqichda vebdagidek bo'ladi).
 */
export function WorkspaceSearchPage() {
  const { t } = useTranslation("workspace");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isStudent = useIsStudent();
  const routes = useRoleRoutes();
  const prefix = isStudent ? "/student" : "/teacher";

  const [term, setTerm] = useState("");
  const [focused, setFocused] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const query = term.trim().toLowerCase();
  const enabled = query.length >= 2;

  const courses = useCourses();
  const lessons = useLessons({ page_size: 200 });
  const quizzes = useQuizzes(null);
  const conversations = useConversations(isStudent ? "student" : "teacher");
  const months = tl("list.months", { returnObjects: true }) as string[];

  const groups = useMemo(() => {
    const matches = (value: string | null | undefined) => Boolean(value && value.toLowerCase().includes(query));
    return enabled ? (courses.data ?? []).filter((item) => matches(item.title)) : [];
  }, [courses.data, query, enabled]);
  const lessonHits = useMemo(() => {
    const matches = (value: string | null | undefined) => Boolean(value && value.toLowerCase().includes(query));
    return enabled ? (lessons.data ?? []).filter((item) => matches(item.title) || matches(item.courseTitle)) : [];
  }, [lessons.data, query, enabled]);
  const quizHits = useMemo(() => {
    const matches = (value: string | null | undefined) => Boolean(value && value.toLowerCase().includes(query));
    return enabled ? (quizzes.data ?? []).filter((item) => matches(quizDisplayTitle(item))) : [];
  }, [quizzes.data, query, enabled]);
  const messageHits = useMemo(() => {
    const matches = (value: string | null | undefined) => Boolean(value && value.toLowerCase().includes(query));
    return enabled ? (conversations.data ?? []).filter((item) => matches(item.title) || matches(item.lastMessage)) : [];
  }, [conversations.data, query, enabled]);

  const total = groups.length + lessonHits.length + quizHits.length + messageHits.length;

  const filters: Array<{ id: Filter; label: string }> = [
    { id: "all", label: t("filterAll", { count: total }) },
    { id: "groups", label: t("filterGroups") },
    { id: "lessons", label: t("filterLessons") },
    { id: "quizzes", label: t("filterQuizzes") },
    { id: "messages", label: t("filterMessages") },
  ];

  const show = (id: Filter) => filter === "all" || filter === id;
  const go = (href: string) => router.push(href as never);

  function lessonMoment(value: string): string {
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
          onBack={() => (router.canGoBack() ? router.back() : router.replace(`${prefix}/workspace` as never))}
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

        {enabled && total > 0 ? (
          <View style={styles.block}>
            <MobileSegment scroll items={filters} value={filter} onChange={setFilter} />
          </View>
        ) : null}

        {!enabled ? (
          <DsText v="body-sm" c="ink-secondary" style={styles.hint}>
            {t("searchHint")}
          </DsText>
        ) : total === 0 ? (
          <View style={styles.block}>
            <MobileEmptyCard icon="search" title={t("mobileSearch.emptyTitle")} description={t("mobileSearch.emptyHint", { query: term.trim() })} />
          </View>
        ) : null}

        {show("groups") && groups.length ? (
          <ResultSection title={t("mobileSearch.groups", { count: groups.length })}>
            {groups.map((course, index) => (
              <ResultRow
                key={course.id}
                icon="person"
                tone="bg-brand-subtle text-ink"
                title={course.title}
                hint={`${t("groupMeta", { count: course.studentCount ?? 0 })} · ${course.subjectLabel || course.subject}`}
                last={index === groups.length - 1}
                onPress={() => {
                  const room = conversations.data?.find((item) => item.courseId === course.id);
                  go(room ? routes.chat(room.id) : routes.chats);
                }}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("lessons") && lessonHits.length ? (
          <ResultSection title={t("mobileSearch.lessons", { count: lessonHits.length })}>
            {lessonHits.map((item, index) => (
              <ResultRow
                key={item.id}
                icon="clock"
                tone="bg-accent-teal-bg text-accent-teal-fg"
                title={item.title ? `${item.courseTitle} — ${item.title}` : item.courseTitle}
                hint={lessonMoment(item.startsAt)}
                last={index === lessonHits.length - 1}
                onPress={() => go(routes.schedule)}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("quizzes") && quizHits.length ? (
          <ResultSection title={t("mobileSearch.quizzes", { count: quizHits.length })}>
            {quizHits.map((quiz, index) => (
              <ResultRow
                key={quiz.id}
                icon="quiz"
                tone="bg-accent-violet-bg text-accent-violet-fg"
                title={quizDisplayTitle(quiz)}
                hint={`${quiz.status === "draft" ? t("draft") : t("published")} · ${t("quizQuestions", { count: quiz.questionCount })}`}
                last={index === quizHits.length - 1}
                onPress={() => go(`${prefix}/quizzes?quiz=${quiz.id}`)}
              />
            ))}
          </ResultSection>
        ) : null}

        {show("messages") && messageHits.length ? (
          <ResultSection title={t("mobileSearch.messages", { count: messageHits.length })}>
            {messageHits.map((room, index) => (
              <ResultRow
                key={room.id}
                icon="chat"
                tone="bg-success-bg text-success-fg"
                title={room.title}
                hint={room.lastMessage}
                last={index === messageHits.length - 1}
                onPress={() => go(routes.chat(room.id))}
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
  title,
  hint,
  last,
  onPress,
}: {
  icon: IconName;
  tone: string;
  title: string;
  hint: string;
  last: boolean;
  onPress: () => void;
}) {
  const ds = useDs();
  const colors = toneColors(tone, ds);
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
      <View style={[styles.icon, { backgroundColor: colors.bg }]}>
        <Icon name={icon} size={20} color={colors.fg ?? ds.c.ink} />
      </View>
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
});
