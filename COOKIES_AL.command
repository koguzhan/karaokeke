#!/bin/bash
cd "$(dirname "$0")" || exit
echo "📂 Proje klasöründesiniz."
echo "🍪 Cookies alma işlemi başlıyor..."
echo "⚠️  LÜTFEN TARAYICINIZI (CHROME/FIREFOX) TAMAMEN KAPATIN!"
echo "⚠️  Yoksa 'Database Locked' hatası alırsınız."
echo "Bekleniyor (3 saniye)..."
sleep 3
node get_cookies.js
echo " "
read -p "Çıkmak için Enter'a basın..."
