import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, Moon, Smartphone, Sun } from "lucide-react-native";
import {
  MAX_MESSAGE_SCALE,
  MESSAGE_SCALE_STEP,
  MIN_MESSAGE_SCALE,
  useAppearanceStore,
  type ThemeMode,
} from "@/shared/model/theme.store";
import {
  ACCENTS,
  Button,
  GRADIENTS,
  GradientFill,
  IconButton,
  MessageTextScale,
  radius,
  Screen,
  Separator,
  Slider,
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
  const { palette } = useTheme();
  const {
    mode,
    accent,
    messageScale,
    bubbleAccent,
    bubbleGradient,
    setMode,
    setAccent,
    setMessageScale,
    setBubbleAccent,
    setBubbleGradient,
    reset,
  } = useAppearanceStore();

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
          <ColorSwatches selected={accent} onSelect={setAccent} />
        </Section>

        <Separator />

        {/* ── Suhbat ── */}
        <Section
          title="Suhbat"
          hint="Xabar matni o'lchami va o'z xabarlaringiz rangi. Bu sozlamalar faqat suhbatga tegishli."
        >
          <View style={styles.fontRow}>
            {/*
             * Chekka harflar masshtabga BO'YSUNMAYDI: ular slayder
             * chegaralarini bildiruvchi belgi, o'qiladigan matn emas.
             */}
            <Text allowFontScaling={false} style={styles.fontMarkSmall} tone="muted">
              A
            </Text>
            <View style={styles.sliderBox}>
              <Slider
                value={messageScale}
                min={MIN_MESSAGE_SCALE}
                max={MAX_MESSAGE_SCALE}
                step={MESSAGE_SCALE_STEP}
                onChange={setMessageScale}
                label="Xabar matni o'lchami"
                formatValue={(v) => `${Math.round(v * 100)} foiz`}
              />
            </View>
            <Text allowFontScaling={false} style={styles.fontMarkLarge} tone="muted">
              A
            </Text>
          </View>

          <ColorSwatches
            selected={bubbleGradient ? "" : (bubbleAccent ?? accent)}
            onSelect={setBubbleAccent}
            extra={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Asosiy rang"
                accessibilityState={{ selected: bubbleAccent === null && !bubbleGradient }}
                onPress={() => setBubbleAccent(null)}
                style={[
                  styles.swatch,
                  styles.swatchAuto,
                  {
                    borderColor:
                      bubbleAccent === null && !bubbleGradient
                        ? palette.foreground
                        : palette.border,
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

          <Text variant="caption" tone="muted">
            Aralash ranglar
          </Text>
          <GradientSwatches selected={bubbleGradient} onSelect={setBubbleGradient} />

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

function ColorSwatches({
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

function GradientSwatches({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { scheme, palette } = useTheme();

  return (
    <View style={styles.swatches}>
      {GRADIENTS.map((item) => {
        const colors = scheme === "dark" ? item.dark : item.light;
        const active = selected === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            // Tanlangani qayta bosilsa — bekor qilinadi va oddiy rangga qaytadi.
            onPress={() => onSelect(active ? null : item.id)}
            style={[
              styles.swatch,
              styles.gradientSwatch,
              { borderColor: active ? palette.foreground : "transparent" },
            ]}
          >
            <GradientFill colors={colors} />
            {active ? <Check size={18} color="#ffffff" strokeWidth={3} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Tanlangan ranglar suhbatda qanday ko'rinishini shu yerda ko'rsatamiz. */
function ChatPreview() {
  const { palette, bubbleGradient } = useTheme();

  return (
    // Namuna HAQIQIY suhbat kabi o'ralgan — shuning uchun slayder
    // qimirlatilganda shu yerdagi matn ham darhol kattalashadi.
    <MessageTextScale>
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
            // Gradient bo'lsa fon SVG bilan chiziladi, shuning uchun rang
            // berilmaydi va burchaklar kesilishi uchun `overflow` yopiladi.
            bubbleGradient ? styles.clip : { backgroundColor: palette["bubble-own"] },
          ]}
        >
          {bubbleGradient ? <GradientFill colors={bubbleGradient} /> : null}
          <Text variant="caption" style={{ color: palette["bubble-own-foreground"] }}>
            Soat 15:00 da boshlaymiz.
          </Text>
        </View>
      </View>
    </MessageTextScale>
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
  fontRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sliderBox: { flex: 1 },
  fontMarkSmall: { fontSize: 13, fontWeight: "700" },
  fontMarkLarge: { fontSize: 22, fontWeight: "700" },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientSwatch: { overflow: "hidden" },
  swatchAuto: { borderWidth: 1 },
  autoLabel: { fontSize: 10 },
  preview: { borderRadius: radius.lg, padding: 12, gap: 8 },
  previewBubble: {
    maxWidth: "82%",
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clip: { overflow: "hidden" },
  previewIn: { alignSelf: "flex-start", borderWidth: StyleSheet.hairlineWidth },
  previewOut: { alignSelf: "flex-end" },
});
