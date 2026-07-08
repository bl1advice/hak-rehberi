# Hak Rehberi

Yapay zeka destekli hukuk rehberi için profesyonel bir başlangıç projesi.

## İçerik
- `index.html` : Giriş ekranı
- `assistant.html` : AI asistan arayüzü
- `app.js` : Giriş, parola toggle ve sohbet API entegrasyonu
- `server.js` : Node.js'in yerleşik `http` modülüyle yazılmış statik dosya sunucusu ve chat/analiz/belge API'leri
- `package.json` : Proje bağımlılıkları ve çalıştırma betikleri
- `.env.example` : OpenAI anahtarı yapılandırması
- `.gitignore` : Yaygın hariç tutmalar

## Gereksinimler
- Node.js 18 veya üstü

## Kurulum
1. Proje dizinine gidin:
   ```bash
   cd c:/Users/MEF/Desktop/Hukuk
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. `.env` dosyası oluşturun ve OpenAI anahtarınızı ekleyin:
   ```bash
   cp .env.example .env
   ```
   Windows PowerShell için:
   ```powershell
   copy .env.example .env
   ```

## Çalıştırma
- Geliştirme modu:
  ```bash
  npm run dev
  ```
- Üretim modu:
  ```bash
  npm start
  ```

## Yayına Alma Notları
- `server.js` içindeki `fetch` çağrısı sunucudadır; OpenAI anahtarınızı istemciye asla göndermeyin.
- Gerçek kullanıcı yönetimi için bu örnek kodu bir kimlik doğrulama sistemiyle genişletin.
- `assistant.html` üzerindeki yanıtlar şu anda OpenAI veya mock veriye bağlanır.
- Yayına alırken HTTPS ve güvenlik başlıklarını etkin tutun.
