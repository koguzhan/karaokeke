# 🎤 KaraokeKe

AI destekli, YouTube kaynaklı karaoke uygulaması.

## 🚀 Kurulum ve Çalıştırma

### 1. Hazırlık
Uygulamayı çalıştırmadan önce **Replicate API Token** almanız gerekiyor.
1. [Replicate.com](https://replicate.com) hesabınıza giriş yapın.
2. API Token'ınızı kopyalayn.
3. `backend/.env` dosyasını açın ve token'ı yapıştırın:
   ```env
   REPLICATE_API_TOKEN=r8_...
   ```

### 2. Çalıştırma
Ana dizindeki başlatma scriptini kullanabilirsiniz:

```bash
./start.sh
```

Veya manuel olarak iki terminalde başlatabilirsiniz:

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

### 3. Kullanım
Tarayıcınızda `http://localhost:3000` adresine gidin.
1. YouTube şarkı linkini yapıştırın.
2. "Karaoke Yap!" butonuna basın.
3. Arkanıza yaslanın, AI vokali ayırsın! 🎵

## 🛠 Teknolojiler
- React + Vite
- Node.js + Express
- Replicate API (Demucs Model)
- yt-dlp
