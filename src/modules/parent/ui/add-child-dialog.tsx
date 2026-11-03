import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { DsText, dsRadius, Icon, Sheet, useDs, type DsColor, type IconName } from "@/shared/ui";
import { CreateChildDialog } from "./create-child-dialog";
import { LinkChildDialog } from "./link-child-dialog";

export interface AddChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Method = "link" | "create";

const METHODS: Array<{ id: Method; icon: IconName; bg: DsColor; fg: DsColor }> = [
  { id: "link", icon: "link", bg: "brand-subtle", fg: "brand" },
  { id: "create", icon: "person-add", bg: "accent-green-bg", fg: "accent-green-fg" },
];

/** Pastki oyna yopilib bo'lgach keyingisi ochiladi — ikki `Modal` bir vaqtda turmasin. */
const SWAP_DELAY_MS = 350;

/**
 * Farzand qo'shish — veb `modules/parent/ui/add-child-dialog.tsx` ning telefon
 * shoxi: pastki oynada ikki usul (mavjud hisobni bog'lash yoki yangi hisob
 * ochish), bosilgani darhol o'z oynasini ochadi.
 */
export function AddChildDialog({ open, onOpenChange }: AddChildDialogProps) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const [next, setNext] = useState<Method | null>(null);

  function choose(method: Method) {
    onOpenChange(false);
    setTimeout(() => setNext(method), SWAP_DELAY_MS);
  }

  return (
    <>
      <Sheet
        variant="app"
        open={open}
        onClose={() => onOpenChange(false)}
        title={t("addChild.title")}
        description={t("addChild.description")}
        headingTitle="semibold"
      >
        {/* `flex flex-col gap-3 px-1`, qator `rounded-2xl bg-subtle px-5 py-4 gap-4` */}
        <View accessibilityRole="radiogroup" style={styles.list}>
          {METHODS.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => choose(item.id)}
              style={({ pressed }) => [styles.method, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }]}
            >
              <View style={[styles.methodIcon, { backgroundColor: ds.c[item.bg] }]}>
                <Icon name={item.icon} size={22} color={ds.c[item.fg]} />
              </View>
              <View style={styles.methodText}>
                <DsText v="title-sm">{t(`addChild.${item.id}Title`)}</DsText>
                <DsText v="body-sm" c="ink-secondary">
                  {t(`addChild.${item.id}Text`)}
                </DsText>
              </View>
              <Icon name="chevron-right" size={20} color={ds.c["icon-tertiary"]} />
            </Pressable>
          ))}
        </View>
      </Sheet>

      <LinkChildDialog open={next === "link"} onOpenChange={(value) => setNext(value ? "link" : null)} />
      <CreateChildDialog open={next === "create"} onOpenChange={(value) => setNext(value ? "create" : null)} />
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, paddingHorizontal: 4, paddingBottom: 8 },
  method: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingVertical: 16, borderRadius: dsRadius["2xl"] },
  methodIcon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  methodText: { flex: 1, minWidth: 0, gap: 2 },
});
