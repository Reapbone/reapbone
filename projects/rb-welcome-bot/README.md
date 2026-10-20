# RB Welcome Bot

Modern ama temel bir **karşılama botu**.

## Özellikler
- Slash komut ile kanal ayarı
- Embed karşılama ve ayrılma mesajları
- Otomatik rol verme
- JSON dosya tabanlı sunucu ayarları

## Kurulum
```bash
npm install
copy .env.example .env
npm run deploy
npm start
```

## 2026 Kurulum Notları

- Node.js **24.17+** ve discord.js **14.27+** gerektirir.
- Bot tokenini yalnızca yerel `.env` dosyasına koyun; `.env.example` örnektir.
- Slash komutlar test sunucusunda `npm run deploy` ile kurulur.
- Bot için Discord Developer Portal üzerinden **bot** ve **applications.commands** yetkileri gerekir.
- Bu proje sade eğitim/portföy örneğidir. Önce ayrı bir test sunucusunda deneyin.
