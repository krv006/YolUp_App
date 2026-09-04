import { StyleSheet, View } from "react-native";
import { useSelectedChild } from "@/modules/parent";
import { Avatar, Chip, ChipRow, Text } from "@/shared/ui";

/**
 * Farzand tanlash — veb `selected-child-selector.tsx` ning mobil varianti.
 *
 * Veb'da bu sarlavhadagi ochiladigan ro'yxat edi. Mobilda gorizontal chip
 * qatori afzal: bir farzandda umuman ko'rinmaydi (shovqin qo'shmaydi),
 * ikki-uchtada esa tanlash bir teginish bilan bo'ladi — ro'yxat ochib,
 * band tanlab, yopishdan tezroq.
 */
export function ChildSelector() {
  const { children, selectedChildId, selectChild } = useSelectedChild();

  // Bitta farzandda tanlashning ma'nosi yo'q.
  if (children.length < 2) return null;

  return (
    <View style={styles.wrapper}>
      <ChipRow>
        {children.map((child) => (
          <Chip
            key={child.id}
            label={child.name}
            selected={child.id === selectedChildId}
            onPress={() => selectChild(child.id)}
          />
        ))}
      </ChipRow>
    </View>
  );
}

/** Tanlangan farzandning qisqa sarlavhasi — ekran tepasida. */
export function SelectedChildHeader() {
  const { selectedChild } = useSelectedChild();
  if (!selectedChild) return null;

  return (
    <View style={styles.header}>
      <Avatar name={selectedChild.name} tone={selectedChild.avatarTone} size="md" />
      <View style={styles.headerBody}>
        <Text variant="label" numberOfLines={1}>
          {selectedChild.name}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {selectedChild.grade || selectedChild.username}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: -16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerBody: { flex: 1, gap: 2 },
});
