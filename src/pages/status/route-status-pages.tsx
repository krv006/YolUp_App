import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { ROUTES } from "@/shared/config";
import { Icon, MobileButton, RouteStatus } from "@/shared/ui";

/** Yordam — veb `route-error-boundary.tsx` dagi Telegram manzili. */
const SUPPORT_URL = "https://t.me/yolup_support";

/** 403 — veb `route-status-pages.tsx` dagi `ForbiddenPage` (tor ekran). */
export function ForbiddenPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  return (
    <RouteStatus
      tone="warning"
      icon={(color) => <Icon name="lock-fill" size={52} color={color} />}
      title={t("routeState.forbiddenTitle")}
      description={t("routeState.forbiddenDescription")}
      action={
        <>
          <MobileButton variant="secondary" label={t("routeState.back")} onPress={() => (router.canGoBack() ? router.back() : router.replace(ROUTES.root))} />
          <MobileButton label={t("routeState.forbiddenAction")} onPress={() => router.replace(ROUTES.root)} />
        </>
      }
    />
  );
}

/** 404 — veb `NotFoundPage`: doirada "404", pastda "Bosh sahifaga qaytish". */
export function NotFoundPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  return (
    <RouteStatus
      eyebrow="404"
      icon={(color) => <Icon name="search" size={26} color={color} />}
      title={t("routeState.notFoundTitle")}
      description={t("routeState.notFoundDescription")}
      action={<MobileButton label={t("routeState.notFoundAction")} onPress={() => router.replace(ROUTES.root)} />}
    />
  );
}

/**
 * Kutilmagan xatolik — veb `route-error-boundary.tsx`. Expo Router'ning
 * `ErrorBoundary` eksporti orqali chiqadi; "Qayta urinish" sahifani qayta
 * chizadi (vebda `window.location.reload()`).
 */
export function RouteErrorPage({ retry }: { retry: () => void }) {
  const { t } = useTranslation("common");
  return (
    <RouteStatus
      tone="error"
      icon={(color) => <Icon name="warning-fill" size={48} color={color} />}
      title={t("routeState.errorTitle")}
      description={t("routeState.errorDescription")}
      action={
        <>
          <MobileButton variant="secondary" label={t("routeState.help")} onPress={() => void Linking.openURL(SUPPORT_URL)} />
          <MobileButton label={t("routeState.errorAction")} onPress={retry} />
        </>
      }
    />
  );
}
