import { useMemo } from "react";
import QRCode from "qrcode";
import Svg, { Path, Rect } from "react-native-svg";

export interface QrCodeProps {
  value: string;
  size: number;
  /** Veb: `color: { dark: "#24264d", light: "#ffffff" }`, `margin: 0`. */
  dark?: string;
  light?: string;
}

/**
 * QR kod — veb ham shu `qrcode` kutubxonasidan foydalanadi (`toDataURL`).
 * Mobilda rasm o'rniga matritsa bitta SVG `Path` qilib chiziladi.
 */
export function QrCode({ value, size, dark = "#24264d", light = "#ffffff" }: QrCodeProps) {
  const { count, path } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
    const modules = qr.modules;
    let d = "";
    for (let row = 0; row < modules.size; row += 1) {
      for (let col = 0; col < modules.size; col += 1) {
        if (modules.get(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { count: modules.size, path: d };
  }, [value]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${count} ${count}`}>
      <Rect width={count} height={count} fill={light} />
      <Path d={path} fill={dark} />
    </Svg>
  );
}
