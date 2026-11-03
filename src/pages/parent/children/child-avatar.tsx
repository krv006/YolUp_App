import { StyleSheet, View } from "react-native";
import type { ParentChild } from "@/modules/parent";
import { Avatar, useDs } from "@/shared/ui";

/* `[&_.avatar]:size-*` — md 56, sm 52, lg 80, xl 88 */
const SIZES = { md: 56, sm: 52, lg: 80, xl: 88 } as const;

/** Farzand avatari — veb `child-avatar.tsx`: onlayn bo'lsa pastki burchakda yashil nuqta. */
export function ChildAvatar({ child, size = "md" }: { child: ParentChild; size?: keyof typeof SIZES }) {
  const ds = useDs();
  const large = size === "xl" || size === "lg";
  return (
    <View style={styles.wrap}>
      <Avatar variant="legacy" name={child.name} src={child.avatarUrl ?? undefined} tone={child.avatarTone} size={large ? "xl" : "md"} box={SIZES[size]} />
      {child.isOnline ? (
        <View style={[large ? styles.dotLarge : styles.dot, { backgroundColor: ds.c.success, borderColor: ds.c.surface }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexShrink: 0 },
  /* `absolute right-0 bottom-0 size-4 border-[3px] border-surface` */
  dot: { position: "absolute", right: 0, bottom: 0, width: 16, height: 16, borderRadius: 8, borderWidth: 3 },
  dotLarge: { position: "absolute", right: 4, bottom: 4, width: 20, height: 20, borderRadius: 10, borderWidth: 3 },
});
