import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { Avatar, DsText, MobilePageHeader, MobileRoundButton, useDs } from "@/shared/ui";
import { ParentScreen, useParentBack } from "@/widgets/parent-shell";
import { ConsentSwitches } from "./consent-switches";

/** Farzand ruxsatlari sahifasi — veb `parent-child-permissions-page.tsx` (faqat telefon). */
export function ParentChildPermissionsPage({ childId }: { childId: string }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const back = useParentBack(ROUTES.parent.child(childId));
  const { children, childrenQuery } = useSelectedChild();
  const child = children.find((item) => item.id === childId) ?? null;
  if (!childrenQuery.isLoading && !child) return <Redirect href={ROUTES.parent.children as never} />;

  return (
    <ParentScreen>
      <MobilePageHeader
        title={t("profile.permissions")}
        backLabel={t("profile.title")}
        onBack={back}
        action={<MobileRoundButton icon="history" label={t("profile.logins")} onPress={() => router.push(ROUTES.parent.childLogins(childId) as never)} />}
      />
      {child ? (
        <>
          {/* `flex items-center gap-3 rounded-[20px] bg-brand-subtle p-4` */}
          <View style={[styles.hero, { backgroundColor: ds.c["brand-subtle"] }]}>
            <Avatar variant="legacy" name={child.name} src={child.avatarUrl ?? undefined} tone={child.avatarTone} size="md" box={48} />
            <View style={styles.grow}>
              <DsText v="title" numberOfLines={1}>
                {t("mobile.profile.permissionsFor", { name: child.name.split(" ")[0] })}
              </DsText>
              <DsText v="body-xs" c="ink-secondary">
                {t("mobile.profile.permissionsHint")}
              </DsText>
            </View>
          </View>
          <ConsentSwitches childId={child.id} childName={child.name} />
        </>
      ) : (
        <View style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />
      )}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20 },
  skeleton: { height: 260, borderRadius: 20 },
});
