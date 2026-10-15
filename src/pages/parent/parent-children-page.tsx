import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import {
  Camera,
  CheckCircle2,
  Clock3,
  Link2,
  Plus,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react-native";
import {
  useCreateChild,
  useParentChildren,
  useParentConsents,
  useRequestChildLink,
  useSelectedChild,
  useSetParentConsent,
  type ConsentKind,
} from "@/modules/parent";
import {
  Avatar,
  Badge,
  Button,
  Input,
  radius,
  Screen,
  ScreenEmpty,
  ScreenError,
  ScreenLoading,
  Sheet,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";

/**
 * Veb `parent-children-page.tsx` dagi ro'yxat bilan bir xil.
 *
 * Matn o'rniga tarjima kalitlari — ro'yxat modul darajasida va `t()`
 * faqat render paytida mavjud.
 */
const CONSENT_KINDS: {
  id: ConsentKind;
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
}[] = [
  {
    id: "recording",
    labelKey: "parent.dars_yozuvi",
    descriptionKey: "parent.darsni_yozib_olishga_ruxsat",
    icon: Video,
  },
  {
    id: "camera",
    labelKey: "parent.kamera",
    descriptionKey: "parent.jonli_darsda_kameradan_foydalanish",
    icon: Camera,
  },
  {
    id: "analytics",
    labelKey: "parent.faollik_tahlili",
    descriptionKey: "parent.davomat_diqqat_va_fokus_tahlili",
    icon: Sparkles,
  },
];

const EMPTY_CHILD = { username: "", password: "", first_name: "", last_name: "" };

export function ParentChildrenPage() {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const childrenQuery = useParentChildren();
  const consents = useParentConsents();
  const requestLink = useRequestChildLink();
  const createChild = useCreateChild();
  const setConsent = useSetParentConsent();
  const { selectedChild, selectedChildId, selectChild } = useSelectedChild();

  const [linkOpen, setLinkOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const [childLogin, setChildLogin] = useState("");
  const [child, setChild] = useState(EMPTY_CHILD);

  async function submitLink() {
    try {
      /*
       * Faqat `trim` — katta harfga o'girilmaydi. Sabab `parent.api.ts`
       * dagi `requestLink` izohida.
       */
      await requestLink.mutateAsync(childLogin.trim());
      setChildLogin("");
      setLinkOpen(false);
      toast.success(t("parent.sorov_yuborildi_farzandingiz_tasdiqlashi_ker"));
    } catch {
      /*
       * XATO BU YERDA KO'RSATILMAYDI — uni mutatsiyaning `onError` i
       * chiqaradi. Ilgari ikkalasi ham chiqarardi va toast EKRANDA IKKI
       * MARTA ko'rinardi.
       *
       * `catch` o'zi kerak: `mutateAsync` rad javob bersa, quyidagi
       * `close()` bajarilmasligi va rad javob e'tiborsiz qolmasligi shart.
       */
    }
  }

  async function submitChild() {
    try {
      await createChild.mutateAsync(child);
      setChild(EMPTY_CHILD);
      setChildOpen(false);
      toast.success(t("parent.hisob_yaratildi"));
    } catch {
      /*
       * XATO BU YERDA KO'RSATILMAYDI — uni mutatsiyaning `onError` i
       * chiqaradi. Ilgari ikkalasi ham chiqarardi va toast EKRANDA IKKI
       * MARTA ko'rinardi.
       *
       * `catch` o'zi kerak: `mutateAsync` rad javob bersa, quyidagi
       * `close()` bajarilmasligi va rad javob e'tiborsiz qolmasligi shart.
       */
    }
  }

  function toggleConsent(kind: ConsentKind) {
    if (!selectedChildId) return;
    const current = (consents.data ?? []).find(
      (item) => item.studentId === selectedChildId && item.kind === kind
    );
    setConsent.mutate({ studentId: selectedChildId, kind, granted: !current?.granted });
  }

  if (childrenQuery.isLoading) {
    return (
      <Screen>
        <ScreenLoading label={t("parent.farzandlar_yuklanmoqda")} />
      </Screen>
    );
  }

  if (childrenQuery.isError) {
    return (
      <Screen>
        <ScreenError
          message={t("parent.farzandlar_royxatini_yuklab_bolmadi")}
          onRetry={() => void childrenQuery.refetch()}
        />
      </Screen>
    );
  }

  const children = childrenQuery.data ?? [];

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={childrenQuery.isRefetching}
            onRefresh={() => void childrenQuery.refetch()}
            tintColor={palette["muted-foreground"]}
          />
        }
      >
        <View style={styles.head}>
          <Text variant="heading">Farzandlarim</Text>
          <Text variant="caption" tone="muted">
            {t("parent.biriktirilgan_oquvchi_hisoblari_va_maxfiylik")}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title={t("parent.oquvchini_ulash")}
            variant="secondary"
            fullWidth={false}
            icon={<Link2 size={16} color={palette["secondary-foreground"]} />}
            onPress={() => setLinkOpen(true)}
            style={styles.action}
          />
          <Button
            title={t("parent.bola_hisobi")}
            fullWidth={false}
            icon={<Plus size={16} color={palette["primary-foreground"]} />}
            onPress={() => setChildOpen(true)}
            style={styles.action}
          />
        </View>

        {children.length === 0 ? (
          <ScreenEmpty
            title={t("parent.farzand_hali_ulanmagan")}
            description={t("parent.oquvchi_taklif_kodini_kiriting_yoki_yangi_hi")}
          />
        ) : (
          children.map((item) => {
            const selected = item.id === selectedChildId;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => selectChild(item.id)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: selected ? palette["primary-tint"] : palette.card,
                    borderColor: selected ? palette["border-accent"] : palette.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View style={styles.cardHead}>
                  <Avatar name={item.name} tone={item.avatarTone} size="lg" />
                  <View style={styles.cardBody}>
                    <Text variant="label" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {item.username} · {item.grade}
                    </Text>
                  </View>
                  <Badge
                    label={selected ? t("parent.tanlangan") : t("parent.tasdiqlangan")}
                    tone={selected ? "brand" : "success"}
                  />
                </View>

                <View style={styles.stats}>
                  <Stat icon={<CheckCircle2 size={15} color={palette["muted-foreground"]} />} value={`${item.lessons}`} label={t("parent.dars")} />
                  <Stat icon={<Clock3 size={15} color={palette["muted-foreground"]} />} value={`${item.minutes}`} label={t("parent.daqiqa")} />
                </View>

                <Text variant="caption" tone="muted">
                  {t("parent.songgi_faollik", { value: item.lastActivity })}
                </Text>
              </Pressable>
            );
          })
        )}

        {selectedChild ? (
          <View
            style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            <Text variant="label">
              {t("parent.uchun_ruxsatlar", { name: selectedChild.name })}
            </Text>
            <Text variant="caption" tone="muted">
              {t("parent.bu_ruxsatlarni_istalgan_payt_qaytarib_olishi")}
            </Text>

            {CONSENT_KINDS.map(({ id, labelKey, descriptionKey, icon: Icon }) => {
              const granted = (consents.data ?? []).some(
                (item) => item.studentId === selectedChildId && item.kind === id && item.granted
              );
              return (
                <Pressable
                  key={id}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: granted }}
                  accessibilityLabel={`${t(labelKey)}. ${t(descriptionKey)}`}
                  disabled={consents.isLoading || setConsent.isPending}
                  onPress={() => toggleConsent(id)}
                  style={({ pressed }) => [styles.consent, pressed && { opacity: 0.85 }]}
                >
                  <View style={[styles.consentIcon, { backgroundColor: palette["primary-tint"] }]}>
                    <Icon size={18} color={palette["primary-text"]} />
                  </View>
                  <View style={styles.consentBody}>
                    <Text variant="label">{t(labelKey)}</Text>
                    <Text variant="caption" tone="muted">
                      {t(descriptionKey)}
                    </Text>
                  </View>
                  <Badge
                    label={granted ? t("parent.yoqilgan") : t("parent.ochiq")}
                    tone={granted ? "success" : "neutral"}
                  />
                </Pressable>
              );
            })}

            {consents.isError ? (
              <Text variant="caption" tone="danger">
                {t("parent.ruxsatlarni_yuklab_bolmadi")}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <Sheet
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title={t("parent.oquvchini_ulash")}
        description={t("parent.oquvchi_profilidagi_loginni_kiriting")}
      >
        <Input
          label={t("parent.oquvchi_logini")}
          placeholder={t("parent.login_masalan")}
          value={childLogin}
          onChangeText={setChildLogin}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        <Button
          title={t("parent.sorov_yuborish")}
          loading={requestLink.isPending}
          disabled={childLogin.trim().length === 0}
          onPress={() => void submitLink()}
        />
      </Sheet>

      <Sheet
        open={childOpen}
        onClose={() => setChildOpen(false)}
        title={t("parent.bola_hisobini_yaratish")}
        description={t("parent.yaratilgan_oquvchi_sizga_avtomatik_ulanadi")}
      >
        <Input
          label={t("parent.ism")}
          value={child.first_name}
          onChangeText={(value) => setChild((current) => ({ ...current, first_name: value }))}
          autoCapitalize="words"
        />
        <Input
          label={t("parent.familiya")}
          value={child.last_name}
          onChangeText={(value) => setChild((current) => ({ ...current, last_name: value }))}
          autoCapitalize="words"
        />
        <Input
          label={t("parent.login")}
          value={child.username}
          onChangeText={(value) => setChild((current) => ({ ...current, username: value }))}
        />
        <Input
          label={t("parent.vaqtinchalik_parol")}
          secure
          value={child.password}
          onChangeText={(value) => setChild((current) => ({ ...current, password: value }))}
          // Backend kamida 8 belgi talab qiladi (`auth.schemas.ts`).
          error={
            child.password.length > 0 && child.password.length < 8
              ? t("parent.parol_kamida_8_ta_belgidan_iborat_bolsin")
              : undefined
          }
        />
        <Button
          title={t("parent.hisob_yaratish")}
          loading={createChild.isPending}
          disabled={
            !child.first_name.trim() ||
            !child.last_name.trim() ||
            !child.username.trim() ||
            child.password.length < 8
          }
          onPress={() => void submitChild()}
        />
      </Sheet>
    </Screen>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      {icon}
      <Text variant="label">{value}</Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  head: { gap: 4, paddingTop: 8 },
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardBody: { flex: 1, gap: 3 },
  stats: { flexDirection: "row", gap: 20 },
  stat: { flexDirection: "row", alignItems: "center", gap: 5 },
  consent: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  consentIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  consentBody: { flex: 1, gap: 2 },
});
