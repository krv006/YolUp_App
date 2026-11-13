import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import type { AudienceInput } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { useUserSearch } from "@/modules/notification";
import { Avatar, CheckboxMark, DsText, dsRadius, Icon, MobileSearchField, useDs } from "@/shared/ui";

export interface AudiencePickerProps {
  value: AudienceInput;
  onChange: (value: AudienceInput) => void;
  excludeCourseIds?: string[];
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

/**
 * Kanal yoki club auditoriyasi — veb `audience-picker.tsx`: guruhlar
 * (belgilash ro'yxati) va qidiruv orqali alohida o'quvchilar (chip'lar).
 */
export function AudiencePicker({ value, onChange, excludeCourseIds = [] }: AudiencePickerProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const courses = useCourses();
  const [query, setQuery] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const search = useUserSearch(query.trim());
  const students = (search.data ?? []).filter((person) => person.role === "student");
  const courseItems = (courses.data ?? []).filter((course) => !excludeCourseIds.includes(course.id));
  const listStyle = [styles.list, { borderColor: ds.c.line }];
  const divider = { borderBottomWidth: 1, borderBottomColor: ds.c.line };

  return (
    <View style={styles.root}>
      <View style={styles.section}>
        <DsText v="body-xs" c="ink-secondary">
          {t("audience.groups")}
        </DsText>
        {/* `max-h-52 overflow-y-auto rounded-xl border border-line` */}
        <ScrollView style={listStyle} nestedScrollEnabled>
          {courseItems.map((course, index) => {
            const checked = value.courseIds.includes(course.id);
            return (
              <Pressable
                key={course.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => onChange({ ...value, courseIds: toggle(value.courseIds, course.id) })}
                style={[styles.row, index < courseItems.length - 1 && divider, checked && { backgroundColor: ds.c["brand-subtle"] }]}
              >
                <CheckboxMark checked={checked} />
                <DsText v="body" numberOfLines={1} style={styles.grow}>
                  {course.title}
                </DsText>
                <DsText v="caption" c="ink-secondary">
                  {t("audience.studentsCount", { count: course.studentCount || course.students })}
                </DsText>
              </Pressable>
            );
          })}
          {!courseItems.length ? (
            <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
              {courses.isLoading ? t("audience.loading") : t("audience.noGroups")}
            </DsText>
          ) : null}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <DsText v="body-xs" c="ink-secondary">
          {t("audience.students")}
        </DsText>
        {value.studentIds.length ? (
          <View style={styles.chips}>
            {value.studentIds.map((id) => (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={t("audience.removeStudent", { name: names[id] ?? "" })}
                onPress={() => onChange({ ...value, studentIds: value.studentIds.filter((item) => item !== id) })}
                style={[styles.chip, { backgroundColor: ds.c["brand-subtle"] }]}
              >
                <DsText v="caption-strong" c="brand" numberOfLines={1}>
                  {names[id] ?? id}
                </DsText>
                <Icon name="close" size={14} color={ds.c.brand} />
              </Pressable>
            ))}
          </View>
        ) : null}
        <MobileSearchField
          value={query}
          onChange={setQuery}
          placeholder={t("audience.searchPlaceholder")}
          ariaLabel={t("audience.searchPlaceholder")}
          clearLabel={t("create.cancel")}
          style={{ borderWidth: 1, borderColor: ds.c.line }}
        />
        {query.trim().length >= 2 ? (
          <ScrollView style={listStyle} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {students.map((person, index) => {
              const picked = value.studentIds.includes(person.id);
              return (
                <Pressable
                  key={person.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: picked }}
                  onPress={() => {
                    setNames((current) => ({ ...current, [person.id]: person.name }));
                    onChange({ ...value, studentIds: toggle(value.studentIds, person.id) });
                  }}
                  style={({ pressed }) => [styles.person, index < students.length - 1 && divider, pressed && { backgroundColor: ds.c.subtle }]}
                >
                  <Avatar variant="legacy" name={person.name} src={person.avatar ?? undefined} size="sm" box={36} />
                  <View style={styles.grow}>
                    <DsText v="title-sm" numberOfLines={1}>
                      {person.name}
                    </DsText>
                    <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                      @{person.username}
                    </DsText>
                  </View>
                  <CheckboxMark checked={picked} />
                </Pressable>
              );
            })}
            {!students.length ? (
              <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
                {search.isLoading ? t("audience.loading") : t("audience.noStudents")}
              </DsText>
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  section: { gap: 8 },
  list: { maxHeight: 208, borderWidth: 1, borderRadius: dsRadius.xl },
  /* `min-h-12 gap-3 px-4 py-2` */
  row: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  person: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  grow: { flex: 1, minWidth: 0 },
  empty: { paddingHorizontal: 16, paddingVertical: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  /* `h-8 gap-1.5 rounded-full pr-2 pl-3` */
  chip: { height: 32, maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 12, paddingRight: 8, borderRadius: 16 },
});
