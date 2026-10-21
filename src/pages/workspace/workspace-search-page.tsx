import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { useLessons } from "@/modules/lesson";
import { NotificationBell } from "@/modules/notification";
import { quizDisplayTitle, useQuizzes } from "@/modules/quiz";
import { ROLES } from "@/shared/constants";
import { AppBar, AppBarAction, Icon, radius, Screen, Text, useTheme, type IconName } from "@/shared/ui";

type Filter = "all" | "groups" | "lessons" | "quizzes" | "messages";

/**
 * Workspace qidiruvi — veb `pages/workspace/workspace-search-page.tsx`:
 * guruhlar, darslar, testlar va suhbatlar bo'yicha (kamida 2 belgi).
 */
export function WorkspaceSearchPage() {
  const { t } = useTranslation("workspace");
  const { t: tl } = useTranslation("lesson");
  const { palette } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.role === ROLES.STUDENT;
  const rolePrefix = isStudent ? "/student" : "/teacher";
  const workspacePath = `${rolePrefix}/workspace`;

  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const query = term.trim().toLowerCase();
  const enabled = query.length >= 2;

  const courses = useCourses();
  const lessons = useLessons({ page_size: 200 });
  const quizzes = useQuizzes(null);
  const conversations = useConversations(isStudent ? "student" : "teacher");
  const months = tl("list.months", { returnObjects: true }) as string[];

  const goBack = useCallback(() => router.replace(workspacePath as never), [router, workspacePath]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        goBack();
        return true;
      });
      return () => subscription.remove();
    }, [goBack])
  );

  const results = useMemo(() => {
    const matches = (value: string | null | undefined) => Boolean(value && value.toLowerCase().includes(query));
    if (!enabled) return { groups: [], lessons: [], quizzes: [], messages: [] };
    return {
      groups: (courses.data ?? []).filter((item) => matches(item.title)),
      lessons: (lessons.data ?? []).filter((item) => matches(item.title)),
      quizzes: (quizzes.data ?? []).filter((item) => matches(quizDisplayTitle(item))),
      messages: (conversations.data ?? []).filter((item) => matches(item.title) || matches(item.lastMessage)),
    };
  }, [courses.data, lessons.data, quizzes.data, conversations.data, query, enabled]);

  const total = results.groups.length + results.lessons.length + results.quizzes.length + results.messages.length;

  const FILTERS: Array<{ id: Filter; label: string }> = [
    { id: "all", label: t("filterAll", { count: total }) },
    { id: "groups", label: t("filterGroups") },
    { id: "lessons", label: t("filterLessons") },
    { id: "quizzes", label: t("filterQuizzes") },
    { id: "messages", label: t("filterMessages") },
  ];
  const show = (id: Filter) => filter === "all" || filter === id;

  function lessonMoment(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  return (
    <Screen padded={false}>
      <AppBar title={t("title")} back={{ label: t("searchBack"), onPress: goBack }}>
        <AppBarAction name="search" label={t("searchAria")} onPress={() => undefined} />
        <NotificationBell />
      </AppBar>

      {/* `px-4 py-3 gap-3` */}
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("searchTitle")} onPress={goBack} style={styles.back}>
          <Icon name="arrow-back" size={22} color={palette.foreground} />
        </Pressable>
        <View style={[styles.field, { borderColor: palette.primary, backgroundColor: palette.surface }]}>
          <Icon name="search" size={18} color={palette["subtle-foreground"]} />
          <TextInput
            autoFocus
            value={term}
            onChangeText={setTerm}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={palette["subtle-foreground"]}
            accessibilityLabel={t("searchPlaceholder")}
            style={[styles.input, { color: palette.foreground }]}
          />
          {term ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t("searchTitle")} onPress={() => setTerm("")} style={styles.clear}>
              <View style={styles.rotate}>
                <Icon name="add" size={18} color={palette["subtle-foreground"]} />
              </View>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => setFilter(item.id)}
                style={[styles.filter, { backgroundColor: active ? palette["surface-subtle"] : palette.surface }]}
              >
                <Text variant="caption" style={[styles.strong, { color: active ? palette.foreground : palette["muted-foreground"] }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.grow} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {!enabled ? (
          <Text variant="label" style={[styles.hint, { color: palette["subtle-foreground"] }]}>
            {t("searchHint")}
          </Text>
        ) : total === 0 ? (
          <Text variant="label" style={[styles.hint, { color: palette["subtle-foreground"] }]}>
            {t("searchEmpty", { query: term })}
          </Text>
        ) : null}

        {show("groups") && results.groups.length ? (
          <Section label={t("sectionGroups", { count: results.groups.length })}>
            {results.groups.map((course) => (
              <Row
                key={course.id}
                initials={course.title.slice(0, 2).toUpperCase()}
                title={course.title}
                hint={`${t("groupMeta", { count: course.studentCount ?? 0 })} · ${course.subjectLabel || course.subject}`}
                onPress={() => router.push(`${rolePrefix}/chats` as never)}
              />
            ))}
          </Section>
        ) : null}

        {show("lessons") && results.lessons.length ? (
          <Section label={t("sectionLessons", { count: results.lessons.length })}>
            {results.lessons.map((item) => (
              <Row key={item.id} icon="nav-calendar" title={item.title} hint={`${item.courseTitle} · ${lessonMoment(item.startsAt)}`} />
            ))}
          </Section>
        ) : null}

        {show("quizzes") && results.quizzes.length ? (
          <Section label={t("sectionQuizzes", { count: results.quizzes.length })}>
            {results.quizzes.map((quiz) => (
              <Row
                key={quiz.id}
                icon="assign"
                title={quizDisplayTitle(quiz)}
                hint={`${quiz.status === "draft" ? t("draft") : t("published")} · ${t("quizQuestions", { count: quiz.questionCount })}`}
                onPress={() => router.push(`${rolePrefix}/quizzes?quiz=${quiz.id}` as never)}
              />
            ))}
          </Section>
        ) : null}

        {show("messages") && results.messages.length ? (
          <Section label={t("sectionMessages", { count: results.messages.length })}>
            {results.messages.map((room) => (
              <Row
                key={room.id}
                initials={room.title.slice(0, 2).toUpperCase()}
                title={room.title}
                hint={room.lastMessage}
                onPress={() => router.push(`${rolePrefix}/chats/${room.id}` as never)}
              />
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode[] }) {
  const { palette } = useTheme();
  return (
    <View style={styles.section}>
      <Text variant="caption" style={[styles.overline, { color: palette["subtle-foreground"] }]}>
        {label}
      </Text>
      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        {children.map((child, index) => (
          <View key={index} style={index > 0 && { borderTopWidth: 1, borderTopColor: palette.border }}>
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}

function Row({
  icon,
  initials,
  title,
  hint,
  onPress,
}: {
  icon?: IconName;
  initials?: string;
  title: string;
  hint: string;
  onPress?: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette["surface-subtle"] }]}
    >
      {icon ? (
        <View style={[styles.mark, styles.markSquare, { backgroundColor: palette.primary }]}>
          <Icon name={icon} size={18} color={palette["primary-foreground"]} />
        </View>
      ) : (
        <View style={[styles.mark, { backgroundColor: palette["primary-soft"] }]}>
          <Text variant="label" style={[styles.initials, { color: palette.primary }]}>
            {initials}
          </Text>
        </View>
      )}
      <View style={styles.grow}>
        <Text variant="label" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" numberOfLines={1} style={[styles.caption, { color: palette["subtle-foreground"] }]}>
          {hint}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  strong: { fontWeight: "600" },
  caption: { fontWeight: "500" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  back: { width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  /* `h-12 rounded-full border border-focus px-4 gap-3` */
  field: { flex: 1, height: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderWidth: 1, borderRadius: radius.full },
  input: { flex: 1, height: "100%", fontSize: 16, fontFamily: "Onest-Regular" },
  clear: { width: 28, height: 28, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  rotate: { transform: [{ rotate: "45deg" }] },
  /* `gap-2 px-4 pb-3` */
  filters: { gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  filter: { height: 36, justifyContent: "center", paddingHorizontal: 14, borderRadius: radius.full },
  body: { gap: 20, paddingHorizontal: 16, paddingBottom: 24 },
  hint: { paddingHorizontal: 4, fontWeight: "400" },
  section: { gap: 8 },
  overline: { paddingHorizontal: 4, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  card: { overflow: "hidden", borderWidth: 1, borderRadius: radius.xl },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  mark: { width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  markSquare: { borderRadius: radius.xl },
  initials: { fontFamily: "Unbounded-SemiBold" },
});
