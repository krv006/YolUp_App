# Mobil push bildirishnomalari — backenddan nima kerak

**Kimga:** backend dasturchisiga
**Holat:** mobil tomon kutmoqda — bu ishlar bajarilmaguncha boshlab bo'lmaydi
**Sana:** 2026-09-30

---

## Qisqasi

Mobil ilovada push bildirishnomalarini yoqib bo'lmayapti. To'siq Firebase
sozlamasi yoki mobil kod emas — **backendda mobil qurilmani ro'yxatga
oladigan endpoint yo'q**.

Hozirgi uchta push endpointi **Web Push** standarti uchun yozilgan va faqat
brauzer beradigan qiymatni qabul qiladi. Mobil ilova bunday qiymat yasay
olmaydi: u FCM qurilma tokenini beradi, bu oddiy satr.

Kerak bo'lgan narsa ikkita: **(1)** qurilma tokenini qabul qiladigan
endpoint, **(2)** FCM orqali yuborish tomoni. Tafsilotlari quyida.

---

## 1. Muammo nimada

Backendda hozir shu uchta endpoint bor
(`notifications/api/v1/.../endpoints`, mobilda nusxasi
`src/modules/notification/api/notification.endpoints.ts:9-11`):

```
GET   /api/v1/notifications/push/vapid-key/
POST  /api/v1/notifications/push/subscribe/
POST  /api/v1/notifications/push/unsubscribe/
```

`subscribe` kutadigan tana — brauzerning `PushManager.subscribe()` qaytargan
obyekti (veb `push.api.ts:4-7`):

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/dGhpcy1pcy1h...",
  "keys": {
    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM=",
    "auth": "tBHItJI5svbpez7KI4CCXg=="
  }
}
```

Bu uchta qiymat — `endpoint`, `p256dh`, `auth` — brauzerning Service Worker'i
va Push API'si tomonidan yaratiladi. **Ular faqat brauzerda mavjud.**

Mobil ilovada Service Worker ham, Push API ham yo'q. U Firebase Cloud
Messaging'dan bitta satr oladi:

```
fGxR2k1QTp2...:APA91bHZ...   (≈160 belgi, davriy ravishda yangilanadi)
```

Bu satrni `subscribe` ga yuborib bo'lmaydi — u `keys` obyektini talab qiladi,
mobilda esa unaqa kalitlar umuman yo'q. `auth` va `notification`
endpointlarining birortasida ham qurilma tokenini qabul qiladigan joy yo'q
(tekshirildi: `auth.endpoints.ts` da 24 ta endpoint, hech biri mos kelmaydi).

**Muhim:** mavjud Web Push yo'lini o'zgartirish yoki olib tashlash KERAK
EMAS. Veb ilova hozir shu bilan ishlayapti. Mobil uchun yonma-yon ikkinchi
yo'l qo'shiladi.

---

## 2. Kerak bo'lgan endpointlar

### 2.1. Qurilmani ro'yxatga olish

```
POST /api/v1/notifications/push/device/
Authorization: Bearer <access_token>
```

So'rov tanasi:

```json
{
  "token": "fGxR2k1QTp2...:APA91bHZ...",
  "platform": "android",
  "device_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "app_version": "0.1.0"
}
```

| Maydon | Turi | Majburiy | Izoh |
|---|---|---|---|
| `token` | string | ha | FCM registration token |
| `platform` | `"android"` \| `"ios"` | ha | |
| `device_id` | string (UUID) | ha | qurilmaning barqaror ID'si — pastda izohi |
| `app_version` | string | yo'q | diagnostika uchun |

Javob: `200 OK` yoki `201 Created`, tanasi muhim emas.

**`device_id` nega kerak.** FCM tokeni o'zgaruvchan: ilova qayta
o'rnatilganda, ma'lumotlar tozalanganda yoki Firebase o'zi yangilaganda
almashadi. Agar faqat `token` bo'yicha saqlansa, bitta telefon uchun bazada
o'nlab eski yozuv to'planadi va ularning hammasiga yuborishga urinib,
har safar xato olinadi.

Shuning uchun **unikal kalit `(user, device_id)` bo'lsin**, `token` esa
yangilanadigan maydon:

```python
class PushDevice(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="push_devices")
    device_id = models.CharField(max_length=128)
    token = models.CharField(max_length=512)
    platform = models.CharField(max_length=16)
    app_version = models.CharField(max_length=32, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("user", "device_id")]
