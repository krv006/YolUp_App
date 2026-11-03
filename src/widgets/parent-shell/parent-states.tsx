import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { AddChildDialog, parentFamily, useParentLinks, useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { storage } from "@/shared/lib";
import { ParentStateScreen } from "./parent-state-screen";

/** Noma'lum ota-ona manzili — veb `ParentNotFound` (`404`). */
export function ParentNotFound() {
  const { t } = useTranslation("parent");
  const router = useRouter();
  return (
    <ParentStateScreen
      icon="search"
      tone="brand"
      code="404"
      title={t("states.notFound.title")}
      text={t("states.notFound.text")}
      primary={{ label: t("states.home"), onPress: () => router.replace(ROUTES.parent.dashboard as never) }}
    />
  );
}

/** Internet yo'q va farzandlar ro'yxati hali kelmagan — veb `ParentOffline`. */
export function ParentOffline({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("parent");
  return (
    <ParentStateScreen
      icon="wifi"
      tone="teal"
      title={t("states.offline.title")}
      text={t("states.offline.text")}
      primary={{ label: t("states.offline.retry"), onPress: onRetry }}
    />
  );
}

const SEEN_KEY = "yolup:parent:unlinked-seen";

/**
 * Farzand ulanishni uzgan bo'lsa — veb `ParentUnlinked`: bir marta butun
 * ekranli xabar ("Tushunarli" — Farzandlar, "Qayta so'rov yuborish" —
 * qo'shish oynasi). Ko'rilganlar `storage` da eslab qolinadi.
 *
 * Vebda u sahifani o'rab, o'rniga chiziladi; mobilda navigator o'chib
 * ketmasligi uchun sahifalar ustidan qoplanadi.
 */
export function ParentUnlinked({ children: content }: { children: ReactNode }) {
  const { t } = useTranslation("parent");
  const router = useRouter();
  const [now] = useState(() => Date.now());
  const [adding, setAdding] = useState(false);
  const [seen, setSeen] = useState(() => new Set(storage.getJson<string[]>(SEEN_KEY, []) ?? []));
  const { children } = useSelectedChild();
  const links = useParentLinks();
  const declined = parentFamily.recentUnlink(links.data ?? [], new Set(children.map((child) => child.id)), seen, now);
  const first = declined ? declined.student.name.split(" ")[0] || declined.student.name : "";

  function dismiss(next: () => void) {
    if (!declined) return;
    const ids = new Set(seen).add(declined.id);
    storage.setJson(SEEN_KEY, [...ids]);
    setSeen(ids);
    next();
  }

  return (
    <View style={styles.fill}>
      {content}
      {declined ? (
        <ParentStateScreen
          icon="link"
          tone="danger"
          title={t("states.unlinked.title", { name: first })}
          text={t("states.unlinked.text", { name: declined.student.name })}
          secondary={{ label: t("states.unlinked.ok"), onPress: () => dismiss(() => router.navigate(ROUTES.parent.children as never)) }}
          primary={{ label: t("states.unlinked.again"), onPress: () => dismiss(() => setAdding(true)) }}
        />
      ) : null}
      <AddChildDialog open={adding} onOpenChange={setAdding} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
