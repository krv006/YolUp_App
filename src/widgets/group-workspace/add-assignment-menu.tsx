import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import {
  DsText,
  dsRadius,
  Icon,
  PopoverMenu,
  toneColors,
  useDs,
  usePopoverAnchor,
  type IconName,
} from "@/shared/ui";

const OPTIONS: ReadonlyArray<{ id: "new" | "bank"; icon: IconName; tone: string }> = [
  { id: "new", icon: "edit", tone: "bg-accent-violet-bg text-accent-violet-fg" },
  { id: "bank", icon: "menu-book", tone: "bg-brand-subtle text-brand" },
];

export interface AddAssignmentMenuProps {
  label: string;
  onCreate: () => void;
  onFromBank: () => void;
}

/**
 * "Vazifa berish" — veb `add-assignment-menu.tsx`: yangi vazifa yaratish
 * yoki bazadagi tayyor vazifani shu guruhga berish. Menyu `PopoverMenu`
 * (`add-quiz-menu` dagidek): avval yopiladi, keyin oyna ochiladi.
 */
export function AddAssignmentMenu({ label, onCreate, onFromBank }: AddAssignmentMenuProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const { anchorRef, rect, open, close } = usePopoverAnchor();

  return (
    <View ref={anchorRef} collapsable={false} style={styles.half}>
      {/* `h-11 gap-1.5 rounded-full bg-brand px-4 text-button text-on-action` */}
      <Pressable
        accessibilityRole="button"
        onPress={open}
        style={({ pressed }) => [
          styles.trigger,
          { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
        ]}
      >
        <Icon name="add" size={16} color={ds.c["on-action"]} />
        <DsText v="button" c="on-action" numberOfLines={1} style={styles.shrink}>
          {label}
        </DsText>
        <Icon name={rect ? "expand-less" : "expand-more"} size={18} color={ds.c["on-action"]} />
      </Pressable>
      <PopoverMenu rect={rect} onClose={close} width={320} height={64 * 2 + 12}>
        {OPTIONS.map((option) => {
          const tone = toneColors(option.tone, ds);
          return (
            <Pressable
              key={option.id}
              accessibilityRole="menuitem"
              onPress={() => {
                close();
                if (option.id === "new") onCreate();
                else onFromBank();
              }}
              style={({ pressed }) => [styles.item, pressed && { backgroundColor: ds.c.subtle }]}
            >
              <View style={[styles.icon, { backgroundColor: tone.bg }]}>
                <Icon name={option.icon} size={20} color={tone.fg ?? ds.c.ink} />
              </View>
              <View style={styles.grow}>
                <DsText w="600" numberOfLines={1} style={styles.title}>
                  {option.id === "new" ? t("bank.newAssignment") : t("bank.fromBank")}
                </DsText>
                <DsText v="body-sm" c="ink-secondary" numberOfLines={1} style={styles.hint}>
                  {option.id === "new" ? t("bank.newAssignmentHint") : t("bank.fromBankHint")}
                </DsText>
              </View>
              <Icon name="chevron-right" size={20} color={ds.c["ink-secondary"]} />
            </Pressable>
          );
        })}
      </PopoverMenu>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  /* teng ikki ustun (`grid-cols-2`) */
  half: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  trigger: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  /* `h-16 gap-3 rounded-lg px-3.5` */
  item: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    borderRadius: dsRadius.lg,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: dsRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, lineHeight: 20 },
  hint: { marginTop: 4, lineHeight: 18 },
});
