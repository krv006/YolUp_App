# Chiqarish tartibi — APK va Play Market

**Kimga:** loyihani olib boradigan dasturchiga
**Sana:** 2026-10-09

---

## Ikki xil fayl, ikki xil maqsad

| | APK | AAB |
|---|---|---|
| Buyruq | `npm run apk` | `npm run aab` |
| Nima uchun | telefonga to'g'ridan-to'g'ri o'rnatish, PM ga ko'rsatish | **Play Market** |
| Natija | `android/app/build/outputs/apk/release/app-release.apk` | `android/app/build/outputs/bundle/release/app-release.aab` |

Play Market 2021-yildan beri APK qabul qilmaydi. AAB ichida barcha
arxitekturalar turadi va Google har qurilmaga moslab o'zi kesib beradi —
shuning uchun foydalanuvchi yuklaydigan fayl kichikroq chiqadi.

---

## Har chiqarishda — ketma-ketlik

### 1. Kod mainga qo'shilgan bo'lsin

```bash
git checkout main && git pull
npm run verify
```

### 2. Versiyani oshiring

```bash
npm run version:bump             # faqat versionCode +1
npm run version:bump -- 0.2.0    # versionCode +1 va version 0.2.0
```

`versionCode` har chiqarishda **oshishi shart**. Android eski raqamli
paketni yangilanish deb qabul qilmaydi, Play Market esa yuklashni rad
etadi — va buni faqat yuklash paytida, qurilish tugagandan keyin aytadi.

`version` (odamlar ko'radigan) ma'noli qaror: tuzatish uchun `0.1.1`,
yangi imkoniyat uchun `0.2.0`. Shuning uchun u avtomatik oshmaydi.

O'zgarishni commit qiling — `version.json` repoda turadi.

### 3. Yig'ing

```bash
npm run aab        # Play Market uchun
npm run apk        # yoki to'g'ridan-to'g'ri ulashish uchun
```

Skript avval `expo prebuild --clean` qiladi (ikonka, splash va imzolash
nativ loyihaga qaytadan yoziladi), keyin Gradle'ni chaqiradi.

### 4. Play Console'ga yuklang

1. `play.google.com/console` → ilova → **Release**
2. Yo'lakni tanlang (pastda)
3. `.aab` faylni yuklang
4. **Release notes** yozing — foydalanuvchi shuni o'qiydi
5. Review'ga yuboring

---

## Yo'laklar (tracks)

Birdaniga hammaga chiqarilmaydi:

| Yo'lak | Kim ko'radi | Tekshiruv |
|---|---|---|
| Internal testing | 100 gacha, email bo'yicha | deyarli darhol |
| Closed testing | tanlangan guruh | bor |
| Open testing | xohlagan odam | bor |
| Production | hamma | eng qattiq |

Birinchi marta **Internal testing** dan boshlang.

**Diqqat:** yangi dasturchi hisobi uchun Google birinchi production
chiqarishdan oldin **12 kunlik yopiq test** talab qiladi (kamida 12
tester). Buni rejaga qo'shing.

Tasdiqlangach bosqichma-bosqich chiqarish mumkin: 10% → 50% → 100%.
Xato chiqsa to'xtatib qo'yasiz.

---

## Imzolash kaliti

Kalit `credentials/` da va **git'ga kirmaydi** (`.gitignore`):

```
credentials/yolup-release.keystore
credentials/release.json      { storeFile, keyAlias, storePassword, keyPassword }
```

`plugins/with-release-signing.js` ularni har `prebuild` da nativ
loyihaga qo'llaydi. Papka bo'lmasa plugin **jim o'tadi** va Expo'ning
debug kaliti ishlatiladi — bunday fayl telefonga o'rnatiladi, lekin Play
Market uni rad etadi. Shuning uchun `npm run aab` kalit yo'qligini
oldindan ogohlantiradi.

### ⚠️ Kalitni zaxiralang

Kalit yo'qolsa, Play Market'dagi ilovani **yangilab bo'lmaydi** — Google
boshqa kalit bilan imzolangan yangilanishni qabul qilmaydi.

- `credentials/` papkasini parol menejeri yoki shifrlangan diskda
  saqlang
- Parolni alohida joyda ham saqlang
- Jamoadagi ikkinchi odamda nusxasi bo'lsin

**Play App Signing** ni yoqing: siz "upload key" bilan imzolaysiz,
Google ilovani o'z kaliti bilan qayta imzolaydi. Upload key yo'qolsa
Google'dan tiklashni so'rash mumkin — bu xavfni ancha kamaytiradi.

---

## Birinchi marta uchun — bir martalik ishlar

Bular faqat birinchi chiqarishdan oldin:

- [ ] Google Play Console hisobi ($25, bir martalik)
- [ ] Hisobda **ikki bosqichli tasdiqlash** yoqilgan bo'lsin (majburiy)
- [ ] Maxfiylik siyosati — internetda ochiq, doimiy URL
- [ ] Do'kon sahifasi: ikonka 512×512, feature grafika 1024×500,
      kamida 2 ta skrinshot, qisqa (80) va to'liq (4000) tavsif
- [ ] **Data safety** so'rovnomasi — ilova ism, telefon, rasm yig'adi,
      kamera va mikrofondan foydalanadi
- [ ] **Content rating** so'rovnomasi
- [ ] **Target audience** — ilova o'quvchilar uchun. "Bolalar uchun" deb
      belgilansa, Families policy qoidalari qo'llanadi va talablar
      qattiqlashadi
- [ ] **Foreground service** izohi — ilovada ekran ulashish va fonda
      ovoz bor (`FOREGROUND_SERVICE_MEDIA_PROJECTION`,
      `..._MEDIA_PLAYBACK`). Google ularning nima uchun kerakligini
      video bilan tushuntirishni so'raydi. Bu ko'pincha birinchi
      tekshiruvni cho'zadi.

---

## Chiqarishdan oldin tekshiring

- [ ] `npm run verify` toza
- [ ] `versionCode` oshirilgan va commit qilingan
- [ ] **`google-services.json` joyida** — usiz push bildirishnomalari
      ishlamaydi (`docs/PUSH-FIREBASE.md`). Keyin qo'shish yangi versiya
      chiqarishni talab qiladi.
- [ ] Ilova qurilmada sinalgan
