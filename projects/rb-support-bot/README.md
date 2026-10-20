# RB Support Bot

Aşırı temel seviyede ama modern bir **destek botu**.

## Özellikler
- Slash komutlar
- Embed tabanlı destek paneli
- Buton ile ticket açma
- Modal ile problem açıklaması alma
- Ticket kanalı oluşturma
- Kapat / Claim butonları
- Log kanalı desteği

## Kurulum
```bash
npm install
copy .env.example .env
npm run deploy
npm start
```

## Komutlar
- `/support-panel` → Destek paneli yollar
- `/close-ticket` → Ticket kanalını kapatır

## Not
- `GUILD_ID` test kurulum için zorunludur.
- `TICKET_CATEGORY_ID` boş kalırsa ticket kanalları sunucu kökünde açılır.

## 2026 Kurulum Notları

- Node.js **24.17+** ve discord.js **14.27+** gerektirir.
- Bot tokenini yalnızca yerel `.env` dosyasına koyun; `.env.example` örnektir.
- Slash komutlar test sunucusunda `npm run deploy` ile kurulur.
- Bot için Discord Developer Portal üzerinden **bot** ve **applications.commands** yetkileri gerekir.
- Bu proje sade eğitim/portföy örneğidir. Önce ayrı bir test sunucusunda deneyin.
