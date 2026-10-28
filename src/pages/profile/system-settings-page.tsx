import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Linking, Pressable, StyleSheet, View } from "react-native";
import * as Notifications from "expo-notifications";
import { useAuth, useUpdateLessonReminderMutation } from "@/modules/auth";
import { ROLES } from "@/shared/constants";
import { useLanguageStore, useTextSizeStore, type TextSize } from "@/shared/model";
import { useAppearanceStore, type ThemeMode } from "@/shared/model/theme.store";
import { DsText, dsRadius, Icon, MobileButton, Sheet, Switch, toast, toneColors, useDs, type IconName } from "@/shared/ui";
import { ProfileSubPage, SettingsRow, SettingsSection } from "./profile-shell";
import { SETTINGS_TONES } from "./settings-tones";

const LANGUAGES = [
  { id: "uz", label: "O‘zbekcha" },
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
] as const;

type LanguageId = (typeof LANGUAGES)[number]["id"];

const SIZES: TextSize[] = ["small", "medium", "large"];
const MINUTE_OPTIONS = [5, 10, 15, 30, 60];

/**
 * Bildirishnoma ruxsati — vebdagi `usePushNotifications` o'rniga OS ruxsati.
 * Ilova ruxsatni o'zi bekor qila olmaydi, shuning uchun o'chirishda tizim
 * sozlamalari ochiladi; ilovaga qaytilganda holat qayta o'qiladi.
 */
function usePushPermission() {
  const [granted, setGranted] = useState(false);

  const refresh = useCallback(() => {
    void Notifications.getPermissionsAsync().then((result) => setGranted(result.granted));
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener("change", (state) => state === "active" && refresh());
    return () => subscription.remove();
  }, [refresh]);

  async function toggle(next: boolean) {
    if (!next) {
      await Linking.openSettings();
      return;
    }
    const result = await Notifications.requestPermissionsAsync();
    if (result.granted) setGranted(true);
    else if (!result.canAskAgain) await Linking.openSettings();
  }

  return { granted, toggle };
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: ReadonlyArray<{ id: T; label: string }>; onChange: (next: T) => void }) {
  const ds = useDs();
  return (
    <View style={[styles.segmented, { backgroundColor: ds.c.subtle }]}>
      {options.map((option) => {
        const active = value === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.id)}
            style={[styles.segment, active && { backgroundColor: ds.c.brand }]}
          >
            <DsText v="body-sm" w="500" c={active ? "on-action" : "ink"} numberOfLines={1}>
              {option.label}
            </DsText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Belgi va sarlavha, ostida segment — `px-4 pt-3 pb-3.5 gap-[11px]`. */
function SegmentedRow({ icon, tone, title, children }: { icon: IconName; tone: string; title: string; children: ReactNode }) {
  const ds = useDs();
  const colors = toneColors(tone, ds);
  return (
    <View style={styles.segmentedRow}>
      <View style={styles.segmentedHead}>
        <View style={[styles.rowIcon, { backgroundColor: colors.bg }]}>
          <Icon name={icon} size={20} color={colors.fg ?? ds.c.ink} />
        </View>
        <DsText v="title" numberOfLines={1} style={styles.grow}>
          {title}
        </DsText>
      </View>
      {children}
    </View>
  );
}

function OptionRow({ label, selected, disabled, onPress }: { label: string; selected: boolean; disabled?: boolean; onPress: () => void }) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.option, selected ? { backgroundColor: ds.c["brand-subtle"] } : pressed && { backgroundColor: ds.c.subtle }]}
    >
      <DsText c={selected ? "brand" : "ink"} numberOfLines={1} style={styles.grow}>
        {label}
      </DsText>
      {selected ? <Icon name="check-circle" size={20} color={ds.c.brand} /> : null}
    </Pressable>
  );
}

/**
 * Tizim sozlamalari — veb `system-settings-page.tsx` (tor ekran): til, mavzu
 * va matn o'lchami; push-bildirishnomalar va dars eslatmasi.
 */
