import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import {
  Camera,
  CheckCircle2,
  Clock3,
  History,
  Link2,
  Plus,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Video,
  type LucideIcon,
} from "lucide-react-native";
import { LoginHistorySheet } from "@/modules/auth/ui/login-history-sheet";
import {
  useCreateChild,
  useParentChildren,
  useParentConsents,
  useRequestChildLink,
  useSelectedChild,
  useSetParentConsent,
  type ConsentKind,
} from "@/modules/parent";
import { ParentAppBar } from "@/modules/parent/ui/parent-app-bar";
import { Avatar, Button, Input, PortalButton, PortalCard, PortalEmpty, PortalHeading, portalPage, Screen, ScreenError, ScreenLoading, Sheet, Text, useLegacyColors, useTheme } from "@/shared/ui";

const CONSENT_KINDS: ReadonlyArray<{ id: ConsentKind; icon: LucideIcon }> = [
  { id: "recording", icon: Video },
  { id: "camera", icon: Camera },
  { id: "analytics", icon: Sparkles },
];

const EMPTY_CHILD = { username: "", password: "", first_name: "", last_name: "" };

/**
 * Farzandlarim — veb `parent-children-page.tsx`: sarlavha va ikki amal,
 * farzand kartasi (bosilsa tanlanadi), maxfiylik ruxsatlari, o'quvchini
 * ulash va bola hisobini yaratish oynalari, kirishlar tarixi.
 */
