import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { AlarmClock } from "lucide-react-native";
import { useAuth, useUpdateLessonReminderMutation, useUpdateNotificationPrefsMutation } from "@/modules/auth";
import { ROLES } from "@/shared/constants";
import { useLanguageStore, useTextSizeStore, type AppLanguage, type TextSize } from "@/shared/model";
import { useAppearanceStore, type ThemeMode } from "@/shared/model/theme.store";
import {
  GradientFill,
  Icon,
  radius,
  SelectField,
  Sheet,
  SheetButton,
  SheetFooter,
  Slider,
  Switch,
  Text,
  toast,
  useTheme,
  type IconName,
} from "@/shared/ui";
import { ProfileSubPage, SectionLabel, SettingsRow, SettingsSection } from "./profile-shell";

const LANGUAGES: ReadonlyArray<{ id: AppLanguage; label: string }> = [
  { id: "uz", label: "O‘zbekcha" },
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
];

const SIZES: TextSize[] = ["small", "medium", "large"];

const MINUTE_OPTIONS = [5, 10, 15, 30, 60];

/** Tizim sozlamalari — veb `pages/profile/system-settings-page.tsx`. */
export function SystemSettingsPage() {
  const { t } = useTranslation("account");
  const { palette } = useTheme();
  const queryClient = useQueryClient();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const mode = useAppearanceStore((state) => state.mode);
  const setMode = useAppearanceStore((state) => state.setMode);
  const size = useTextSizeStore((state) => state.size);
  const setSize = useTextSizeStore((state) => state.setSize);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [draftLanguage, setDraftLanguage] = useState(language);

  const themes: ReadonlyArray<{ id: ThemeMode; label: string }> = [
    { id: "light", label: t("page.themeLight") },
    { id: "dark", label: t("page.themeDark") },
    { id: "system", label: t("page.themeSystem") },
  ];

  return (
    <ProfileSubPage title={t("page.systemTitle")}>
      <SettingsSection label={t("page.generalSection")}>
        <View style={styles.block}>
          <BlockHead icon="more" tone={palette.primary} title={t("page.language")} hint={t("page.languageHint")} />
          <View style={[styles.segment, { backgroundColor: palette["surface-subtle"] }]}>
            {LANGUAGES.map((item) => {
              const active = language === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setDraftLanguage(item.id);
                    setLanguageOpen(true);
                  }}
                  style={[styles.segmentItem, active && [styles.segmentActive, { backgroundColor: palette.surface }]]}
                >
                  <Text variant="label" style={{ color: active ? palette.foreground : palette["muted-foreground"] }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.block}>
          <BlockHead icon="clock" tone={palette["saffron-strong"]} title={t("page.theme")} hint={t("page.themeHint")} />
          <View style={styles.themes}>
            {themes.map((item) => {
              const active = mode === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => setMode(item.id)}
                  style={[
                    styles.theme,
                    active
                      ? { borderColor: palette.primary, backgroundColor: palette["primary-soft"] }
                      : { borderColor: palette.border, backgroundColor: palette.surface },
                  ]}
                >
                  <ThemePreview id={item.id} />
                  <View style={styles.themeLabel}>
                    <View style={[styles.radio, { borderColor: active ? palette.primary : palette.border }]}>
                      {active ? <View style={[styles.radioDot, { backgroundColor: palette.primary }]} /> : null}
                    </View>
                    <Text variant="caption">{item.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.block}>
          <View style={styles.head}>
            <View style={[styles.headIcon, { backgroundColor: palette.primary }]}>
              <Icon name="assign" size={18} color="#ffffff" />
            </View>
            <Text variant="label" style={styles.grow}>
              {t("page.textSize")}
            </Text>
            <Text variant="label" style={{ color: palette.primary }}>
              {t(`page.text${size === "small" ? "Small" : size === "large" ? "Large" : "Medium"}`)}
            </Text>
          </View>
          <View style={styles.sizeRow}>
            <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
              A
            </Text>
            <View style={styles.grow}>
              <Slider
                value={SIZES.indexOf(size)}
                min={0}
                max={2}
                step={1}
                onChange={(value) => setSize(SIZES[Math.round(value)] ?? "medium")}
                label={t("page.textSize")}
              />
            </View>
            <Text variant="subheading" style={{ color: palette["subtle-foreground"] }}>
              A
            </Text>
          </View>
        </View>
      </SettingsSection>

      <View style={styles.section}>
        <SectionLabel>{t("page.notificationsSection")}</SectionLabel>
        <View style={[styles.notifications, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <NotificationSettings />
        </View>
      </View>

      <SettingsSection label={t("page.dataSection")}>
        <SettingsRow
          icon="more"
          tone={palette["subtle-foreground"]}
          title={t("page.clearCache")}
          onPress={() => {
            // Vebda saqlangan so'rovlar keshi o'chiriladi; mobilda kesh
            // diskka yozilmaydi, shuning uchun hozir ishlatilmayotganlari.
            queryClient.removeQueries({ type: "inactive" });
            toast.success(t("page.cacheCleared"));
          }}
        />
      </SettingsSection>

      <Sheet open={languageOpen} onClose={() => setLanguageOpen(false)} title={t("page.language")}>
        <View>
          {LANGUAGES.map((item) => {
            const active = draftLanguage === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => setDraftLanguage(item.id)}
                style={[styles.languageOption, active && { backgroundColor: palette["primary-soft"] }]}
              >
                <Text variant="body" style={[styles.grow, { color: active ? palette.primary : palette.foreground }]}>
                  {item.label}
                </Text>
                {active ? <Icon name="check-circle" size={20} color={palette.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
        <SheetFooter>
          <SheetButton title={t("page.cancel")} onPress={() => setLanguageOpen(false)} />
          <SheetButton
            variant="primary"
            title={t("page.save")}
            onPress={() => {
              setLanguage(draftLanguage);
              setLanguageOpen(false);
            }}
          />
        </SheetFooter>
      </Sheet>
    </ProfileSubPage>
  );
}

function BlockHead({ icon, tone, title, hint }: { icon: IconName; tone: string; title: string; hint: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.head}>
      <View style={[styles.headIcon, { backgroundColor: tone }]}>
        <Icon name={icon} size={18} color="#ffffff" />
      </View>
      <View style={styles.grow}>
        <Text variant="label">{title}</Text>
        <Text variant="caption" style={[styles.hint, { color: palette["subtle-foreground"] }]}>
          {hint}
        </Text>
      </View>
    </View>
  );
}

/** `h-12 rounded-lg border` namunasi: oq, to'q va "tizim" (oqdan to'qqa gradient). */
function ThemePreview({ id }: { id: ThemeMode }) {
  const { palette } = useTheme();
  if (id === "system")
    return (
      <View style={[styles.preview, { borderColor: palette.border }]}>
        <GradientFill colors={[palette.surface, palette.foreground]} direction="horizontal" />
      </View>
    );
  return (
    <View
      style={[
        styles.preview,
        { borderColor: palette.border, backgroundColor: id === "dark" ? palette.foreground : palette.surface },
      ]}
    />
  );
}

/**
 * Bildirishnomalar — veb `widgets/account-menu/notification-settings.tsx`.
 *
 * Brauzer push qatori yo'q: vebdagi Web Push ilovada ishlamaydi, qurilma
 * tokeni esa kirishda o'zi ro'yxatdan o'tadi. Chat xabarlari va email
 * kalitlari hamda dars eslatmasi vebdagidek.
 */
function NotificationSettings() {
  const { t } = useTranslation("account");
  const { palette } = useTheme();
  const { user } = useAuth();
  const reminder = useUpdateLessonReminderMutation();
  const prefs = useUpdateNotificationPrefsMutation();
  const minutes = user?.lessonReminderMinutes ?? (user?.role === ROLES.STUDENT ? 15 : 10);

  return (
    <>
      <PrefRow
        label={t("settingsDialog.messagesLabel")}
        hint={t("settingsDialog.messagesHint")}
        checked={user?.notifyMessages !== false}
        disabled={prefs.isPending}
        onChange={(next) => prefs.mutate({ notifyMessages: next })}
      />
      <PrefRow
        label={t("settingsDialog.emailLabel")}
        hint={t("settingsDialog.emailHint")}
        checked={user?.notifyEmail === true}
        disabled={prefs.isPending}
        onChange={(next) => prefs.mutate({ notifyEmail: next })}
      />
      <View style={[styles.settingsRow, { borderColor: palette.border }]}>
        <Text variant="label" style={styles.grow}>
          {t("settingsDialog.reminderLabel")}
        </Text>
        <View style={styles.picker}>
          <SelectField
            hideLabel
            label={t("settingsDialog.reminderLabel")}
            icon={<AlarmClock size={17} color={palette["subtle-foreground"]} />}
            value={String(minutes)}
            onChange={(value) => reminder.mutate(Number(value))}
            options={MINUTE_OPTIONS.map((value) => ({
              value: String(value),
              label: t("settingsDialog.reminderOption", { count: value }),
            }))}
          />
        </View>
      </View>
    </>
  );
}

/** `.account-settings-row` + `Switch`, ostida `.account-settings-hint`. */
function PrefRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  const { palette } = useTheme();
  return (
    <>
      <View style={[styles.settingsRow, { borderColor: palette.border }]}>
        <Text variant="label" style={styles.grow}>
          {label}
        </Text>
        <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} accessibilityLabel={label} />
      </View>
      <Text variant="caption" style={[styles.prefHint, { color: palette["muted-foreground"] }]}>
        {hint}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  hint: { fontWeight: "500" },
  section: { gap: 8 },
  /* `flex flex-col gap-3 p-4` */
  block: { gap: 12, padding: 16 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  headIcon: { width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  /* `rounded-full bg-subtle p-1 gap-1` */
  segment: { flexDirection: "row", gap: 4, padding: 4, borderRadius: radius.full },
  segmentItem: { flex: 1, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
  segmentActive: {
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  themes: { flexDirection: "row", gap: 8 },
  /* `rounded-xl border p-2 gap-2` */
  theme: { flex: 1, alignItems: "center", gap: 8, padding: 8, borderWidth: 1, borderRadius: radius.xl },
  preview: { alignSelf: "stretch", height: 48, borderWidth: 1, borderRadius: radius.lg, overflow: "hidden" },
  themeLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  radio: { width: 14, height: 14, borderWidth: 1, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 8, height: 8, borderRadius: radius.full },
  sizeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  notifications: { gap: 8, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  /* `.account-settings-row` */
  settingsRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13, paddingVertical: 11, borderWidth: 1, borderRadius: 13 },
  picker: { width: "52%", maxWidth: 210 },
  /* `.account-settings-hint` — 12/1.5 */
  prefHint: { marginTop: -2, fontSize: 12, lineHeight: 18, fontWeight: "400" },
  languageOption: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.xl },
});
