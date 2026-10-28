import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { CreateChildRequestDto } from "@/modules/auth";
import {
  Avatar,
  bodyFont,
  DsText,
  dsRadius,
  dsType,
  Icon,
  MobileButton,
  MobileFieldLabel,
  MobileInput,
  Sheet,
  toast,
  useDs,
} from "@/shared/ui";
import { useCreateCourseStudent, useEnrollStudent, useSearchCourseStudents } from "../model/course.queries";
import { InviteLinkSheet } from "./invite-link-sheet";

export interface AddStudentSheetProps {
  open: boolean;
  onClose: () => void;
  courseId: string | null;
  /** `create` — to'g'ridan-to'g'ri yangi hisob formasi bilan ochiladi. */
  initialTab?: "search" | "create";
}

const LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "s", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "",
  э: "e", ю: "yu", я: "ya", ʻ: "", "'": "", "’": "",
};

function slug(value: string): string {
  return value
    .toLowerCase()
    .split("")
    .map((char) => LATIN[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
}

function buildLogin(first: string, last: string): string {
  return [slug(first), slug(last)].filter(Boolean).join(".");
}

function randomPassword(): string {
  const letters = "abcdefghijkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const pick = (source: string, count: number) =>
    Array.from({ length: count }, () => source[Math.floor(Math.random() * source.length)]).join("");
  return `${pick(upper, 1)}${pick(digits, 1)}${pick(letters, 1)}-${pick(digits, 2)}${pick(letters, 1)}${pick(upper, 1)}`;
}

/**
 * O'quvchi qo'shish — veb `add-student-dialog.tsx` (tor ekranda pastki
 * oyna): qidiruv (kamida 2 harf), belgilab bir nechtasini qo'shish, "Yangi
 * hisob" va "Taklif havolasi"; yangi hisob — alohida oyna (ism, familiya,
 * avtomatik login va parol, ota-ona telefoni).
 */
export function AddStudentSheet({ open, onClose, courseId, initialTab = "search" }: AddStudentSheetProps) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(initialTab === "create");
  const [inviteOpen, setInviteOpen] = useState(false);
  const results = useSearchCourseStudents(open ? courseId : null, debounced);
  const enroll = useEnrollStudent();

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 350);
    return () => clearTimeout(id);
  }, [term]);

  function close() {
    setTerm("");
    setDebounced("");
    setSelected([]);
    onClose();
  }

  const items = results.data ?? [];
  const tooShort = debounced.trim().length < 2;
  const empty = !tooShort && !results.isLoading && !results.isError && !items.length;

  function toggle(studentId: string) {
    setSelected((current) => (current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]));
  }

  async function addSelected() {
    if (!courseId || !selected.length) return;
    await Promise.allSettled(selected.map((studentId) => enroll.mutateAsync({ courseId, studentId })));
    toast.success(t("addStudent.added", { count: selected.length }));
    close();
  }

  return (
    <>
      <Sheet
        variant="app"
        open={open && !createOpen && !inviteOpen}
        onClose={close}
        title={t("addStudent.title")}
        description={t("addStudent.description")}
        footer={
          empty ? undefined : (
            <>
              <MobileButton variant="secondary" label={t("addStudent.cancel")} onPress={close} />
              <MobileButton label={t("addStudent.submit", { count: selected.length })} disabled={!selected.length || enroll.isPending} onPress={() => void addSelected()} />
            </>
          )
        }
      >
        {/* `h-12.5 rounded-md bg-subtle px-4 gap-3` */}
        <View style={[styles.search, { backgroundColor: ds.c.subtle }]}>
          <Icon name="search" size={18} color={ds.c["icon-tertiary"]} />
          <TextInput
            autoFocus
            value={term}
            onChangeText={setTerm}
            placeholder={t("addStudent.searchPlaceholder")}
            placeholderTextColor={ds.c["ink-tertiary"]}
            accessibilityLabel={t("addStudent.searchPlaceholder")}
            selectionColor={ds.c.brand}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.searchInput, { color: ds.c.ink }]}
          />
          {term ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t("addStudent.cancel")} onPress={() => setTerm("")} hitSlop={8} style={styles.clear}>
              <Icon name="close" size={16} color={ds.c["icon-tertiary"]} />
            </Pressable>
          ) : null}
        </View>

        {tooShort ? (
          <DsText v="body-sm" c="ink-tertiary" style={styles.hint}>
            {t("addStudent.searchHint")}
          </DsText>
        ) : results.isLoading ? (
          <View style={styles.skeletons}>
            {Array.from({ length: 3 }, (_, index) => (
              <View key={index} style={[styles.skeleton, { backgroundColor: ds.c.muted }]} />
            ))}
          </View>
        ) : results.isError ? (
          <DsText v="body-sm" c="danger" style={styles.hint}>
            {results.error.message}
          </DsText>
        ) : items.length ? (
          <View style={styles.results}>
            {items.map((student) => {
              const member = Boolean(student.enrollStatus) && student.enrollStatus !== "declined";
              const checked = selected.includes(student.id);
              return (
                <Pressable
                  key={student.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked, disabled: member }}
                  disabled={member}
                  onPress={() => toggle(student.id)}
                  style={[styles.result, checked && { backgroundColor: ds.c["brand-subtle"] }, member && styles.dim]}
                >
                  <Avatar variant="legacy" name={student.name} tone={student.avatarTone} size="sm" />
                  <View style={styles.grow}>
                    <DsText v="title-sm" numberOfLines={1}>
                      {student.name}
                    </DsText>
                    <DsText v="body-xs" c="ink-tertiary" numberOfLines={1}>
                      {member ? t("addStudent.alreadyMember") : `@${student.username}`}
                    </DsText>
                  </View>
                  <View style={[styles.check, checked ? { backgroundColor: ds.c.brand } : { borderWidth: 2, borderColor: ds.c["line-strong"], backgroundColor: ds.c.surface }]}>
                    {checked ? <Icon name="check" size={14} color={ds.c["ink-inverse"]} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.notFound}>
            <View style={[styles.notFoundIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
              <Icon name="person" size={30} color={ds.c.brand} />
            </View>
            <DsText v="body-sm" c="ink-secondary" style={styles.center}>
              {t("addStudent.notFound")}
            </DsText>
          </View>
        )}

        <View style={empty ? styles.stack : styles.pair}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setCreateOpen(true)}
            style={({ pressed }) => [
              styles.action,
              empty ? { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand } : { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] },
            ]}
          >
            <Icon name="person-add" size={18} color={empty ? ds.c["ink-inverse"] : ds.c.brand} />
            <DsText v="button" c={empty ? "ink-inverse" : "brand"} numberOfLines={1}>
              {empty ? t("addStudent.createAccount") : t("addStudent.createAccountShort")}
            </DsText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setInviteOpen(true)}
            style={({ pressed }) => [styles.action, { borderWidth: 1, borderColor: ds.c.line, backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
          >
            <Icon name="send" size={18} color={ds.c.ink} />
            <DsText v="button" numberOfLines={1}>
              {empty ? t("addStudent.shareInvite") : t("addStudent.inviteShort")}
            </DsText>
          </Pressable>
        </View>
      </Sheet>

      <InviteLinkSheet courseId={courseId} open={open && inviteOpen} onClose={() => setInviteOpen(false)} />

      <CreateStudentSheet
        courseId={courseId}
        open={open && createOpen}
        onClose={(created) => {
          setCreateOpen(false);
          if (created || initialTab === "create") close();
        }}
      />
    </>
  );
}

function CreateStudentSheet({ courseId, open, onClose }: { courseId: string | null; open: boolean; onClose: (created: boolean) => void }) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loginEdited, setLoginEdited] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState(() => randomPassword());
  const [phone, setPhone] = useState("");
  const createStudent = useCreateCourseStudent();

  const suggested = useMemo(() => buildLogin(firstName, lastName), [firstName, lastName]);
  const username = loginEdited ? login : suggested;

  function reset() {
    setFirstName("");
    setLastName("");
    setLogin("");
    setLoginEdited(false);
    setPhone("");
    setPassword(randomPassword());
  }

  function submit() {
    if (!courseId) return;
    const payload: CreateChildRequestDto = {
      username: username.trim(),
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      ...(phone.trim() ? { parent_phone: phone.trim() } : {}),
      course_id: courseId,
    };
    createStudent.mutate(
      { courseId, form: payload },
      {
        onSuccess: () => {
          reset();
          onClose(true);
        },
      }
    );
  }

  const filled = Boolean(firstName.trim() && lastName.trim() && username.trim() && courseId && password.length >= 8);

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => {
        reset();
        onClose(false);
      }}
      title={t("addStudent.createTitle")}
      description={t("addStudent.createDescription")}
      footer={<MobileButton label={t("addStudent.createSubmit")} disabled={!filled || createStudent.isPending} onPress={submit} />}
    >
      <View style={styles.pair}>
        <View style={styles.grow}>
          <MobileFieldLabel label={t("addStudent.firstName")}>
            <MobileInput value={firstName} onChangeText={setFirstName} />
          </MobileFieldLabel>
        </View>
        <View style={styles.grow}>
          <MobileFieldLabel label={t("addStudent.lastName")}>
            <MobileInput value={lastName} onChangeText={setLastName} />
          </MobileFieldLabel>
        </View>
      </View>

      <MobileFieldLabel label={t("addStudent.login")}>
        <View style={[styles.inline, { backgroundColor: ds.c.subtle }]}>
          <TextInput
            value={username}
            onChangeText={(value) => {
              setLoginEdited(true);
              setLogin(value);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor={ds.c.brand}
            style={[styles.inlineInput, { color: ds.c.ink }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("addStudent.regenerate")}
            onPress={() => {
              setLoginEdited(false);
              setLogin("");
            }}
            style={[styles.inlineButton, { backgroundColor: ds.c.surface }]}
          >
            <Icon name="refresh" size={18} color={ds.c["ink-secondary"]} />
          </Pressable>
        </View>
      </MobileFieldLabel>

      <MobileFieldLabel label={t("addStudent.password")}>
        <View style={[styles.inline, styles.inlinePadded, { backgroundColor: ds.c.subtle }]}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor={ds.c.brand}
            style={[styles.inlineInput, { color: ds.c.ink, fontVariant: ["tabular-nums"] }]}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void Clipboard.setStringAsync(password);
              toast.success(t("addStudent.passwordCopied"));
            }}
            hitSlop={8}
          >
            <DsText v="button" c="brand">
              {t("addStudent.copy")}
            </DsText>
          </Pressable>
        </View>
      </MobileFieldLabel>

      <MobileFieldLabel label={t("addStudent.parentPhone")}>
        <MobileInput value={phone} onChangeText={setPhone} placeholder="+998 90 123 45 67" keyboardType="phone-pad" />
      </MobileFieldLabel>

      <View style={[styles.note, { backgroundColor: ds.c["brand-subtle"] }]}>
        <Icon name="bolt" size={16} color={ds.c["brand-strong"]} />
        <DsText v="body-xs" c="brand-strong" style={styles.grow}>
          {t("addStudent.createNote")}
        </DsText>
      </View>

      {createStudent.isPending ? <ActivityIndicator color={ds.c.brand} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  dim: { opacity: 0.6 },
  search: { height: 50, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderRadius: dsRadius.md },
  searchInput: { flex: 1, minWidth: 0, height: "100%", padding: 0, fontSize: dsType.body.fontSize, fontFamily: bodyFont("400") },
  clear: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  hint: { paddingHorizontal: 4 },
  skeletons: { gap: 8 },
  skeleton: { height: 56, borderRadius: dsRadius.md },
  results: { gap: 4 },
  /* `gap-3 rounded-md px-3 py-2.5` */
  result: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: dsRadius.md },
  check: { width: 22, height: 22, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  notFound: { alignItems: "center", gap: 12, paddingVertical: 8 },
  notFoundIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  stack: { gap: 12 },
  pair: { flexDirection: "row", gap: 12 },
  action: { flex: 1, minWidth: 0, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 24 },
  inline: { height: 50, flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 16, paddingRight: 6, borderRadius: dsRadius.md },
  inlinePadded: { paddingRight: 16 },
  inlineInput: { flex: 1, minWidth: 0, height: "100%", padding: 0, fontSize: dsType.body.fontSize, fontFamily: bodyFont("400") },
  inlineButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: dsRadius.md },
});
