#!/bin/bash
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "Gerekli paketler kuruluyor, bu islem sadece ilk seferde birkac dakika surer..."
  npm install
fi

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

echo ""
echo "============================================"
echo " Sunucu baslatiliyor..."
echo " Tarayicinda su adresi ac: http://localhost:3000"
echo " Kapatmak icin bu pencereyi kapatabilirsin (Ctrl+C)."
echo "============================================"
echo ""

( sleep 2 && open "http://localhost:3000" ) &
npm start
