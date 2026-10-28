import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { DsText, useDs } from "@/shared/ui";
import { useBoard } from "../model/board.queries";
import { useBoardRealtime } from "../model/use-board-realtime";
import { BoardCanvas } from "./board-canvas";

export interface BoardPreviewProps {
  lessonId: string;
  currentUserId?: string | null;
}

function ignore() {}

/**
 * Doska ko'rinishi (faqat o'qish) — veb `board-preview.tsx`: jonli darsda
 * sahnada oxirgi varaq, "N-varaq" yorlig'i yoki bo'sh holat matni.
 */
export function BoardPreview({ lessonId, currentUserId }: BoardPreviewProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  const realtime = useBoardRealtime(lessonId, true, currentUserId);
  const board = useBoard(lessonId, { live: realtime.connected });
  const state = board.data;
  const sheets = state?.sheets ?? [];
  const sheet = sheets[sheets.length - 1];

  return (
    <View style={[styles.root, { backgroundColor: ds.c.surface }]}>
      <DsText v="caption" c="ink-secondary" style={styles.label}>
        {t("preview.label", { page: Math.max(sheets.length, 1) })}
      </DsText>
      {state && sheet?.strokes.length ? (
        <View pointerEvents="none" style={styles.canvas}>
          <BoardCanvas
            strokes={sheet.strokes}
            width={state.width}
            height={state.height}
            tool="pen"
            color={ds.c.ink}
            strokeWidth={2}
            enabled={false}
            onCommit={ignore}
            onPlacePoint={ignore}
          />
        </View>
      ) : (
        <View style={styles.empty}>
          <DsText v="body-sm" c="ink-secondary" style={styles.center}>
            {t("preview.empty")}
          </DsText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  label: { paddingHorizontal: 16, paddingTop: 16 },
  canvas: { flex: 1, minHeight: 0 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  center: { textAlign: "center" },
});
