# Reapbone · Discord örnek projeleri

Bu depodaki `projects/` klasöründe birbirinden bağımsız üç Node.js bot örneği vardır:

- `rb-support-bot/`: Slash komutlarla yönetilen, embed + modal + buton kullanan ticket botu.
- `rb-moderation-bot/`: Slash moderasyon, uyarı kayıtları ve log kanalına sahip temel bot.
- `rb-welcome-bot/`: Embed karşılama/ayrılma mesajları ve autorole ayarları.

Her klasör tek başına projedir; kendi `package.json`, README ve `.env.example` dosyası vardır. Dosyaları ilgili klasörde çalıştırabilirsiniz. Gerçek bot tokenlarını asla GitHub'a koymayın. Üç botu GitHub'da **ayrı repo** olarak sunmak için hesapta `rb-support-bot`, `rb-moderation-bot` ve `rb-welcome-bot` adlarında depolar oluşturulmalı; şu anda profil deposundaki klasörler olarak yayımlanıyorlar.

Bu dosya profil README'sine bağlantı vermek zorunda değildir.