export function ParentChildrenPage() {
  const { t } = useTranslation("parent");
  const { t: tn } = useTranslation("nav");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const childrenQuery = useParentChildren();
  const consents = useParentConsents();
  const requestLink = useRequestChildLink();
  const createChild = useCreateChild();
  const setConsent = useSetParentConsent();
  const { selectedChild, selectedChildId, selectChild } = useSelectedChild();

  const [linkOpen, setLinkOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const [loginsOpen, setLoginsOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [child, setChild] = useState(EMPTY_CHILD);
  const [formError, setFormError] = useState("");

  const appBar = <ParentAppBar a11yTitle={tn("parent.children")} />;

  async function submitLink() {
    setFormError("");
    try {
      await requestLink.mutateAsync(inviteCode.trim());
      setInviteCode("");
      setLinkOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("children.genericError"));
    }
  }

  async function submitChild() {
    setFormError("");
    try {
      await createChild.mutateAsync(child);
      setChild(EMPTY_CHILD);
      setChildOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("children.genericError"));
    }
  }

  function toggleConsent(kind: ConsentKind) {
    if (!selectedChildId) return;
    const current = (consents.data ?? []).find((item) => item.studentId === selectedChildId && item.kind === kind);
    setConsent.mutate({ studentId: selectedChildId, kind, granted: !current?.granted });
  }

  if (childrenQuery.isLoading) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenLoading label={t("children.loading")} />
      </Screen>
    );
  }

  if (childrenQuery.isError) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenError message={t("children.loadError")} onRetry={() => void childrenQuery.refetch()} />
      </Screen>
    );
  }

  const children = childrenQuery.data ?? [];

  return (
    <Screen padded={false}>
      {appBar}
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={portalPage}
        refreshControl={
          <RefreshControl
            refreshing={childrenQuery.isRefetching}
            onRefresh={() => {
              void childrenQuery.refetch();
              void consents.refetch();
            }}
            tintColor={palette["muted-foreground"]}
          />
        }
      >
        <PortalHeading
          eyebrow={t("children.eyebrow")}
          title={t("children.title")}
          description={t("children.subtitle")}
          actions={
            <>
              <PortalButton
                size="dense"
                icon={Link2}
                label={t("children.linkChild")}
                onPress={() => {
                  setFormError("");
                  setLinkOpen(true);
                }}
                style={styles.grow}
              />
              <PortalButton
                size="dense"
                variant="primary"
                icon={Plus}
                label={t("children.createChild")}
                onPress={() => {
                  setFormError("");
                  setChildOpen(true);
                }}
                style={styles.grow}
              />
            </>
          }
        />

        {children.map((item) => {
          const selected = item.id === selectedChildId;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => selectChild(item.id)}
              style={({ pressed }) => [
                styles.childCard,
                {
                  borderColor: selected ? palette.primary : colors.border,
                  backgroundColor: palette.surface,
                  opacity: pressed ? 0.92 : 1,
                },
                // `.is-selected` — tashqi ko'k halqa.
                selected && { boxShadow: `0 0 0 3px ${palette["primary-soft"]}` },
              ]}
            >
              <View style={[styles.status, { backgroundColor: palette["success-soft"] }]}>
                <CheckCircle2 size={15} color={palette["tone-emerald-fg"]} />
                <Text variant="caption" style={[styles.statusText, { color: palette["tone-emerald-fg"] }]}>
                  {selected ? t("children.selected") : t("children.verified")}
                </Text>
              </View>
              <Avatar name={item.name} tone={item.avatarTone} size="lg" />
              <Text variant="body" style={styles.childName}>
                {item.name}
              </Text>
              <Text variant="caption" style={{ color: colors.muted }}>
                {item.username} · {item.grade}
              </Text>
              <View style={[styles.childStats, { borderColor: colors.border }]}>
                <ChildStat icon={CheckCircle2} value={item.lessons} label={t("children.lessonsUnit")} />
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <ChildStat icon={Clock3} value={item.minutes} label={t("children.minutesUnit")} />
              </View>
              <View style={styles.childLast}>
                <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
                  {t("children.lastActivity")}
                </Text>
                <Text variant="caption" style={styles.lastValue}>
                  {item.lastActivity}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {!children.length ? (
          <PortalEmpty icon={UsersRound} title={t("children.emptyTitle")} description={t("children.emptyDescription")} />
        ) : null}

        {selectedChild ? (
          <PortalCard style={styles.consentPanel}>
            {/*
              * Vebda sarlavha va "Kirishlar tarixi" tugmasi bir qatorda turadi
              * va tor ekranda sarlavha uch qatorga sinadi. Bu yerda tugma
              * sarlavha ostida.
              */}
            <View style={styles.consentHead}>
              <View style={styles.grow}>
                <Text variant="caption" style={[styles.sectionEyebrow, { color: colors.muted }]}>
                  {t("children.consentEyebrow")}
                </Text>
                <Text variant="body" style={styles.sectionTitle}>
                  {t("children.consentTitle", { name: selectedChild.name })}
                </Text>
              </View>
              <ShieldCheck size={22} color={colors.foreground} />
            </View>
            <PortalButton
              size="sm"
              icon={History}
              label={t("children.loginsHistory")}
              onPress={() => setLoginsOpen(true)}
              style={styles.historyButton}
            />

            <View style={styles.consentList}>
              {CONSENT_KINDS.map(({ id, icon: Icon }) => {
                const granted = (consents.data ?? []).some(
                  (item) => item.studentId === selectedChildId && item.kind === id && item.granted
                );
                const label = t(`children.consentKinds.${id}.label`);
                const description = t(`children.consentKinds.${id}.description`);
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: granted }}
                    accessibilityLabel={`${label}. ${description}`}
                    disabled={consents.isLoading || setConsent.isPending}
                    onPress={() => toggleConsent(id)}
                    style={({ pressed }) => [
                      styles.consent,
                      pressed
                        ? { borderColor: palette["border-accent"], backgroundColor: palette["primary-soft"] }
                        : { borderColor: colors.border, backgroundColor: palette.surface },
                    ]}
                  >
                    <View style={[styles.consentIcon, { backgroundColor: palette["primary-soft"] }]}>
                      <Icon size={18} color={palette["primary-text"]} />
                    </View>
                    <View style={styles.consentBody}>
                      <Text variant="body" style={styles.consentLabel}>
                        {label}
                      </Text>
                      <Text variant="caption" style={[styles.consentText, { color: colors.muted }]}>
                        {description}
                      </Text>
                    </View>
                    <Text
                      variant="caption"
                      style={[
                        styles.consentState,
                        granted
                          ? { color: palette["success-strong"], backgroundColor: palette["success-soft"] }
                          : { color: colors.muted, backgroundColor: colors.mutedBg },
                      ]}
                    >
                      {granted ? t("children.consentOn") : t("children.consentOff")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {consents.isError ? (
              <Text variant="label" style={{ color: palette["destructive-strong"] }}>
                {t("children.consentLoadError")}
              </Text>
            ) : null}
          </PortalCard>
        ) : null}
      </ScrollView>

      <Sheet
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title={t("children.linkDialog.title")}
        description={t("children.linkDialog.description")}
      >
        <Input
          label={t("children.linkDialog.codeLabel")}
          placeholder={t("children.linkDialog.codePlaceholder")}
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        {formError ? <FormAlert message={formError} /> : null}
        <View style={styles.dialogActions}>
          <Button
            title={t("children.linkDialog.cancel")}
            variant="secondary"
            onPress={() => setLinkOpen(false)}
            style={styles.grow}
          />
          <Button
            title={t("children.linkDialog.submit")}
            loading={requestLink.isPending}
            disabled={!inviteCode.trim()}
            onPress={() => void submitLink()}
            style={styles.grow}
          />
        </View>
      </Sheet>

      <Sheet
        open={childOpen}
        onClose={() => setChildOpen(false)}
        title={t("children.childDialog.title")}
        description={t("children.childDialog.description")}
      >
        <View style={styles.namePair}>
          <Input
            label={t("children.childDialog.firstName")}
            value={child.first_name}
            onChangeText={(value) => setChild((current) => ({ ...current, first_name: value }))}
            autoCapitalize="words"
            containerStyle={styles.grow}
          />
          <Input
            label={t("children.childDialog.lastName")}
            value={child.last_name}
            onChangeText={(value) => setChild((current) => ({ ...current, last_name: value }))}
            autoCapitalize="words"
            containerStyle={styles.grow}
          />
        </View>
        <Input
          label={t("children.childDialog.username")}
          value={child.username}
          onChangeText={(value) => setChild((current) => ({ ...current, username: value }))}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Input
          label={t("children.childDialog.tempPassword")}
          secure
          value={child.password}
          onChangeText={(value) => setChild((current) => ({ ...current, password: value }))}
        />
        {formError ? <FormAlert message={formError} /> : null}
        <View style={styles.dialogActions}>
          <Button
            title={t("children.childDialog.cancel")}
            variant="secondary"
            onPress={() => setChildOpen(false)}
            style={styles.grow}
          />
          <Button
            title={t("children.childDialog.submit")}
            loading={createChild.isPending}
            // Vebdagi `required` va `minLength={8}`.
            disabled={
              !child.first_name.trim() || !child.last_name.trim() || !child.username.trim() || child.password.length < 8
            }
            onPress={() => void submitChild()}
            style={styles.grow}
          />
        </View>
      </Sheet>

      <LoginHistorySheet
        open={loginsOpen}
        onClose={() => setLoginsOpen(false)}
        studentId={selectedChildId}
        title={t("children.loginHistoryTitle", { name: selectedChild?.name ?? t("children.loginHistoryStudentFallback") })}
        description={t("children.loginHistoryDescription")}
      />
    </Screen>
  );
}

function ChildStat({ icon: Icon, value, label }: { icon: LucideIcon; value: number | string; label: string }) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  return (
    <View style={styles.childStat}>
      <Icon size={16} color={palette["primary-text"]} />
      <Text variant="body" style={styles.statValue}>
        {value}
      </Text>
      <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
        {label}
      </Text>
    </View>
  );
}

/** `.form-alert` — qizil fonli xato qatori. */
function FormAlert({ message }: { message: string }) {
  const { palette } = useTheme();
  return (
    <Text
      variant="label"
      accessibilityRole="alert"
      style={[styles.alert, { color: palette["destructive-strong"], backgroundColor: palette["destructive-soft"] }]}
    >
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  /* `.child-profile-card` — 24 bo'shliq, radius 20, markazlashgan */
  childCard: { alignItems: "center", padding: 24, borderWidth: 1, borderRadius: 20 },
  status: { position: "absolute", top: 13, right: 13, flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 999 },
  statusText: { fontSize: 11, lineHeight: 16.5, fontWeight: "700" },
  childName: { marginTop: 12, marginBottom: 4, fontSize: 17, lineHeight: 25.5, fontWeight: "400" },
  /* `.child-stats` — ustdan va pastdan chiziq, ikki teng ustun */
  childStats: { alignSelf: "stretch", flexDirection: "row", marginVertical: 12, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1 },
  childStat: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: 1 },
  statValue: { fontSize: 16, lineHeight: 24, fontWeight: "700" },
  small: { fontSize: 11, lineHeight: 16.5 },
  childLast: { alignSelf: "stretch", gap: 4 },
  lastValue: { fontSize: 12, lineHeight: 18, fontWeight: "700" },
  consentPanel: { padding: 18, gap: 14 },
  consentHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  sectionEyebrow: { fontSize: 11, lineHeight: 16.5, fontWeight: "700", letterSpacing: 1.32 },
  sectionTitle: { marginTop: 4, fontSize: 19, lineHeight: 28.5, fontWeight: "400" },
  historyButton: { alignSelf: "flex-start" },
  /* `.consent-list` — orasi 8 */
  consentList: { gap: 8 },
  /* `.consent-list > button` — 11 bo'shliq, radius 13 */
  consent: { flexDirection: "row", alignItems: "center", gap: 11, padding: 11, borderWidth: 1, borderRadius: 13 },
  consentIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  consentBody: { flex: 1, minWidth: 0, gap: 3 },
  consentLabel: { fontWeight: "700" },
  consentText: { fontSize: 12.8, lineHeight: 19.2 },
  /* `.consent-list i` — 5 8, 12/800 */
  consentState: { overflow: "hidden", paddingVertical: 5, paddingHorizontal: 8, borderRadius: 999, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  namePair: { flexDirection: "row", gap: 12 },
  dialogActions: { flexDirection: "row", gap: 10 },
  alert: { overflow: "hidden", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, fontWeight: "500" },
});
