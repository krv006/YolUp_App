import { useState } from "react";
import { useParentHomework, useSelectedChild } from "@/modules/parent";
import { TabBadge } from "@/providers/role-tabs";

/**
 * "Vazifalar" tabidagi qizil son — veb `parent-tab-bar.tsx`: tanlangan
 * farzandning hali topshirilmagan va muddati o'tmagan vazifalari.
 */
export function OpenHomeworkBadge() {
  const { selectedChildId } = useSelectedChild();
  const homework = useParentHomework(selectedChildId);
  const [now] = useState(() => Date.now());
  const open = (homework.data ?? []).filter(
    (item) => item.status !== "draft" && !item.mySubmission && (!item.dueAt || Date.parse(item.dueAt) >= now)
  ).length;
  return open ? <TabBadge count={open} /> : null;
}
