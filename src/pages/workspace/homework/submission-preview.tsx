import { useQuery } from "@tanstack/react-query";
import { Image, StyleSheet, View } from "react-native";
import { homeworkApi } from "@/modules/homework";
import { writeBlobToCache } from "@/shared/lib";
import { DsText, Icon, useDs } from "@/shared/ui";

const IMAGE_FILE = /\.(png|jpe?g|webp|gif|heic)$/i;

/**
 * Topshiriq fayli ko'rinishi — veb `submission-preview.tsx`: rasm bo'lsa
 * token bilan yuklanib (keshga yoziladi) ko'rsatiladi, aks holda fayl nomi.
 */
export function SubmissionPreview({ id, fileName }: { id: string; fileName: string }) {
  const ds = useDs();
  const isImage = IMAGE_FILE.test(fileName);
  const file = useQuery({
    queryKey: ["homework", "submission-file", id],
    queryFn: async ({ signal }) => {
      const blob = await homeworkApi.downloadSubmission(id, { signal });
      if (!(blob instanceof Blob)) return null;
      return (await writeBlobToCache(blob, fileName)).uri;
    },
    enabled: isImage,
    staleTime: Infinity,
  });

  if (isImage && file.data) return <Image source={{ uri: file.data }} style={styles.image} resizeMode="contain" />;

  return (
    <View style={styles.file}>
      <Icon name="image" size={32} color={ds.c["icon-tertiary"]} />
      <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
        {fileName}
      </DsText>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: "100%" },
  file: { alignItems: "center", gap: 8, paddingHorizontal: 24 },
});
