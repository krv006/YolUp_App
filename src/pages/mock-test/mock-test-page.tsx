import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ClipboardCheck, Timer } from "lucide-react-native";
import {
  MockTestRunner,
  useMockTests,
  useStartMockTest,
  type MockAttempt,
} from "@/modules/mock-test";
import {
  Button,
  IconButton,
  radius,
  Screen,
  ScreenError,
  ScreenHeader,
  ScreenLoading,
  Text,
  useTheme,
} from "@/shared/ui";

/**
 * Mock test — veb `pages/workspace/mock-test-page.tsx` porti.
 *
 * Vebdagi kabi ro'yxat va yechish EKRANI BIR MARSHRUTDA almashadi.
 * Bu ataylab: urinish `start` so'rovidan qaytadi va uni id bo'yicha
 * qayta olib bo'lmaydi — boshqa ekranga o'tib qaytilsa, urinish
 * yo'qolardi.
 *
 * Shu sabab marshrut TAB EMAS, ildiz darajasida (`/mock-tests`) va
 * profildan ochiladi: tab qatori bo'lsa, imtihon paytida boshqa tabga
 * tasodifan bosish urinishni yo'q qilardi.
 */
export function MockTestPage() {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const router = useRouter();
  const list = useMockTests();
  const start = useStartMockTest();

  const [attempt, setAttempt] = useState<{ mockTestId: string; data: MockAttempt } | null>(null);
  const [result, setResult] = useState<{ total: number; max: number } | null>(null);

  if (attempt) {
    return (
      <Screen padded={false}>
        <MockTestRunner
          mockTestId={attempt.mockTestId}
          attempt={attempt.data}
          onFinished={(score) => {
            setAttempt(null);
            setResult(score);
          }}
          onCancel={() => setAttempt(null)}
        />
      </Screen>
    );
  }

  const back = (
    <IconButton accessibilityLabel={t("mocktest.orqaga")} onPress={() => router.back()}>
      <ArrowLeft size={20} color={palette["muted-foreground"]} />
    </IconButton>
  );

  if (list.isLoading) {
    return (
      <Screen>
        <ScreenHeader title={t("mocktest.mock_test")} leading={back} />
        <ScreenLoading label={t("mocktest.yuklanmoqda")} />
      </Screen>
    );
  }

  if (list.isError) {
    return (
      <Screen>
        <ScreenHeader title={t("mocktest.mock_test")} leading={back} />
        <ScreenError
          message={list.error?.message ?? "Mock testlarni yuklab bo'lmadi"}
          onRetry={() => void list.refetch()}
        />
      </Screen>
    );
  }

  const items = list.data ?? [];

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching}
            onRefresh={() => void list.refetch()}
            tintColor={palette["muted-foreground"]}
          />
        }
      >
        <ScreenHeader
          title={t("mocktest.mock_test")}
          subtitle={t("mocktest.bir_nechta_test_birlashtirilgan_vaqt_chegara")}
          leading={back}
        />

        {result ? (
          <View
            style={[
              styles.result,
              { backgroundColor: palette["success-soft"], borderColor: palette.border },
            ]}
          >
            <Text variant="label" style={{ color: palette["success-strong"] }}>
              Natijangiz: {result.total} / {result.max}
            </Text>
          </View>
        ) : null}

        {items.length === 0 ? (
          <Text variant="caption" tone="muted">
            {t("mocktest.hozircha_mock_test_yo_apos_q")}
          </Text>
        ) : (
          items.map((item) => (
            <View
              key={item.id}
              style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              <View style={styles.cardHead}>
                <View style={[styles.icon, { backgroundColor: palette["primary-tint"] }]}>
                  <ClipboardCheck size={20} color={palette["primary-text"]} />
                </View>
                <View style={styles.cardBody}>
                  <Text variant="label" numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text variant="caption" tone="muted" numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  <View style={styles.meta}>
                    <Timer size={13} color={palette["muted-foreground"]} />
                    <Text variant="caption" tone="muted">
                      {item.timeLimitMinutes} daqiqa · {item.sectionCount} ta bo&apos;lim
                    </Text>
                  </View>
                </View>
              </View>

              <Button
                title={t("mocktest.boshlash")}
                loading={start.isPending && start.variables === item.id}
                disabled={start.isPending}
                onPress={() => {
                  start
                    .mutateAsync(item.id)
                    .then((data) => {
                      setResult(null);
                      setAttempt({ mockTestId: item.id, data });
                    })
                    // Xatoni mutatsiyaning `onError` i chiqaradi.
                    .catch(() => undefined);
                }}
              />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12, padding: 20 },
  result: {
    padding: 12,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: {
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHead: { flexDirection: "row", gap: 12 },
  cardBody: { flex: 1, gap: 2 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
});
