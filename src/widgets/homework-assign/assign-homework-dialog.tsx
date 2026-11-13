import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useCourseStudents } from "@/modules/course";
import { useAssignFromBank, useHomeworkBank } from "@/modules/homework";
import { StudentChecklist } from "@/modules/quiz/ui/student-checklist";
import type { Assignment } from "@/shared/types";
import {
  DsText,
  dsRadius,
  MobileButton,
  MobileFieldLabel,
  MobilePickerField,
  Sheet,
  Switch,
  toast,
  useDs,
} from "@/shared/ui";
import { GroupTargetsPicker } from "./group-targets-picker";
import { hasEmptyTarget, targetOf, targetsOf, type GroupPicks } from "./group-targets";

export interface AssignHomeworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — shu bazadagi vazifa beriladi (tanlov ko'rinmaydi). */
  assignment?: Assignment | null;
  /** Berilsa — guruh ichidan: shu guruh o'quvchilari ro'yxati. */
  courseId?: string | null;
  onAssigned?: (created: Assignment[]) => void;
}

function dateLabel(value: string, months: string[]): string {
  const day = new Date(`${value}T00:00`);
  return Number.isNaN(day.getTime())
    ? value
    : `${day.getDate()}-${(months[day.getMonth()] ?? "").slice(0, 3).toLowerCase()}`;
}

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Bazadan berish — veb `assign-homework-dialog.tsx` ning tor ekran varianti
 * (pastki oyna): bazadagi vazifa (oldindan aniq bo'lmasa), kimlarga —
 * guruh ichidan bo'lsa shu guruh o'quvchilari, aks holda guruhlar va
 * ulardagi o'quvchilar; muddat sanasi va vaqti, kech topshirish va chatga
 * e'lon; "Bekor qilish" va "Berish". Hamma guruhlar bitta so'rovda (`targets`).
 */
export function AssignHomeworkDialog({
  open,
  onOpenChange,
  assignment = null,
  courseId = null,
  onAssigned,
}: AssignHomeworkDialogProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const assign = useAssignFromBank();
  const bank = useHomeworkBank(open && !assignment);
  const [pickedId, setPickedId] = useState("");
  const [picks, setPicks] = useState<GroupPicks>(() => new Map());
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [date, setDate] = useState(() => inDays(7));
  const [time, setTime] = useState("23:59");
  const [allowLate, setAllowLate] = useState(true);
  const [announce, setAnnounce] = useState(true);

  const source = assignment ?? bank.data?.find((item) => item.id === pickedId) ?? null;
  const enrollments = useCourseStudents(courseId, { page_size: 100 }, open && Boolean(courseId));
  const students = useMemo(
    () =>
      (enrollments.data?.items ?? [])
        .filter((item) => item.status === "approved")
        .map((item) => ({
          id: item.student.id,
          name: item.student.name,
          avatarUrl: item.student.avatarUrl,
        })),
    [enrollments.data]
  );
  const targets = courseId
    ? [targetOf(courseId, { excluded, studentIds: students.map((student) => student.id) })]
    : targetsOf(picks);
  const nobody = hasEmptyTarget(targets);

  function close() {
    setPickedId("");
    setPicks(new Map());
    setExcluded(new Set());
    onOpenChange(false);
  }

  function submit() {
    if (!source) return;
    assign.mutate(
      {
        id: source.id,
        input: {
          targets,
          dueAt: date ? `${date}T${time || "23:59"}` : null,
          allowLate,
          announceInChat: announce,
        },
      },
      {
        onSuccess: (created) => {
          onAssigned?.(created);
          close();
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t("bank.assignTitle")}
      description={assignment ? assignment.title : t("bank.assignDescription")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("bank.cancel")} onPress={close} />
          <MobileButton
            label={t("bank.assignAction")}
            disabled={!source || nobody || assign.isPending}
            onPress={submit}
          />
        </>
      }
    >
      <View style={styles.body}>
        {assignment ? null : (
          <MobileFieldLabel label={t("bank.pickLabel")}>
            <MobilePickerField
              type="select"
              value={pickedId}
              display={source ? source.title : t("bank.pick")}
              placeholder={!source}
              ariaLabel={t("bank.pickLabel")}
              options={[
                { value: "", label: t("bank.pick") },
                ...(bank.data ?? []).map((item) => ({ value: item.id, label: item.title })),
              ]}
              onChange={setPickedId}
            />
          </MobileFieldLabel>
        )}

        {courseId ? (
          <StudentChecklist
            students={students}
            excluded={excluded}
            loading={enrollments.isLoading}
            onChange={setExcluded}
          />
        ) : (
          <GroupTargetsPicker value={picks} onChange={setPicks} />
        )}

        <View style={styles.pair}>
          <View style={styles.grow}>
            <MobileFieldLabel label={t("form.due")}>
              <MobilePickerField
                type="date"
                value={date}
                display={dateLabel(date, months)}
                ariaLabel={t("form.due")}
                onChange={setDate}
              />
            </MobileFieldLabel>
          </View>
          <View style={styles.grow}>
            <MobileFieldLabel label={t("form.time")}>
              <MobilePickerField
                type="time"
                value={time}
                display={time}
                ariaLabel={t("form.time")}
                onChange={setTime}
              />
            </MobileFieldLabel>
          </View>
        </View>

        {/* `gap-3 rounded-xl bg-subtle p-4` */}
        <View style={[styles.switches, { backgroundColor: ds.c.subtle }]}>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: allowLate }}
            onPress={() => setAllowLate(!allowLate)}
            style={styles.switchRow}
          >
            <DsText v="body-sm" style={styles.grow}>
              {t("bank.allowLate")}
            </DsText>
            <Switch
              checked={allowLate}
              onCheckedChange={setAllowLate}
              accessibilityLabel={t("bank.allowLate")}
            />
          </Pressable>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: announce }}
            onPress={() => setAnnounce(!announce)}
            style={styles.switchRow}
          >
            <View style={styles.grow}>
              <DsText v="body-sm">{t("form.announce")}</DsText>
              <DsText v="caption" c="ink-tertiary">
                {t("bank.announceHint")}
              </DsText>
            </View>
            <Switch
              checked={announce}
              onCheckedChange={setAnnounce}
              accessibilityLabel={t("form.announce")}
            />
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  body: { gap: 16 },
  pair: { flexDirection: "row", gap: 12 },
  switches: { gap: 12, padding: 16, borderRadius: dsRadius.xl },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
