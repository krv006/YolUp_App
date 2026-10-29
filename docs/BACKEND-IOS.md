# iOS uchun backend so'rovi — dars yozuvi formati

**Kimga:** backend dasturchisiga
**Sana:** 2026-10-15
**Muhimligi:** yuqori — iOS ilovasida dars yozuvi UMUMAN ochilmaydi

---

## Qisqasi

Dars yozuvi `video/webm` formatida berilyapti. **iOS bu formatni
qo'llab-quvvatlamaydi** — Apple'ning AVFoundation kutubxonasida WebM
dekoderi yo'q va bo'lmagan ham. Android'da ishlaydi, chunki u boshqa
pleyerdan foydalanadi.

Ilova tomonidan tuzatib bo'lmaydi: bu kutubxona tanlovi emas, iOS'ning
o'zida dekoder yo'q.

---

## Nima kuzatildi

Dars yozuvi ochilganda iPhone'da ekran bo'sh qoladi, jurnalda:

```
Failed to load available audio tracks for
https://edu.thesofmebel.uz/api/v1/lessons/<id>/recording/stream/?t=<token>

Error Domain=AVFoundationErrorDomain Code=-11828 "Cannot Open"
NSLocalizedFailureReason=This media format is not supported.
```

Javob sarlavhalari:

```
HTTP/2 200
content-type: video/webm        <-- muammo shu yerda
accept-ranges: bytes
content-disposition: inline
```

Kuzatilgan muhit: iPhone 17 simulyatori, iOS 27.0.

---

## Nima kerak

Yozuv **iOS ham, Android ham ocha oladigan** formatda berilsin. Ikki
yo'l bor, ikkalasi ham to'g'ri:

### A) MP4 — soddaroq

| | |
|---|---|
| Konteyner | MP4 |
| Video kodek | **H.264** (AVC) |
| Audio kodek | **AAC** |
| `content-type` | `video/mp4` |

Qo'shimcha shart: `moov` atomi faylning **boshida** turishi kerak
(`faststart`). Aks holda pleyer butun faylni yuklab olmaguncha ijro
boshlanmaydi.

`ffmpeg` bilan:

```bash
ffmpeg -i kirish.webm \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  chiqish.mp4
```

### B) HLS — yaxshiroq, lekin ko'proq ish

`.m3u8` pleylist va `.ts` bo'laklar. Afzalligi: internet sekinlashsa
sifat avtomatik pasayadi va ilova butun faylni kutmaydi. iOS HLS'ni
nativ qo'llab-quvvatlaydi, Android ham ochadi.

Yozuvlar uzun bo'lsa (45 daqiqalik dars) bu variant sezilarli
yaxshiroq.

---

## Qo'shimcha talablar

**1. `Range` so'rovlari ishlasin.** Hozir `accept-ranges: bytes` bor —
buni saqlang. Usiz videoni oldinga surib bo'lmaydi.

**2. `content-type` to'g'ri bo'lsin.** `video/mp4` yoki
`application/vnd.apple.mpegurl` (HLS uchun). Noto'g'ri sarlavha bilan
iOS faylni ochmaydi, mazmuni to'g'ri bo'lsa ham.

**3. Eski yozuvlar.** Allaqachon saqlangan WebM fayllar ham
o'girilishi kerak, aks holda ular iPhone'da ochilmay qolaveradi.

---

## Qanday tekshirish

O'zgartirilgandan keyin:

```bash
curl -sI "<yozuv havolasi>" | grep -i "content-type\|accept-ranges"
```

Kutilgan natija:

```
content-type: video/mp4
accept-ranges: bytes
```

Shundan keyin ayting — iPhone'da sinab ko'ramiz.

---

## Ovozli xabarlar (2026-10-29)

Xuddi shu muammo chatdagi **ovozli xabarlarda** ham bor. Vebda (Chrome)
yozilgan ovozli xabar `.webm` (Opus) bo'lib saqlanadi va iPhone'da
ochilmaydi:

```
AVFoundation: "Cannot Open" (This media format is not supported)
fayl: voice-1793135274333.webm
```

Ilova hozir "Ovozli xabar yuklanmadi" deb ko'rsatadi, lekin xabarni
eshitib bo'lmaydi. Mobil ilova yozgan ovozli xabarlar `.m4a` (AAC) —
ular hamma joyda ishlaydi.

**Kerak:** yuklangan ovozli xabar AAC'ga o'girilsin (`.m4a`,
`content-type: audio/mp4`), eski WebM xabarlar ham. `ffmpeg` bilan:

```bash
ffmpeg -i kirish.webm -c:a aac -b:a 64k -movflags +faststart chiqish.m4a
```

Muqobil: vebning o'zi yozishda `audio/mp4` ni tanlasin (Safari shunday
yozadi), lekin Chrome'da bu hamma versiyada ishlamaydi — backend'da
o'girish ishonchliroq.

---

## Boshqa so'rovlar

Bu fayl FAQAT iOS'ga tegishli. Umumiy backend so'rovlari
`docs/BACKEND-SOROVLAR.md` da, push bildirishnomalari esa
`docs/PUSH-BACKEND.md` da.
