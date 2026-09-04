import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BookOpen, MessageCircle, UsersRound } from "lucide-react-native";
import {
  DIRECT_STATUS,
  directStatusLabel,
  useRequestDirect,
  useTeachersForDirect,
  type DirectTeacher,
} from "@/modules/conversation";
import { useCourseCatalog, useCreateEnrollment } from "@/modules/course";
import { useParentLinks, useRespondParentLink } from "@/modules/parent";
import {
  Avatar,
  Button,
  radius,
  ScreenLoading,
  Sheet,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";

export interface StudentEnrollmentSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "Yangi muloqot" — veb `student-enrollment-dialog.tsx` ning mobil varianti.
 *
 * O'quvchi uchun BOSHLANG'ICH oyna: busiz yangi hisob hech qayerga
 * qo'shila olmaydi. Uch bo'lim:
 *   1) Ota-ona so'rovlarini tasdiqlash — rozilik modeli shu yerdan boshlanadi
 *      (bola tasdig'isiz ota-ona hech narsa ko'rmaydi, PROJECT.md §4)
 *   2) O'qituvchiga shaxsiy so'rov (bir martalik, keyin qabul/block)
 *   3) Ochiq kurslarga yozilish
 *
 * So'rovlar faqat oyna OCHIQ bo'lganda yuboriladi (`enabled: open`) — veb'da
 * ham shunday, aks holda har sahifa ochilishida uchta ortiqcha so'rov ketardi.
 */
export function StudentEnrollmentSheet({ open, onClose }: StudentEnrollmentSheetProps) {
  const router = useRouter();
  const { palette } = useTheme();

  const catalog = useCourseCatalog({ page_size: 100 }, open);
  const teachers = useTeachersForDirect(open);
  const links = useParentLinks(open);

  const enroll = useCreateEnrollment();
  const direct = useRequestDirect();
  const respondLink = useRespondParentLink();

  const pendingLinks = (links.data ?? []).filter((item) => item.status === "pending");

  async function openTeacher(teacher: DirectTeacher) {
    // Suhbat allaqachon ochiq bo'lsa — to'g'ridan-to'g'ri kiramiz.
    if (teacher.roomId && teacher.directStatus === DIRECT_STATUS.ACTIVE) {
      onClose();
      router.push(`/student/chats/${teacher.roomId}`);
      return;
    }
    try {
      const room = await direct.mutateAsync(teacher.id);
      onClose();
      if (room.directStatus === DIRECT_STATUS.ACTIVE) {
        router.push(`/student/chats/${room.id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "So'rov yuborilmadi");
    }
  }

  const loading = catalog.isLoading || teachers.isLoading || links.isLoading;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Yangi muloqot"
      description="O'qituvchiga so'rov yuboring yoki ochiq kursga qo'shiling."
    >
      {loading ? <ScreenLoading label="Yuklanmoqda…" /> : null}

      {pendingLinks.length > 0 ? (
        <>
          <SectionLabel>Ota-ona so'rovlari</SectionLabel>
          {pendingLinks.map((link) => (
            <View key={link.id} style={styles.row}>
              <Avatar name={link.parent.name} tone="amber" size="md" />
              <View style={styles.body}>
                <Text variant="label" numberOfLines={1}>
                  {link.parent.name}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  @{link.parent.username} · profilingizga bog'lanmoqchi
                </Text>
              </View>
              <View style={styles.linkActions}>
                <Button
                  title="Rad"
                  variant="secondary"
                  fullWidth={false}
                  loading={respondLink.isPending}
                  onPress={() => respondLink.mutate({ id: link.id, action: "decline" })}
                />
                <Button
                  title="Tasdiq"
                  fullWidth={false}
                  loading={respondLink.isPending}
                  onPress={() => respondLink.mutate({ id: link.id, action: "approve" })}
                />
              </View>
            </View>
          ))}
        </>
      ) : null}

      <SectionLabel>O'qituvchiga yozish</SectionLabel>
      {(teachers.data ?? []).length === 0 && !loading ? (
        <Text variant="caption" tone="muted">
          Mavjud o'qituvchi topilmadi.
        </Text>
      ) : null}
      {(teachers.data ?? []).map((teacher) => (
        <View key={teacher.id} style={styles.row}>
          <Avatar name={teacher.name} tone="violet" size="md" />
          <View style={styles.body}>
            <Text variant="label" numberOfLines={1}>
              {teacher.name}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              @{teacher.username} · {directStatusLabel(teacher.directStatus)}
            </Text>
          </View>
          <Button
            title={teacher.directStatus === DIRECT_STATUS.ACTIVE ? "Ochish" : "So'rov"}
            variant="secondary"
            fullWidth={false}
            icon={<MessageCircle size={15} color={palette["secondary-foreground"]} />}
            // Bloklangan suhbatni qayta ochib bo'lmaydi (backend qoidasi).
            disabled={teacher.directStatus === DIRECT_STATUS.BLOCKED}
            loading={direct.isPending}
            onPress={() => void openTeacher(teacher)}
          />
        </View>
      ))}

      <SectionLabel>Kurslarga qo'shilish</SectionLabel>
      {(catalog.data?.items ?? []).length === 0 && !loading ? (
        <Text variant="caption" tone="muted">
          Hozircha ochiq kurs yo'q.
        </Text>
      ) : null}
      {(catalog.data?.items ?? []).map((course) => (
        <View key={course.id} style={styles.row}>
          <View style={[styles.icon, { backgroundColor: palette["primary-tint"] }]}>
            <BookOpen size={18} color={palette["primary-text"]} />
          </View>
          <View style={styles.body}>
            <Text variant="label" numberOfLines={1}>
              {course.title}
            </Text>
            <View style={styles.meta}>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {course.teacher}
              </Text>
              <UsersRound size={12} color={palette["muted-foreground"]} />
              <Text variant="caption" tone="muted">
                {course.students}
              </Text>
            </View>
          </View>
          <Button
            title={
              course.enrollmentStatus === "pending"
                ? "Kutilmoqda"
                : course.enrollmentStatus === "approved"
                  ? "A'zo"
                  : "Qo'shilish"
            }
            variant="secondary"
            fullWidth={false}
            disabled={Boolean(course.enrollmentStatus)}
            loading={enroll.isPending}
            onPress={() => enroll.mutate({ courseId: course.id, payload: {} })}
          />
        </View>
      ))}
    </Sheet>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="caption" tone="muted" style={styles.sectionLabel}>
      {children.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { paddingTop: 12, letterSpacing: 0.6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  body: { flex: 1, gap: 2 },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  linkActions: { flexDirection: "row", gap: 6 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
