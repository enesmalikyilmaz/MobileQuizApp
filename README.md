# 🎮 Mobile Quiz App

Gerçek zamanlı, çok oyunculu bir **mobil quiz uygulaması**dır.  
Kullanıcılar quiz seçer, lobby’de odaya katılır ve **Socket.IO** ile canlı olarak yarışır.  
Admin kullanıcılar, quiz ve soru bankasını yönetebilir.

---

## 🚀 Özellikler

### 👤 Kullanıcı
- Kayıt ol / Giriş yap (JWT tabanlı)
- Profil görüntüleme ve güncelleme
- Oyun geçmişi
- Liderlik Tablosu

### 🎯 Oyun Mekaniği
- Oda oluşturma ve odaya katılma
- Host mantığı (oyunu sadece host başlatır)
- Gerçek zamanlı soru gönderimi
- Süreli sorular
- Yanlış cevap veya süre dolunca elenme
- Otomatik skor hesaplama
- Oyun sonunda sonuç ekranı

### 🧠 Quiz Sistemi
- Quizler kategori bazlıdır (Genel, Bilim, Tarih, Spor vb.)
- Sorular quiz başında **rastgele karıştırılır**
- Her sorunun:
  - Çoktan seçmeli şıkları
  - Doğru cevabı
  - Puan değeri vardır

### 🛠️ Admin Paneli
- Quiz oluşturma
- Quiz düzenleme
- Quiz silme
- Kategori bazlı filtreleme
- Soru ekleme / silme / güncelleme

> Admin paneline yalnızca `isAdmin: true` olan kullanıcılar erişebilir.

---

## 🧩 Kullanılan Teknolojiler

### 📱 Mobil (Frontend)
- **React Native**
- **Expo Router**

### 🌐 Backend
- **Node.js**
- **Express**
- **MongoDB**
- **Socket.IO**
- **JWT**

---

## 🗂️ Proje Yapısı

```text
mobile/
 ├─ app/
 │   ├─ (tabs)/
 │   │   ├─ index.tsx        # Home
 │   │   ├─ profile.tsx     # Profile
 │   │   ├─ history.tsx
 │   │   ├─ leaderboard.tsx
 │   ├─ lobby.tsx
 │   ├─ game.tsx
 │   ├─ result.tsx
 │   ├─ admin-quizzes.tsx
 │   ├─ admin-quiz-create.tsx
 │   ├─ admin-quiz-edit.tsx
 ├─ src/
 │   ├─ services/
 │   │   ├─ api.ts
 │   │   ├─ socket.ts
 │   ├─ config.ts
server/
 ├─ routes/
 │   ├─ auth.js
 │   ├─ quizzes.js
 │   ├─ leaderboard.js
 │   ├─ me.js
 ├─ models/
 │   ├─ User.js
 │   ├─ Quiz.js
 │   ├─ GameResult.js
 ├─ middleware/
 │   ├─ auth.js
 │   ├─ admin.js
 ├─ index.js
```

⚙️ Kurulum
1️⃣ Backend
```
cd server
npm install
npm run dev
```

.env dosyası:
```
MONGO_URI=...
JWT_SECRET=supersecretkey
```
2️⃣ Mobile
```
cd mobile
npm install
npx expo start
```
🔐 Admin Yapma

MongoDB üzerinde bir kullanıcıyı admin yapmak için:
```
db.users.updateOne(
  { email: "admin@mail.com" },
  { $set: { isAdmin: true } }
)
```

👨‍💻 Geliştirici

Enes Malik Yılmaz
              
Mobile Quiz App 

🎉 Keyifli oyunlar!






