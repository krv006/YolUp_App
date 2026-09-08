import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, Moon, Smartphone, Sun } from "lucide-react-native";
import {
  FONT_SCALES,
  useAppearanceStore,
  type ThemeMode,
} from "@/shared/model/theme.store";
import {
  ACCENTS,
  Button,
  IconButton,
  radius,
  Screen,
  Separator,
  Text,
  useTheme,
} from "@/shared/ui";

const MODES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Yorug'", icon: Sun },
  { value: "dark", label: "Qorong'i", icon: Moon },
  { value: "system", label: "Tizim", icon: Smartphone },
];

/**
 * Ko'rinish sozlamalari — mavzu, brend rangi, shrift o'lchami, chat purakchasi.
 *
 * Har o'zgarish DARHOL qo'llanadi va shu ekranning o'zida ko'rinadi:
 * tugmalar, matnlar va pastdagi suhbat namunasi bir zumda yangilanadi.
 * "Saqlash" tugmasi ataylab yo'q — foydalanuvchi natijani ko'rib turib
 * tanlaydi, ko'r-ko'rona emas.
 */
export function AppearancePage() {
  const router = useRouter();
  const { palette, fontScale } = useTheme();
  const { mode, accent, bubbleAccent, setMode, setAccent, setFontScale, setBubbleAccent, reset } =
    useAppearanceStore();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <Screen padded={false}>
      <View style={[styles.head, { borderBottomColor: palette.border }]}>
        <IconButton accessibilityLabel="Orqaga" onPress={goBack}>
          <ArrowLeft size={22} color={palette.foreground} />
        </IconButton>
        <Text variant="subheading" style={styles.headTitle}>
          Ko'rinish
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* ── Mavzu ── */}
        <Section title="Mavzu" hint="Qurilma sozlamasiga ergashish yoki qo'lda tanlash.">
          <View style={styles.segment}>
            {MODES.map(({ value, label, icon: Icon }) => {
              const active = mode === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setMode(value)}
                  style={({ pressed }) => [
                    styles.segmentItem,
                    {
                      backgroundColor: active ? palette["primary-tint"] : palette.surface,
                      borderColor: active ? palette.primary : palette.border,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Icon
                    size={18}
                    color={active ? palette["primary-text"] : palette["muted-foreground"]}
                  />
                  <Text
                    variant="caption"
                    style={{
                      color: active ? palette["primary-text"] : palette["muted-foreground"],
                      fontWeight: "600",
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Separator />

        {/* ── Brend rangi ── */}
        <Section
          title="Asosiy rang"
          hint="Tugmalar, havolalar va faol bo'limlar shu rangda bo'ladi."
        >
          <Swatches selected={accent} onSelect={setAccent} />
        </Section>

        <Separator />

        {/* ── Shrift ── */}
        <Section title="Shrift o'lchami" hint="Butun ilovadagi matnga qo'llanadi.">
          <View style={styles.segment}>
            {FONT_SCALES.map(({ value, label }) => {
              const active = Math.abs(fontScale - value) < 0.001;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setFontScale(value)}
                  style={({ pressed }) => [
                    styles.segmentItem,
                    {
                      backgroundColor: active ? palette["primary-tint"] : palette.surface,
                      borderColor: active ? palette.primary : palette.border,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  {/*
                   * Namuna harfi masshtabga BO'YSUNMAYDI — u tanlovni
                   * ko'rsatuvchi belgi, matn emas. Aks holda "Juda katta"
                   * tanlanganda tugmaning o'zi sig'may qolardi.
                   */}
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 13 * value,
                      fontWeight: "700",
                      color: active ? palette["primary-text"] : palette["muted-foreground"],
                    }}
                  >
                    Aa
                  </Text>
                  <Text
                    variant="caption"
                    numberOfLines={1}
                    style={{
                      color: active ? palette["primary-text"] : palette["muted-foreground"],
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Separator />

        {/* ── Chat purakchasi ── */}
        <Section
          title="Suhbat rangi"
          hint="O'z xabarlaringiz shu rangda ko'rinadi. Asosiy rangdan mustaqil."
        >
          <Swatches
            selected={bubbleAccent ?? accent}
            onSelect={setBubbleAccent}
            extra={
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: bubbleAccent === null }}
                onPress={() => setBubbleAccent(null)}
                style={[
                  styles.swatch,
                  styles.swatchAuto,
                  {
                    borderColor: bubbleAccent === null ? palette.foreground : palette.border,
                    backgroundColor: palette.surface,
                  },
                ]}
              >
                <Text variant="caption" tone="muted" style={styles.autoLabel}>
                  Asosiy
                </Text>
              </Pressable>
            }
          />

          <ChatPreview />
        </Section>

        <Button title="Standart holatga qaytarish" variant="secondary" onPress={reset} />
      </ScrollView>
    </Screen>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text variant="label">{title}</Text>
      <Text variant="caption" tone="muted">
        {hint}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Swatches({
  selected,
  onSelect,
  extra,
}: {
  selected: string;
  onSelect: (id: string) => void;
  extra?: React.ReactNode;
}) {
  const { scheme, palette } = useTheme();

  return (
    <View style={styles.swatches}>
      {extra}
      {ACCENTS.map((item) => {
        const color = scheme === "dark" ? item.dark : item.light;
        const active = selected === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(item.id)}
            style={[
              styles.swatch,
              {
                backgroundColor: color,
                // Tanlangani halqa bilan ajratiladi — faqat rang bilan emas,
                // chunki qo'shni ranglar bir-biriga o'xshab ketishi mumkin.
                borderColor: active ? palette.foreground : "transparent",
              },
            ]}
          >
            {active ? <Check size={18} color="#ffffff" strokeWidth={3} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Tanlangan ranglar suhbatda qanday ko'rinishini shu yerda ko'rsatamiz. */
function ChatPreview() {
  const { palette } = useTheme();

  return (
    <View style={[styles.preview, { backgroundColor: palette["chat-bg"] }]}>
      <View
        style={[
          styles.previewBubble,
          styles.previewIn,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        <Text variant="caption">Salom! Dars qachon boshlanadi?</Text>
      </View>

      <View
        style={[
          styles.previewBubble,
          styles.previewOut,
          { backgroundColor: palette["bubble-own"] },
        ]}
      >
        <Text variant="caption" style={{ color: palette["bubble-own-foreground"] }}>
          Soat 15:00 da boshlaymiz.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headTitle: { flex: 1 },
  body: { padding: 16, gap: 4, paddingBottom: 40 },
  section: { gap: 4, paddingVertical: 14 },
  sectionBody: { gap: 12, paddingTop: 10 },
  segment: { flexDirection: "row", gap: 8 },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchAuto: { borderWidth: 1 },
  autoLabel: { fontSize: 10 },
  preview: { borderRadius: radius.lg, padding: 12, gap: 8 },
  previewBubble: {
    maxWidth: "82%",
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewIn: { alignSelf: "flex-start", borderWidth: StyleSheet.hairlineWidth },
  previewOut: { alignSelf: "flex-end" },
});
