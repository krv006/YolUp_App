import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { Atom, ArrowLeft, FilePlus2, Sigma, Trash2, UserRoundCheck } from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { useCourseStudents } from "@/modules/course";
import type { FormulaSolutionDto, Point, StrokeShapeDto } from "../api/board.dto";
import { BOARD_COLORS, BOARD_TEXT_SIZE, BOARD_WIDTHS } from "../constants/board.constants";
import {
  useAddSheet,
  useAddStroke,
  useBoard,
  useEraseStrokes,
  useGrantDraw,
  useSolveFormula,
} from "../model/board.queries";
import { useBoardRealtime } from "../model/use-board-realtime";
import { AwayStudentsNotice } from "./away-students-notice";
import { BoardCanvas } from "./board-canvas";
import { MathFieldSheet } from "./math-field-sheet";
import { PeriodicTableSheet } from "./periodic-table-sheet";
import { BoardToolbar, type BoardTool } from "./board-toolbar";
import {
  Badge,
  Button,
  Chip,
  ChipRow,
  IconButton,
  Input,
  ListItem,
  radius,
  Screen,
  ScreenError,
  ScreenLoading,
  Separator,
  Sheet,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";

export interface BoardSurfaceProps {
  lessonId: string;
  /**
   * Kurs — "chizishga ruxsat" ro'yxati uchun kerak: o'quvchilar shundan
   * olinadi. Bo'lmasa tugma ko'rsatilmaydi — veb ham `courseId` ni
   * `BoardPanel` ga prop qilib beradi.
   */
  courseId?: string | null;
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
export function BoardSurface({ lessonId, courseId = null, embedded = false }: BoardSurfaceProps) {
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
  const grant = useGrantDraw(lessonId ?? "");
  const solve = useSolveFormula(lessonId ?? "");

  const [sheet, setSheet] = useState(0);
  const [tool, setTool] = useState<BoardTool>("pen");
  const [color, setColor] = useState<string>(BOARD_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState<number>(BOARD_WIDTHS[1]);
  const [selected, setSelected] = useState<string | null>(null);

  const [placement, setPlacement] = useState<{ tool: "text" | "math"; point: Point } | null>(null);
  const [periodicOpen, setPeriodicOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [formula, setFormula] = useState("");
  const [solution, setSolution] = useState<FormulaSolutionDto | null>(null);

  const state = board.data;
  const members = useCourseStudents(
    board.data?.isTeacher ? courseId : null,
    { page_size: 100 }
  );
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

  /** Formula: matn state'iga tayanmaydi — qiymat to'g'ridan-to'g'ri keladi. */
  function placeMath(latex: string) {
    if (!placement) return;
    commitStroke({
      type: "math",
      latex,
      x: placement.point[0],
      y: placement.point[1],
      size: BOARD_TEXT_SIZE,
      color,
    });
    setPlacement(null);
    setDraftText("");
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

  /**
   * Formulani serverga yechtirish (SymPy). Xatoni oynada QOLDIRAMIZ:
   * foydalanuvchi yozganini tuzatib qayta urinishi kerak, oyna yopilmaydi.
   */
  async function solveFormula() {
    if (!formula.trim()) return;
    try {
      setSolution(await solve.mutateAsync(formula.trim()));
    } catch {
      /*
       * XATO BU YERDA KO'RSATILMAYDI — uni mutatsiyaning `onError` i
       * chiqaradi. Ilgari ikkalasi ham chiqarardi va toast EKRANDA IKKI
       * MARTA ko'rinardi.
       *
       * `catch` o'zi kerak: `mutateAsync` rad javob bersa, quyidagi
       * `close()` bajarilmasligi va rad javob e'tiborsiz qolmasligi shart.
       */
    }
  }

  /** SymPy yechimini doskaga matn bloki qilib qo'yadi — 🟢 veb bilan bir xil. */
  function placeSolution() {
    if (!solution) return;
    const steps = solution.steps?.length ? `\n${solution.steps.join("\n")}` : "";
    commitStroke({
      type: "text",
      text: `${solution.pretty}\n${solution.result}${steps}`,
      x: 60,
      y: 80,
      size: BOARD_TEXT_SIZE,
      color,
    });
    setFormulaOpen(false);
    setFormula("");
    setSolution(null);
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

        {/*
          * Davriy jadval — FORMULA bilan bir xil shartda: u ham fan
          * vositasi va faqat o'qituvchida ma'noga ega.
          */}
        {state.isTeacher ? (
          <IconButton accessibilityLabel="Davriy jadval" onPress={() => setPeriodicOpen(true)}>
            <Atom size={20} color={palette.foreground} />
          </IconButton>
        ) : null}

        {state.mathEnabled ? (
          <IconButton accessibilityLabel="Formula yordamchisi" onPress={() => setFormulaOpen(true)}>
            <Sigma size={20} color={palette.foreground} />
          </IconButton>
        ) : null}

        {state.isTeacher && courseId ? (
          <IconButton accessibilityLabel="Chizishga ruxsat" onPress={() => setGrantOpen(true)}>
            <UserRoundCheck size={20} color={palette.foreground} />
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

      {/* Chiqib ketganlar — faqat o'qituvchida, doska so'rovini baham ko'radi. */}
      <AwayStudentsNotice lessonId={lessonId} enabled={Boolean(state.isTeacher)} />

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
        open={placement?.tool === "text"}
        onClose={() => setPlacement(null)}
        title="Matn qo'shish"
      >
        <Input value={draftText} onChangeText={setDraftText} placeholder="Matn" multiline autoFocus />
        <Button title="Qo'shish" disabled={!draftText.trim()} onPress={placeText} />
      </Sheet>

      {/* Formula alohida oynada: u yozilayotgan LaTeX'ni jonli chizadi. */}
      <PeriodicTableSheet
        open={periodicOpen}
        onClose={() => setPeriodicOpen(false)}
        strokes={active?.strokes ?? []}
        boardWidth={state.width}
        boardHeight={state.height}
        color={color}
        onPlace={(next) => next.forEach((stroke) => commitStroke(stroke))}
      />

      <MathFieldSheet
        open={placement?.tool === "math"}
        onClose={() => setPlacement(null)}
        onSubmit={placeMath}
      />

      {/*
       * Chizishga ruxsat — o'qituvchi o'quvchini tanlaydi, backend unga
       * `board_granted` signalini yuboradi. Ro'yxat KURS o'quvchilaridan
       * olinadi (veb `board-panel.tsx` dagi kabi), darsdagilardan emas:
       * darsga kirmagan o'quvchiga ham oldindan ruxsat berish mumkin.
       */}
      <Sheet
        open={grantOpen}
        onClose={() => setGrantOpen(false)}
        title="Chizishga ruxsat"
        description="Tanlangan o'quvchi doskada chiza oladi."
      >
        {members.isLoading ? <ScreenLoading label="O'quvchilar yuklanmoqda…" /> : null}

        {(members.data?.items ?? []).map(({ student }, index) => (
          <View key={student.id}>
            {index > 0 ? <Separator /> : null}
            <ListItem
              title={student.name}
              subtitle={`@${student.username}`}
              disabled={grant.isPending}
              onPress={() =>
                grant.mutate(student.id, {
                  onSuccess: () => toast.success(`${student.name} doskada chiza oladi`),
                  onError: (error: Error) => toast.error(error.message),
                })
              }
              trailing={<UserRoundCheck size={17} color={palette["muted-foreground"]} />}
            />
          </View>
        ))}

        {!members.isLoading && !members.data?.items?.length ? (
          <Text variant="caption" tone="muted">
            O'quvchi topilmadi.
          </Text>
        ) : null}
      </Sheet>

      {/* Formula yordamchisi — server SymPy bilan yechadi, natija doskaga qo'yiladi. */}
      <Sheet
        open={formulaOpen}
        onClose={() => setFormulaOpen(false)}
        title="Formula yordamchisi"
        description="Masalan: 2x^2 - 5x + 3 = 0"
      >
        <Input
          label="Formula"
          value={formula}
          onChangeText={(value) => {
            setFormula(value);
            setSolution(null);
          }}
          placeholder="2x^2 - 5x + 3 = 0"
          autoFocus
        />

        {solution ? (
          <View style={[styles.solution, { backgroundColor: palette.muted }]}>
            <Text variant="caption" tone="muted" style={styles.mono}>
              {solution.pretty}
            </Text>
            <Text variant="label">{solution.result}</Text>
            {solution.steps?.map((step) => (
              <Text key={step} variant="caption" tone="muted">
                {step}
              </Text>
            ))}
          </View>
        ) : null}

        <Button
          title="Yechish"
          variant="secondary"
          loading={solve.isPending}
          disabled={!formula.trim()}
          onPress={() => void solveFormula()}
        />

        {solution && canDraw ? <Button title="Doskaga qo'yish" onPress={placeSolution} /> : null}
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
  solution: { gap: 4, padding: 12, borderRadius: radius.sm },
  mono: { fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }) },
});
