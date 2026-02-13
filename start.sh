#!/bin/bash

# Renkler
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎤 Karaoke Uygulaması Başlatılıyor...${NC}"

# Backend'i arka planda başlat
echo -e "${GREEN}📦 Backend başlatılıyor (Port 3001)...${NC}"
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Frontend'i başlat
echo -e "${GREEN}🎨 Frontend başlatılıyor (Port 3000)...${NC}"
npm run dev

# Frontend kapanınca backend'i de kapat
kill $BACKEND_PID
