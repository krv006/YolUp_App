#!/usr/bin/env node
/**
 * Emulyatorda dev-serverni ISHLAYDIGAN holatga keltiradi.
 *
 * Muammo: emulyatorning virtual tarmog'i (`10.0.2.2`, qemu SLIRP) orqali
 * JS bundle yetib bormaydi — chunked ramka buziladi va RN
 * `ProtocolException` bilan uziladi (DECISIONS §18). Bundle'ni ikki
 * barobar kichraytirish ham yordam bermadi.
 *
 * Yechim: trafik `adb reverse` orqali adb kanaliga o'tkaziladi. Buning
 * uchun UCHALA shart birga bajarilishi kerak:
 *
 *   1) `adb reverse tcp:8081 tcp:8081`
 *   2) ilovaning dev-server manzili `localhost:8081` bo'lishi
 *      (RN uni `debug_http_host` sozlamasidan o'qiydi)
 *   3) Metro IPv4 da tinglashi — ya'ni `--localhost` BERILMASLIGI KERAK.
 *      `--localhost` bu mashinada faqat `[::1]` (IPv6) ga bog'lanadi,
 *      `adb reverse` esa IPv4 `127.0.0.1` ga yo'naltiradi va ulanish uziladi.
 *
 * Ishlatilishi:  node scripts/dev-android.mjs   (yoki `npm run dev:android`)
 * Keyin alohida terminalda:  npm start
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PACKAGE = process.env.APP_ID ?? "uz.yolup.edu.dev";
const PORT = process.env.RCT_METRO_PORT ?? "8081";
const PREFS = `/data/data/${PACKAGE}/shared_prefs/${PACKAGE}_preferences.xml`;

const adb = (...args) =>
  execFileSync("adb", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function main() {
  const devices = adb("devices")
    .split("\n")
    .slice(1)
    .filter((line) => line.trim().endsWith("device"));

  if (devices.length === 0) {
    console.error("✖ Ulangan qurilma yo'q. Emulyatorni ishga tushiring.");
    process.exit(1);
  }

  adb("reverse", `tcp:${PORT}`, `tcp:${PORT}`);
  console.log(`✔ adb reverse tcp:${PORT} -> tcp:${PORT}`);

  // RN dev-server manzilini `localhost` ga qo'yamiz. Ilova o'chiq bo'lishi
  // kerak — aks holda u eski qiymatni xotirasida saqlab qoladi.
  adb("shell", "am", "force-stop", PACKAGE);

  const xml = `<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <string name="debug_http_host">localhost:${PORT}</string>
</map>
`;
  const local = join(tmpdir(), "fokus-debug-prefs.xml");
  writeFileSync(local, xml);
  adb("push", local, "/data/local/tmp/fokus-prefs.xml");
  unlinkSync(local);

  try {
    adb("shell", `run-as ${PACKAGE} cp /data/local/tmp/fokus-prefs.xml ${PREFS}`);
    console.log(`✔ dev-server manzili: localhost:${PORT}`);
  } catch {
    console.error(
      `✖ Sozlamani yozib bo'lmadi. ${PACKAGE} debug qurilishida o'rnatilganiga ishonch hosil qiling.`
    );
    process.exit(1);
  }

  adb("shell", "monkey", "-p", PACKAGE, "-c", "android.intent.category.LAUNCHER", "1");
  console.log("✔ ilova ishga tushirildi\n");
  console.log("Metro ishlamayotgan bo'lsa alohida terminalda: npm start");
  console.log("MUHIM: Metro'ga --localhost BERMANG (u IPv6 ga bog'lanadi).");
}

main();
