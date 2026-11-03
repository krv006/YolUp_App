import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AddChildDialog, useParentLinks, useSelectedChild } from "@/modules/parent";
import { Avatar, DsText, dsRadius, Icon, Sheet, toast, useDs } from "@/shared/ui";

/** Pastki oyna yopilib bo'lgach keyingisi ochiladi — ikki `Modal` bir vaqtda turmasin. */
const SWAP_DELAY_MS = 350;

/**
 * Farzand chiplari — veb `widgets/parent-shell/child-chips.tsx`: gorizontal
 * qator (tanlangani ko'k ramkada), oxirida "+" (farzand qo'shish). Tanlangan
 * chip bosilsa pastki oynada ro'yxat: farzandlar (radio) va kutilayotgan
 * so'rovlar, pastda "Farzand qo'shish".
 */
export function ChildChips() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const { children, selectedChildId, selectChild } = useSelectedChild();
  const links = useParentLinks();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const pending = (links.data ?? []).filter((link) => link.status === "pending");

  function choose(id: string, name: string) {
    if (id === selectedChildId) return;
    selectChild(id);
    toast.success(t("mobile.switcher.selected", { name: name.split(" ")[0] || name }));
  }

  return (
    <>
      {/* `-mx-4 flex gap-2 overflow-x-auto px-4 pb-1` */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.chips}>
        {children.map((child) => {
          const active = child.id === selectedChildId;
          return (
            <Pressable
              key={child.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => (active ? setPickerOpen(true) : choose(child.id, child.name))}
              style={[styles.chip, { backgroundColor: ds.c.surface, borderColor: active ? ds.c.brand : "transparent" }]}
            >
              <Avatar variant="legacy" name={child.name} src={child.avatarUrl ?? undefined} tone={child.avatarTone} size="sm" box={32} />
              <DsText v="title-sm" c={active ? "ink" : "ink-secondary"}>
                {child.name.split(" ")[0]}
              </DsText>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("switcher.add")}
          onPress={() => setAdding(true)}
          style={[styles.add, { backgroundColor: ds.c.surface, borderColor: ds.c["line-strong"] }]}
        >
          <Icon name="add" size={20} color={ds.c.brand} />
        </Pressable>
      </ScrollView>

      <Sheet
        variant="app"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t("mobile.switcher.title")}
        description={t("mobile.switcher.subtitle")}
        footer={
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setPickerOpen(false);
              setTimeout(() => setAdding(true), SWAP_DELAY_MS);
            }}
            style={({ pressed }) => [styles.addWide, { backgroundColor: ds.c["brand-subtle"], opacity: pressed ? 0.85 : 1 }]}
          >
            <Icon name="add" size={20} color={ds.c.brand} />
            <DsText v="title-sm" c="brand">
              {t("switcher.add")}
            </DsText>
          </Pressable>
        }
      >
        <View accessibilityRole="radiogroup">
          {children.map((child) => {
            const active = child.id === selectedChildId;
            return (
              <Pressable
                key={child.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => {
                  choose(child.id, child.name);
                  setPickerOpen(false);
                }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <Avatar variant="legacy" name={child.name} src={child.avatarUrl ?? undefined} tone={child.avatarTone} size="md" box={48} />
                <View style={styles.grow}>
                  <DsText v="title" numberOfLines={1}>
                    {child.name}
                  </DsText>
                  <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                    {child.username}
                  </DsText>
                </View>
                <View style={[styles.radio, { borderColor: active ? ds.c.brand : ds.c["line-strong"] }]}>
                  {active ? <View style={[styles.radioDot, { backgroundColor: ds.c.brand }]} /> : null}
                </View>
              </Pressable>
            );
          })}
          {pending.map((link) => (
            <View key={link.id} style={styles.row}>
              <Avatar variant="legacy" name={link.student.name} src={link.student.avatarUrl ?? undefined} size="md" box={48} />
              <View style={styles.grow}>
                <DsText v="title" numberOfLines={1}>
                  {link.student.name}
                </DsText>
                <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                  {t("mobile.switcher.requested", { username: link.student.username })}
                </DsText>
              </View>
              <View style={[styles.pending, { backgroundColor: ds.c["accent-teal-bg"] }]}>
                <Icon name="schedule" size={14} color={ds.c["accent-teal-fg"]} />
                <DsText v="caption-strong" c="accent-teal-fg">
                  {t("switcher.pending")}
                </DsText>
              </View>
            </View>
          ))}
        </View>
      </Sheet>
      <AddChildDialog open={adding} onOpenChange={setAdding} />
    </>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  strip: { marginHorizontal: -16, flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  /* `h-11 rounded-full border-2 bg-surface py-1 pr-4 pl-1 gap-2 text-title-sm` */
  chip: { height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 4, paddingRight: 16, borderWidth: 2, borderRadius: dsRadius.full },
  /* `size-11 rounded-full border-2 border-dashed border-line-strong bg-surface` */
  add: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  /* `flex h-13 flex-1 rounded-full bg-brand-subtle text-title-sm font-semibold text-brand` */
  addWide: { flex: 1, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: dsRadius.full },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  pending: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
});