```

Endpoint `update_or_create` qilsin — mobil ilova **har ochilganda** token
yuboradi (bu FCM tavsiyasi), ya'ni takroriy so'rov normal holat, xato emas.

**Bitta qurilmada bir nechta hisob.** Ilovada hisoblar orasida almashish bor
(`/api/v1/auth/switch/{id}/`). Shuning uchun `device_id` bir xil bo'lib,
`user` boshqa bo'lishi mumkin — `unique_together` aynan shuni ko'zda tutadi.
Chiqib ketilganda mobil o'zi o'chirishni so'raydi (2.2).

### 2.2. Qurilmani o'chirish

```
DELETE /api/v1/notifications/push/device/
Authorization: Bearer <access_token>
```

Tanasi:

```json
{ "device_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
```

Chiqishda (`logout`) chaqiriladi — aks holda telefondan chiqib ketgan
foydalanuvchiga bildirishnoma kelib turaveradi.

`logout` ning o'zida ham shu yozuvni o'chirib yuborish qo'shimcha himoya
bo'ladi, lekin alohida endpoint baribir kerak: token muddati tugaganda yoki
foydalanuvchi bildirishnomani o'chirganda ham chaqiriladi.

### 2.3. Ixtiyoriy — sinov uchun

```
POST /api/v1/notifications/push/test/
```

O'zimizga bitta bildirishnoma yuboradi. Sozlashni tekshirishni juda
osonlashtiradi: mobil tomon bitta tugma bosib, butun zanjirni (token →
baza → FCM → telefon) sinab ko'radi. Ishlab chiqarishda o'chirib qo'ysa
bo'ladi.

---

## 3. FCM tomoni

### 3.1. Firebase loyihasi

Bitta Firebase loyihasi ochilsin (`console.firebase.google.com`), unga ikki
ilova qo'shilsin:

| Platforma | Paket / Bundle ID | Kerakli fayl |
|---|---|---|
| Android | `uz.yolup.edu` | `google-services.json` |
| iOS | `uz.yolup.edu` | `GoogleService-Info.plist` |

**Ikkalasini ham menga (mobil tomonga) bering** — ular ilova ichiga
joylashtiriladi.

iOS uchun qo'shimcha: Apple Developer hisobidan **APNs Auth Key** (`.p8`
fayl, Key ID va Team ID bilan) olinib, Firebase konsoliga yuklanishi kerak.
Usiz iOS'da push umuman ishlamaydi. Bu iOS chiqishidan oldin kerak bo'ladi,
hozir shoshilinch emas.

### 3.2. Backendda yuborish

**Legacy server key ISHLAMAYDI** — Google uni 2024-yil iyunda o'chirgan.
FCM HTTP v1 API ishlatiladi, u **service account JSON** bilan
autentifikatsiya qiladi:

Firebase Console → Project Settings → Service accounts → Generate new
private key. Chiqqan JSON faylni serverga qo'ying va yo'lini muhit
o'zgaruvchisi orqali bering:

```
GOOGLE_APPLICATION_CREDENTIALS=/etc/yolup/firebase-service-account.json
FCM_PROJECT_ID=yolup-xxxxx
```

Python kutubxonasi:

```
pip install firebase-admin
```

### 3.3. Qayerdan chaqiriladi

Hozir bildirishnoma yaratilganda ikki ish bo'ladi:

1. `NotificationRecipient` yozuvlari yaratiladi
2. `/ws/notifications/` kanaliga yuboriladi (mobil `RealtimeSocket` shuni
   tinglaydi)

**Uchinchi qadam qo'shiladi:** o'sha joyda qabul qiluvchilarning
`PushDevice` yozuvlari olinib, FCM'ga yuboriladi. Web Push yuborish qayerda
bo'lsa, o'sha yerning yoniga.

### 3.4. Push tanasi

Mobil ilova bosilganda to'g'ri ekranga o'tishi uchun `data` bloki muhim.
`NotificationDto` da allaqachon `link_type` va `link_id` bor
(`notification.dto.ts:11-12`) — aynan shular yuborilsin:

```python
from firebase_admin import messaging

message = messaging.Message(
    token=device.token,
    notification=messaging.Notification(
        title=sender_name or "YolUp",
        body=plain_text_description,   # HTML EMAS — pastda izohi
    ),
    data={
        "notification_id": str(notification.id),
        "link_type": notification.link_type or "",
        "link_id": str(notification.link_id or ""),
        "kind": notification.kind or "",
    },
    android=messaging.AndroidConfig(priority="high"),
    apns=messaging.APNSConfig(
        payload=messaging.APNSPayload(
            aps=messaging.Aps(sound="default", badge=unread_count),
        )
    ),
)
messaging.send(message)
```

**`body` da HTML bo'lmasin.** `description` maydonida HTML keladi (mobilda
`htmlToPlainText` bilan tozalanadi — `use-notification-feed.ts:4`). Push
bannerida teglar tozalanmaydi va foydalanuvchi `<p>Salom</p>` deb ko'radi.
Backend tomonda tozalab yuboring.

**`data` qiymatlari faqat satr bo'lishi shart** — FCM raqam yoki `null`
qabul qilmaydi. Yuqoridagi kodda `or ""` shuning uchun.

### 3.5. Yaroqsiz tokenlarni tozalash

FCM `UNREGISTERED` yoki `INVALID_ARGUMENT` qaytarsa — ilova o'chirilgan yoki
token eskirgan. Bunday yozuv **darhol o'chirilsin**, aks holda baza
o'lik tokenlar bilan to'lib boradi va har yuborishda bekorga urinib
chiqiladi:

```python
from firebase_admin import messaging

try:
    messaging.send(message)
except messaging.UnregisteredError:
    device.delete()
except messaging.SenderIdMismatchError:
    device.delete()
```

Ko'p qurilmaga birdan yuborish uchun `messaging.send_each_for_multicast()`
ishlating va javobdagi xatolarga qarab tozalang — bitta-bitta yuborishdan
ancha tez.

---

## 4. Hozir nima ishlayapti

Buni bilib turish foydali — hammasi noldan emas:

- **Ilova ochiq bo'lganda** bildirishnoma keladi va ichki toast chiqadi.
  Kanal: `/ws/notifications/` (`notification-socket-manager.ts:53`).
  Bu **ishlayapti**, o'zgartirish kerak emas.
- O'qilmagan soni, ro'yxat, o'qilgan deb belgilash, yuborish — hammasi
  ishlayapti.

**Ishlamaydigan yagona holat:** ilova yopiq yoki fonda bo'lganda telefonning
o'zida banner chiqishi. Aynan shuning uchun push kerak.

---

## 5. Ro'yxat

Backend tomonda:

- [ ] `PushDevice` modeli, `unique_together = (user, device_id)`
- [ ] `POST /api/v1/notifications/push/device/` — `update_or_create`
- [ ] `DELETE /api/v1/notifications/push/device/`
- [ ] `logout` da shu qurilma yozuvini o'chirish
- [ ] `firebase-admin` o'rnatish, service account JSON serverga
- [ ] Bildirishnoma yaratilgan joyga FCM yuborishni qo'shish
- [ ] `description` dan HTML teglarini tozalash
- [ ] `UNREGISTERED` / `SenderIdMismatch` da yozuvni o'chirish
- [ ] (ixtiyoriy) `POST /api/v1/notifications/push/test/`

Menga beriladigan fayllar:

- [ ] `google-services.json` (Android, paket `uz.yolup.edu`)
- [ ] `GoogleService-Info.plist` (iOS — keyinroq ham bo'ladi)

Mobil tomonda (backend tayyor bo'lgach, men qilaman):

- [ ] `expo-notifications` va `@react-native-firebase/messaging` qo'shish
- [ ] Ruxsat so'rash, token olish, `push/device/` ga yuborish
- [ ] Token yangilanishini kuzatish (`onTokenRefresh`)
- [ ] Bosilganda `link_type`/`link_id` bo'yicha ekranga o'tish
- [ ] Chiqishda qurilmani o'chirish

---

## 6. Savollar bo'lsa

Ikki narsani kelishib olish kerak:

1. **Endpoint yo'li.** Yuqoridagi `/api/v1/notifications/push/device/` —
   taklif. Boshqacha bo'lsa ayting, mobil tomon moslashadi.
2. **Bildirishnoma turlari.** Hozir hamma bildirishnoma push bo'ladimi,
   yoki ba'zilari (masalan chat xabari) alohida ko'rib chiqiladimi? Chat
   xabarlari ko'p bo'lsa, foydalanuvchi bannerdan charchaydi — buni
   keyinroq `kind` bo'yicha filtrlash bilan hal qilsa bo'ladi.
