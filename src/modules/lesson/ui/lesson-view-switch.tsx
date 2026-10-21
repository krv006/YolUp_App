import { useTranslation } from "react-i18next";
import { CalendarDays, ListChecks } from "lucide-react-native";
import { ViewSelect } from "@/shared/ui";
import type { LessonView } from "../model/lesson-view.store";

export interface LessonViewSwitchProps {
  view: LessonView;
  onChange: (view: LessonView) => void;
}

/** Ro'yxat / Kalendar tanlagichi — veb `lesson-view-switch.tsx` (168px). */
export function LessonViewSwitch({ view, onChange }: LessonViewSwitchProps) {
  const { t } = useTranslation("lesson");
  return (
    <ViewSelect<LessonView>
      style={{ width: 168 }}
      label={t("viewSwitch.aria")}
      value={view}
      onChange={onChange}
      options={[
        { value: "list", label: t("viewSwitch.list"), icon: ListChecks },
        { value: "calendar", label: t("viewSwitch.calendar"), icon: CalendarDays },
      ]}
    />
  );
}
