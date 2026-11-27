# Backend uchun: email bilan kirish ishlamayapti

**Sana:** 2026-11-27
**Kimdan:** mobil ilova (YolUp, Android/iOS)
**Holat:** hal qilindi (2026-11-27). Backend javobi: email bilan kirish productionda ishlaydi, faqat **tasdiqlangan** email bilan. Maydon `username` bo'lib qoladi, `mapLoginRequest` o'zgarmaydi. Tasdiqlanmagan email va to'g'ri parol uchun `400` qaytadi, xabari: «Email hali tasdiqlanmagan…». Bu matn kirish oynasida maydon ostida ko'rsatiladi (`login-page.tsx`, `400` va `fields` yo'q holat). `401` xabari endi o'zbekcha.

## Muammo

Kirish oynasida maydon nomi **«Login yoki email»** (veb `591938b`, mobil ham
xuddi shunday). Lekin foydalanuvchi **tasdiqlangan** email va to'g'ri parol
bilan kira olmayapti. Login (username) bilan esa shu hisobga kiradi.

## Frontend nima yuboradi

Veb va mobil bir xil so'rov yuboradi: kiritilgan qiymat `username` maydonida
ketadi, boshi va oxiridagi bo'shliqlar olib tashlanadi, katta-kichik harf
o'zgartirilmaydi.

```http
POST /api/v1/auth/login/
Content-Type: application/json

{ "username": "ali@mail.uz", "password": "••••••••" }
```

## Backend nima qaytaryapti

```json
HTTP 401
{
  "success": false,
  "error": {
    "code": "authentication_failed",
    "message": "No active account found with the given credentials",
    "details": { "detail": "No active account found with the given credentials" }
  }
}
```

Bu javob noto'g'ri parol berilganda ham, umuman mavjud bo'lmagan login yoki
email berilganda ham aynan bir xil keladi. Shuning uchun frontend tomonda
sababni ajratib bo'lmaydi.

## Kutilgan xatti-harakat

`username` maydonidagi qiymatda `@` bo'lsa (yoki login topilmasa), backend
foydalanuvchini **email bo'yicha** ham qidirsin:

1. **Tasdiqlangan** email (`email_verified = true`) va to'g'ri parol bilan
   kirish muvaffaqiyatli bo'lsin. Javob login bilan kirgandagi bilan bir xil
   bo'lsin: tokenlar yoki 2FA `challenge_token`.
2. Email **katta-kichik harfga sezgir bo'lmasin**: `Ali@Mail.uz` ham
   `ali@mail.uz` ham bitta hisob.
3. Bitta email bir nechta hisobga bog'langan bo'lsa, `400` va tushunarli
   xabar qaytsin. Bu holat frontendda tayyor: backend matni maydon ostida
   ko'rsatiladi (veb #199/#201, «Bu email bir nechta akkauntga bog'langan…»).
4. Ko'p marta xato urinishdagi cheklov (`429`) login bilan kirgandagi kabi
   ishlasin.

## Javob kerak bo'lgan savollar

1. Email bilan kirish productionda (`backend.yolup.uz`) yoqilganmi? Yoqilgan
   bo'lsa, qaysi maydonni kutadi: `username`, `email` yoki `login`? Agar
   boshqa maydon bo'lsa, ayting. Frontendda tez o'zgartiramiz.
2. Tasdiqlanmagan email bilan kirishga ruxsat bormi? Ruxsat bo'lmasa, shu
   holat uchun alohida xabar qaytarish mumkinmi? Masalan, «Email
   tasdiqlanmagan — login bilan kiring». Hozir u ham «No active account…»
   bo'lib keladi.
3. Javobdagi `message` o'zbekchami? Hozir inglizcha keladi va ekranda
   «Login yoki parol noto'g'ri» deb umumiy matn chiqadi.

## Tekshirish uchun (backend tomonda)

- Tasdiqlangan emaili bor istalgan test hisobi bilan yuqoridagi so'rovni
  `username` o'rniga email bilan yuboring: `200` kutiladi.
- Xuddi shu so'rovni emailni KATTA harflar bilan yuboring: `200` kutiladi.
- Bir nechta hisobga bog'langan email bilan yuboring: `400` va xabar
  kutiladi.

## Frontend tomonda qilingan

- Kirish maydonida `@` darhol ko'rinadigan email klaviaturasi (mobil).
- So'rov tanasini backend javobiga qarab o'zgartirishga tayyormiz: agar
  alohida maydon (`email`/`login`) kerak bo'lsa, bitta mapper o'zgaradi
  (`auth.mappers.ts` → `mapLoginRequest`).
