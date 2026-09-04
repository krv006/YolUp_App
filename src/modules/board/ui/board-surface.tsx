import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { ArrowLeft, FilePlus2, Trash2 } from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import type { Point, StrokeShapeDto } from "../api/board.dto";
import { BOARD_COLORS, BOARD_TEXT_SIZE, BOARD_WIDTHS } from "../constants/board.constants";
import { useAddSheet, useAddStroke, useBoard, useEraseStrokes } from "../model/board.queries";
import { useBoardRealtime } from "../model/use-board-realtime";
import { BoardCanvas } from "./board-canvas";
import { BoardToolbar, type BoardTool } from "./board-toolbar";
import {
  Badge,
  Button,
  Chip,
  ChipRow,
  IconButton,
  Input,
  Screen,
  ScreenError,
  ScreenLoading,
  Sheet,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";

export interface BoardSurfaceProps {
  lessonId: string;
  /**
   * Jonli dars ichida ochilganmi. Shunda o'z sarlavhasi va "orqaga" tugmasi
   * ko'rsatilmaydi — ular xona sarlavhasida allaqachon bor.
   */
  embedded?: boolean;
}

/**
 * Dars doskasi — veb `board-panel.tsx` (391 qator) ning mobil varianti.
 *
 * Dars tugagach backend kurs chatiga `.../boards/<lesson_id>` havolasini
 * yuboradi (docs/PROJECT.md §10) va u AYNAN shu ekranga tushadi.
 *
 * Real-time (`useBoardRealtime`) 🟢 veb'dan ko'chirilgan: kelgan hodisalar
 * to'g'ridan-to'g'ri react-query keshiga qo'llanadi, shuning uchun har
 * chizmada qayta so'rov yuborilmaydi. Kanal ulanmasa `useBoard` pollingga
 * qaytadi — bu ham veb bilan bir xil.
 */
export function BoardSurface({ lessonId, embedded = false }: BoardSurfaceProps) {
  const router = useRouter();
  const { palette } = useTheme();
  const { user } = useAuth();

  // Doskada ishlayotganda ekran o'chib qolmasin.
  useKeepAwake();

  const realtime = useBoardRealtime(lessonId ?? "", Boolean(lessonId), user?.id ?? null);
  const board = useBoard(lessonId ?? "", { enabled: Boolean(lessonId), live: realtime.connected });
  const addStroke = useAddStroke(lessonId ?? "");
  const addSheet = useAddSheet(lessonId ?? "");
  const erase = useEraseStrokes(lessonId ?? "");

  const [sheet, setSheet] = useState(0);
  const [tool, setTool] = useState<BoardTool>("pen");
  const [color, setColor] = useState<string>(BOARD_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState<number>(BOARD_WIDTHS[1]);
  const [selected, setSelected] = useState<string | null>(null);

  const [placement, setPlacement] = useState<{ tool: "text" | "math"; point: Point } | null>(null);
  const [draftText, setDraftText] = useState("");
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");

  const state = board.data;
  const active = state?.sheets.find((item) => item.index === sheet) ?? state?.sheets[0];
  const canDraw = Boolean(state?.canDraw);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  /**
   * Chizmani real-time kanal orqali yuboramiz — server uni darhol hammaga
   * tarqatadi. Kanal yopiq bo'lsa REST ishlatiladi (docs: ikkalasi teng kuchli).
   * 🟢 Veb `board-panel.tsx` dagi bilan bir xil qoida.
   */
  function commitStroke(stroke: StrokeShapeDto) {
    if (!realtime.sendStroke(sheet, stroke)) addStroke.mutate({ sheet, stroke });
  }

  function placeText() {
    if (!placement || !draftText.trim()) return;
    commitStroke(
      placement.tool === "math"
        ? {
            type: "math",
            latex: draftText.trim(),
            x: placement.point[0],
            y: placement.point[1],
            size: BOARD_TEXT_SIZE,
            color,
          }
        : {
            type: "text",
            text: draftText.trim(),
            x: placement.point[0],
            y: placement.point[1],
            size: BOARD_TEXT_SIZE,
            color,
          }
    );
    setPlacement(null);
    setDraftText("");
  }

  function submitErase() {
    if (!selected || !reason.trim()) return;
    // O'chirish SABABI majburiy — backend uni jurnalga yozadi
    // (docs/PROJECT.md §3: "o'chirish SABABI majburiy").
    erase.mutate(
      { sheet, strokeIds: [selected], reason: reason.trim() },
      {
        onSuccess: () => {
          setSelected(null);
          setReason("");
          setReasonOpen(false);
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  if (board.isLoading) {
    return (
      <Screen>
        <ScreenLoading label="Doska yuklanmoqda…" />
      </Screen>
    );
  }

  if (board.isError || !state) {
    return (
      <Screen>
        <ScreenError message="Doskani ochib bo'lmadi" onRetry={() => void board.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      {embedded ? null : (
      <View style={[styles.head, { borderBottomColor: palette.border }]}>
        <IconButton accessibilityLabel="Orqaga" onPress={goBack}>
          <ArrowLeft size={22} color={palette.foreground} />
        </IconButton>
        <View style={styles.headBody}>
          <Text variant="label">Doska</Text>
          <Text variant="caption" tone={realtime.connected ? "muted" : "danger"}>
            {realtime.connected ? state.subject || "Jonli" : "Ulanish tiklanmoqda…"}
          </Text>
        </View>

        {!canDraw ? <Badge label="Faqat ko'rish" tone="neutral" /> : null}

        {selected ? (
          <IconButton accessibilityLabel="Tanlanganni o'chirish" onPress={() => setReasonOpen(true)}>
            <Trash2 size={20} color={palette.destructive} />
          </IconButton>
        ) : null}

        {state.isTeacher ? (
          <IconButton accessibilityLabel="Yangi varaq" onPress={() => addSheet.mutate()}>
            <FilePlus2 size={20} color={palette.foreground} />
          </IconButton>
        ) : null}
      </View>
      )}

      {state.sheets.length > 1 ? (
        <ChipRow>
          {state.sheets.map((item) => (
            <Chip
              key={item.index}
              label={`${item.index + 1}-varaq`}
              selected={item.index === (active?.index ?? 0)}
              onPress={() => {
                setSheet(item.index);
                setSelected(null);
              }}
            />
          ))}
        </ChipRow>
      ) : null}

      <BoardCanvas
        strokes={active?.strokes ?? []}
        width={state.width}
        height={state.height}
        tool={tool}
        color={color}
        strokeWidth={strokeWidth}
        enabled={canDraw}
        onCommit={commitStroke}
        onPlacePoint={(point) => {
          if (tool !== "text" && tool !== "math") return;
          setDraftText("");
          setPlacement({ tool, point });
        }}
        onSelectStroke={setSelected}
        selectedStrokeId={selected}
      />

      <BoardToolbar
        tool={tool}
        onToolChange={(next) => {
          setTool(next);
          if (next !== "select") setSelected(null);
        }}
        color={color}
        onColorChange={setColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        mathEnabled={state.mathEnabled}
        disabled={!canDraw}
      />

      <Sheet
        open={Boolean(placement)}
        onClose={() => setPlacement(null)}
        title={placement?.tool === "math" ? "Formula qo'shish" : "Matn qo'shish"}
        description={
          placement?.tool === "math"
            ? "LaTeX ko'rinishida yozing, masalan: \\frac{a}{b}"
            : undefined
        }
      >
        <Input
          value={draftText}
          onChangeText={setDraftText}
          placeholder={placement?.tool === "math" ? "\\frac{a}{b}" : "Matn"}
          multiline
          autoFocus
        />
        <Button title="Qo'shish" disabled={!draftText.trim()} onPress={placeText} />
      </Sheet>

      <Sheet
        open={reasonOpen}
        onClose={() => setReasonOpen(false)}
        title="O'chirish sababi"
        description="Sabab majburiy — u dars jurnaliga yoziladi."
      >
        <Input value={reason} onChangeText={setReason} placeholder="Masalan: xato yozildi" autoFocus />
        <Button
          title="O'chirish"
          variant="danger"
          disabled={!reason.trim()}
          loading={erase.isPending}
          onPress={submitErase}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headBody: { flex: 1, gap: 2, paddingHorizontal: 4 },
});
