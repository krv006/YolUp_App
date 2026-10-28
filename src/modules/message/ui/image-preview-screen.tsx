import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Plus, X } from "lucide-react-native";
import { formatFileSize, type PickedFile } from "@/shared/lib";
import { bodyFont, dsAlpha, DsText, dsRadius, dsType, Icon, useDs } from "@/shared/ui";

export interface ImagePreviewScreenProps {
  files: PickedFile[];
  caption: string;
  onCaptionChange: (caption: string) => void;
  onRemove: (index: number) => void;
  onAddMore: () => void;
  onCancel: () => void;
  onSend: () => void;
}

/**
 * Rasm yuborish ekrani — veb `image-preview-screen.tsx` (doim qorong'i
 * temada, `data-theme="dark"`): tepada yopish, "N ta rasm" va yuborish,
 * o'rtada oq maydonda tanlangan rasm, ostida kichik rasmlar, hajm va izoh
 * maydoni.
 */
export function ImagePreviewScreen({ files, caption, onCaptionChange, onRemove, onAddMore, onCancel, onSend }: ImagePreviewScreenProps) {
  const { t } = useTranslation("chat");
  const ds = useDs("dark");
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(0);
  const total = files.reduce((sum, file) => sum + file.size, 0);
  const current = Math.min(active, Math.max(0, files.length - 1));
  const white = "#ffffff";

  return (
    <Modal visible transparent={false} animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onCancel}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior="padding" style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("preview.cancel")} onPress={onCancel} style={[styles.round, { backgroundColor: white }]}>
            <X size={22} color={ds.c.surface} />
          </Pressable>
          <DsText v="title" style={[styles.title, { color: white }]}>
            {t("preview.title", { count: files.length })}
          </DsText>
          <Pressable accessibilityRole="button" accessibilityLabel={t("preview.send")} onPress={onSend} style={[styles.round, { backgroundColor: white }]}>
            <Icon name="logout" size={22} color={ds.c.surface} />
          </Pressable>
        </View>

        <View style={[styles.stage, { backgroundColor: white }]}>
          {files[current] ? <Image source={{ uri: files[current].uri }} style={styles.picture} resizeMode="contain" /> : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs} style={styles.thumbsScroll}>
          {files.map((file, index) => (
            <View key={`${file.uri}-${index}`} style={styles.thumbWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("preview.selectAria", { number: index + 1 })}
                onPress={() => setActive(index)}
                style={[styles.thumb, { backgroundColor: white, borderColor: index === current ? ds.c.action : "transparent" }]}
              >
                <Image source={{ uri: file.uri }} style={styles.thumbImage} resizeMode="cover" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("preview.removeAria", { number: index + 1 })}
                onPress={() => onRemove(index)}
                hitSlop={6}
                style={[styles.remove, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.xs }]}
              >
                <X size={12} color={ds.c.ink} />
              </Pressable>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("preview.addMore")}
            onPress={onAddMore}
            style={[styles.thumb, styles.add, { borderColor: dsAlpha(white, 0.6) }]}
          >
            <Plus size={22} color={white} />
          </Pressable>
        </ScrollView>

        <DsText v="caption" style={[styles.quality, { color: dsAlpha(white, 0.8) }]}>
          {t("preview.quality", { size: formatFileSize(total) })}
        </DsText>

        <View style={[styles.captionRow, { backgroundColor: dsAlpha(ds.c.surface, 0.5), paddingBottom: Math.max(24, insets.bottom + 12) }]}>
          <TextInput
            value={caption}
            onChangeText={onCaptionChange}
            placeholder={t("preview.captionPlaceholder")}
            placeholderTextColor={dsAlpha(white, 0.6)}
            accessibilityLabel={t("preview.captionPlaceholder")}
            selectionColor={ds.c.action}
            style={[styles.input, { backgroundColor: ds.c.surface, color: white }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("preview.send")}
            onPress={onSend}
            style={({ pressed }) => [styles.round, { backgroundColor: pressed ? ds.c["action-hover"] : ds.c.action }]}
          >
            <Icon name="send" size={20} color={ds.c["on-action"]} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* `items-center gap-3 px-4 pt-5` */
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, minWidth: 0, textAlign: "center" },
  /* `mx-4 mt-4.5 flex-1 rounded-2xl bg-white` */
  stage: { flex: 1, minHeight: 0, marginHorizontal: 16, marginTop: 18, overflow: "hidden", alignItems: "center", justifyContent: "center", borderRadius: dsRadius["2xl"] },
  picture: { width: "100%", height: "100%" },
  thumbsScroll: { flexGrow: 0 },
  /* `items-center gap-2 px-4 pt-4` */
  thumbs: { alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  thumbWrap: { paddingTop: 4, paddingRight: 4 },
  thumb: { width: 56, height: 56, overflow: "hidden", borderWidth: 2, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  thumbImage: { width: "100%", height: "100%" },
  remove: { position: "absolute", top: 0, right: 0, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  add: { borderWidth: 1.5, borderStyle: "dashed", marginTop: 4 },
  /* `px-4 pt-14`, ostidagi `gap-3` */
  quality: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  /* `gap-3 bg-surface/50 px-4 pt-2.5 pb-6` */
  captionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 10 },
  input: { flex: 1, minWidth: 0, height: 44, paddingHorizontal: 18, paddingVertical: 0, borderRadius: 22, fontSize: dsType.body.fontSize, fontFamily: bodyFont("400") },
});
