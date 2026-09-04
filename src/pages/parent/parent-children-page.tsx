import { useState } from "react";
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

/** Veb `parent-children-page.tsx` dagi ro'yxat bilan bir xil. */
const CONSENT_KINDS: { id: ConsentKind; label: string; description: string; icon: LucideIcon }[] = [
  { id: "recording", label: "Dars yozuvi", description: "Darsni yozib olishga ruxsat", icon: Video },
  { id: "camera", label: "Kamera", description: "Jonli darsda kameradan foydalanish", icon: Camera },
  {
    id: "analytics",
    label: "Faollik tahlili",
    description: "Davomat, diqqat va fokus tahlili",
    icon: Sparkles,
  },
];

const EMPTY_CHILD = { username: "", password: "", first_name: "", last_name: "" };

export function ParentChildrenPage() {
  const { palette } = useTheme();
  const childrenQuery = useParentChildren();
  const consents = useParentConsents();
  const requestLink = useRequestChildLink();
  const createChild = useCreateChild();
  const setConsent = useSetParentConsent();
  const { selectedChild, selectedChildId, selectChild } = useSelectedChild();

  const [linkOpen, setLinkOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [child, setChild] = useState(EMPTY_CHILD);

  async function submitLink() {
    try {
      await requestLink.mutateAsync(inviteCode.trim().toUpperCase());
      setInviteCode("");
      setLinkOpen(false);
      toast.success("So'rov yuborildi — farzandingiz tasdiqlashi kerak");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik");
    }
  }

  async function submitChild() {
    try {
      await createChild.mutateAsync(child);
      setChild(EMPTY_CHILD);
      setChildOpen(false);
      toast.success("Hisob yaratildi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik");
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
        <ScreenLoading label="Farzandlar yuklanmoqda…" />
      </Screen>
    );
  }

  if (childrenQuery.isError) {
    return (
      <Screen>
        <ScreenError
          message="Farzandlar ro'yxatini yuklab bo'lmadi"
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
            Biriktirilgan o'quvchi hisoblari va maxfiylik ruxsatlari.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="O'quvchini ulash"
            variant="secondary"
            fullWidth={false}
            icon={<Link2 size={16} color={palette["secondary-foreground"]} />}
            onPress={() => setLinkOpen(true)}
            style={styles.action}
          />
          <Button
            title="Bola hisobi"
            fullWidth={false}
            icon={<Plus size={16} color={palette["primary-foreground"]} />}
            onPress={() => setChildOpen(true)}
            style={styles.action}
          />
        </View>

        {children.length === 0 ? (
          <ScreenEmpty
            title="Farzand hali ulanmagan"
            description="O'quvchi taklif kodini kiriting yoki yangi hisob yarating."
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
                    label={selected ? "Tanlangan" : "Tasdiqlangan"}
                    tone={selected ? "brand" : "success"}
                  />
                </View>

                <View style={styles.stats}>
                  <Stat icon={<CheckCircle2 size={15} color={palette["muted-foreground"]} />} value={`${item.lessons}`} label="dars" />
                  <Stat icon={<Clock3 size={15} color={palette["muted-foreground"]} />} value={`${item.minutes}`} label="daqiqa" />
                </View>

                <Text variant="caption" tone="muted">
                  So'nggi faollik: {item.lastActivity}
                </Text>
              </Pressable>
            );
          })
        )}

        {selectedChild ? (
          <View
            style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            <Text variant="label">{selectedChild.name} uchun ruxsatlar</Text>
            <Text variant="caption" tone="muted">
              Bu ruxsatlarni istalgan payt qaytarib olishingiz mumkin.
            </Text>

            {CONSENT_KINDS.map(({ id, label, description, icon: Icon }) => {
              const granted = (consents.data ?? []).some(
                (item) => item.studentId === selectedChildId && item.kind === id && item.granted
              );
              return (
                <Pressable
                  key={id}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: granted }}
                  accessibilityLabel={`${label}. ${description}`}
                  disabled={consents.isLoading || setConsent.isPending}
                  onPress={() => toggleConsent(id)}
                  style={({ pressed }) => [styles.consent, pressed && { opacity: 0.85 }]}
                >
                  <View style={[styles.consentIcon, { backgroundColor: palette["primary-tint"] }]}>
                    <Icon size={18} color={palette["primary-text"]} />
                  </View>
                  <View style={styles.consentBody}>
                    <Text variant="label">{label}</Text>
                    <Text variant="caption" tone="muted">
                      {description}
                    </Text>
                  </View>
                  <Badge label={granted ? "Yoqilgan" : "O'chiq"} tone={granted ? "success" : "neutral"} />
                </Pressable>
              );
            })}

            {consents.isError ? (
              <Text variant="caption" tone="danger">
                Ruxsatlarni yuklab bo'lmadi.
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <Sheet
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="O'quvchini ulash"
        description="O'quvchi profilidagi FK-... taklif kodini kiriting."
      >
        <Input
          label="Taklif kodi"
          placeholder="FK-XXXX"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          autoFocus
        />
        <Button
          title="So'rov yuborish"
          loading={requestLink.isPending}
          disabled={inviteCode.trim().length === 0}
          onPress={() => void submitLink()}
        />
      </Sheet>

      <Sheet
        open={childOpen}
        onClose={() => setChildOpen(false)}
        title="Bola hisobini yaratish"
        description="Yaratilgan o'quvchi sizga avtomatik ulanadi."
      >
        <Input
          label="Ism"
          value={child.first_name}
          onChangeText={(value) => setChild((current) => ({ ...current, first_name: value }))}
          autoCapitalize="words"
        />
        <Input
          label="Familiya"
          value={child.last_name}
          onChangeText={(value) => setChild((current) => ({ ...current, last_name: value }))}
          autoCapitalize="words"
        />
        <Input
          label="Login"
          value={child.username}
          onChangeText={(value) => setChild((current) => ({ ...current, username: value }))}
        />
        <Input
          label="Vaqtinchalik parol"
          secure
          value={child.password}
          onChangeText={(value) => setChild((current) => ({ ...current, password: value }))}
          // Backend kamida 8 belgi talab qiladi (`auth.schemas.ts`).
          error={
            child.password.length > 0 && child.password.length < 8
              ? "Parol kamida 8 ta belgidan iborat bo'lsin"
              : undefined
          }
        />
        <Button
          title="Hisob yaratish"
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