export function SystemSettingsPage() {
  const { t } = useTranslation("account");
  const { user } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const mode = useAppearanceStore((state) => state.mode);
  const setMode = useAppearanceStore((state) => state.setMode);
  const size = useTextSizeStore((state) => state.size);
  const setSize = useTextSizeStore((state) => state.setSize);
  const push = usePushPermission();
  const reminder = useUpdateLessonReminderMutation();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [draftLanguage, setDraftLanguage] = useState<LanguageId>(language);

  const minutes = user?.lessonReminderMinutes ?? (user?.role === ROLES.STUDENT ? 15 : 10);
  const languageLabel = LANGUAGES.find((item) => item.id === language)?.label ?? "";

  return (
    <ProfileSubPage title={t("page.systemTitle")}>
      <SettingsSection label={t("page.generalSectionTitle")}>
        <SettingsRow
          icon="settings"
          tone={SETTINGS_TONES.brand}
          title={t("page.language")}
          value={languageLabel}
          onPress={() => {
            setDraftLanguage(language);
            setLanguageOpen(true);
          }}
        />
        <SegmentedRow icon="star" tone={SETTINGS_TONES.violet} title={t("page.theme")}>
          <Segmented<ThemeMode>
            value={mode}
            onChange={setMode}
            options={[
              { id: "light", label: t("page.themeLight") },
              { id: "dark", label: t("page.themeDark") },
              { id: "system", label: t("page.themeSystem") },
            ]}
          />
        </SegmentedRow>
        <SegmentedRow icon="edit" tone={SETTINGS_TONES.warning} title={t("page.textSize")}>
          <Segmented<TextSize>
            value={size}
            onChange={setSize}
            options={[
              { id: SIZES[0]!, label: t("page.textSmall") },
              { id: SIZES[1]!, label: t("page.textMedium") },
              { id: SIZES[2]!, label: t("page.textLarge") },
            ]}
          />
        </SegmentedRow>
      </SettingsSection>

      <SettingsSection label={t("page.notificationsSectionTitle")}>
        <SettingsRow
          icon="bell"
          tone={SETTINGS_TONES.brand}
          title={t("page.pushTitle")}
          hint={push.granted ? t("page.pushOn") : t("page.pushOff")}
          right={<Switch size="lg" checked={push.granted} onCheckedChange={(next) => void push.toggle(next)} accessibilityLabel={t("page.pushTitle")} />}
        />
        <SettingsRow icon="clock" tone={SETTINGS_TONES.success} title={t("page.lessonReminder")} value={t("page.reminderValue", { count: minutes })} onPress={() => setReminderOpen(true)} />
      </SettingsSection>

      <Sheet
        variant="app"
        open={languageOpen}
        onClose={() => setLanguageOpen(false)}
        title={t("page.language")}
        footer={
          <>
            <MobileButton variant="secondary" label={t("page.cancel")} onPress={() => setLanguageOpen(false)} />
            <MobileButton
              label={t("page.save")}
              onPress={() => {
                setLanguage(draftLanguage);
                setLanguageOpen(false);
              }}
            />
          </>
        }
      >
        <View style={styles.options}>
          {LANGUAGES.map((item) => (
            <OptionRow key={item.id} label={item.label} selected={draftLanguage === item.id} onPress={() => setDraftLanguage(item.id)} />
          ))}
        </View>
      </Sheet>

      <Sheet variant="app" open={reminderOpen} onClose={() => setReminderOpen(false)} title={t("page.lessonReminder")}>
        <View style={[styles.options, styles.reminderOptions]}>
          {MINUTE_OPTIONS.map((option) => (
            <OptionRow
              key={option}
              label={t("page.reminderValue", { count: option })}
              selected={minutes === option}
              disabled={reminder.isPending}
              onPress={() =>
                reminder.mutate(option, {
                  onSuccess: () => setReminderOpen(false),
                  onError: (error: Error) => toast.error(error.message),
                })
              }
            />
          ))}
        </View>
      </Sheet>
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  segmentedRow: { gap: 11, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  segmentedHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowIcon: { width: 40, height: 40, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  /* `rounded-full bg-subtle p-[5px] gap-1`, tugma `h-10` */
  segmented: { flexDirection: "row", gap: 4, padding: 5, borderRadius: 999 },
  segment: { flex: 1, minWidth: 0, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  options: { gap: 4 },
  reminderOptions: { paddingBottom: 20 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.md },
});
