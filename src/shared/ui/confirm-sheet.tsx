import { StyleSheet, View } from "react-native";
import { Button } from "./button";
import { Sheet } from "./sheet";

export interface ConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Nima yo'qolishini aniq ayting — "qayta tiklanmaydi" kabi. */
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}

/**
 * Tasdiqlash oynasi — veb'dagi "o'chirishni tasdiqlang" dialoglarining
 * mobil o'rni.
 *
 * Veb'da bu naqsh har bir panelda qaytadan yozilgan (dars, vazifa, test,
 * video yozuv). Mobilda bitta joyda: tugmalar tartibi va matni hamma
 * yerda bir xil bo'lsin — o'chirish tugmasi tasodifan bosiladigan
 * amal emas.
 */
export function ConfirmSheet({
  open,
  onClose,
  title,
  description,
  confirmLabel = "O'chirish",
  loading = false,
  onConfirm,
}: ConfirmSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title} description={description}>
      <View style={styles.actions}>
        <Button title="Bekor" variant="secondary" onPress={onClose} />
        <Button title={confirmLabel} variant="danger" loading={loading} onPress={onConfirm} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 8 },
});
