# Karaoke App - Deployment Rehberi

## Backend (Render)

### 1. GitHub'a Yükle
```bash
cd /Users/x/Desktop/karaokeke
git init
git add .
git commit -m "Initial commit - Karaoke backend"
```

GitHub'da yeni bir repo oluştur (örn: `karaokeke`), sonra:
```bash
git remote add origin https://github.com/KULLANICI_ADIN/karaokeke.git
git branch -M main
git push -u origin main
```

### 2. Render'da Web Service Oluştur

1. [render.com](https://render.com) → Sign Up (GitHub ile giriş yap)
2. **New +** → **Web Service**
3. GitHub repo'nu seç: `karaokeke`
4. Ayarlar:
   - **Name:** `karaokeke-backend`
   - **Region:** Frankfurt (veya yakın)
   - **Branch:** `main`
   - **Root Directory:** (boş bırak, Dockerfile root'ta)
   - **Runtime:** Docker
   - **Instance Type:** Free
5. **Environment Variables** ekle:
   ```
   REPLICATE_API_TOKEN=your_replicate_api_token_here
   PORT=3001
   NODE_ENV=production
   ```
6. **Create Web Service**

### 3. Backend URL'i Al
Deploy tamamlanınca (5-10 dk), Render sana bir URL verecek:
```
https://karaokeke-backend.onrender.com
```

---

## Frontend (Vercel)

### 1. Frontend'i Vercel'e Deploy Et
```bash
cd /Users/x/Desktop/karaokeke
npx vercel --prod
```

### 2. Environment Variable Ekle
Vercel Dashboard → Project → Settings → Environment Variables:
```
VITE_API_URL=https://karaokeke-backend.onrender.com
```

### 3. Redeploy
```bash
npx vercel --prod
```

---

## Notlar
- **Render Free Tier:** 15 dakika inaktivite sonrası uyur (ilk istek 30sn sürer).
- **Replicate API:** Aylık $5-10 kredi gerekebilir (vokal ayrıştırma için).
- **yt-dlp:** Render'da otomatik kurulur (Dockerfile sayesinde).

Tamamdır! 🚀
