# REAPBONE — Kurulum Rehberi

Bu paket iki şey kurar:

1. **GitHub profil README'si:** animasyonlu özel SVG banner, terminal animasyonu, GitHub Actions ile güncellenen istatistikler, katkı yılanı ve tıklanınca açılan bölümler.
2. **GitHub Pages sitesi:** etkileşimli sürüklenebilir AI ağı, filtrelenebilir GERÇEK herkese açık GitHub repoları, çalışan mini terminal, Türkçe/İngilizce dil seçimi, açık/koyu tema, klavye kısayolu, mobil tasarım.

> Not: GitHub, README içine özel JavaScript/iframe koymaya izin vermediği için tam etkileşimler **GitHub Pages'te** bulunur. README'deki CSS/SVG animasyonlarının hareketi tarayıcı veya hareket azaltma ayarlarına göre değişebilir. Bu normaldir.

## 1. GitHub profiline yükleme

1. GitHub'a giriş yap.
2. [Yeni repository oluştur](https://github.com/new) sayfasına git.
3. Repository adını **GitHub kullanıcı adınla birebir aynı** yap. Eğer GitHub kullanıcı adın `Reapbone` ise repository adın da `Reapbone` olmalı.
4. **Public** seç ve oluştur. Repo boş da olabilir.
5. Bu ZIP dosyasını bilgisayarında bir klasöre çıkart.
6. ZIP'in içindeki **README.md, assets/, docs/, .github/, scripts/** içeriklerini repoya aktar. `.github` gizli klasördür, onu da atladığından emin olma.
7. Dosyalar `main` dalında ve `README.md` en üst düzeyde olsun.

**Windows PowerShell / git ile hızlı yükleme:**

```powershell
# Dosyaları çıkarttığın Reapbone-GitHub-Profile klasöründe çalıştır.
# GitHub'da önceden boş "Reapbone" adlı public repository açılmış olmalı.
cd "C:\dosyalar\Reapbone-GitHub-Profile"
git init
git branch -M main
git add .
git commit -m "feat: launch Reapbone interactive profile"
git remote add origin https://github.com/Reapbone/reapbone.git
git push -u origin main
```

Repository'yi README ekleyerek oluşturduysan ilk commit dolu olacaktır; bu durumda repoyu önce `git clone` ile bilgisayarına al, ZIP dosyalarını klonun içine kopyala ve `git add .`, `git commit`, `git push` komutlarını çalıştır.

## 2. GitHub Actions: otomatik grafikler

Repo > **Settings > Actions > General > Workflow permissions** bölümünde mümkünse **Read and write permissions** seç. Bu seçenek kısıtlıysa kuruluş veya repo politikasından izin almak gerekebilir. GitHub Actions'ın çalışmasına izin ver.

Repo > **Actions** bölümünde şu iş akışlarını birer kez **Run workflow** ile çalıştır:

- `Animated Contribution Snake`: animasyonlu katkı grafiği oluşturup `output` dalına koyar. Ardından README'deki yılan görünür.
- `Refresh GitHub Stats`: gerçek public repo, kazanılan yıldız ve takipçi verilerini `assets/stats.svg` içine yazar. Otomatik commit atar.

Bu işlemler zamanlanmış olarak **günlük** tekrar çalışır. Yılan ilk çalışmaya kadar README'de boş/kırık görünebilir; bu, henüz çıktı dosyasının oluşturulmadığı anlamına gelir. GitHub profil katkıları sadece GitHub'ın ilgili kullanıcı için erişilebilen verilerini yansıtır.

## 3. GitHub Pages: etkileşimli site

Repo > **Settings > Pages > Build and deployment > Source** kısmından **GitHub Actions** seç.

Ardından **Actions > Deploy Interactive Portfolio > Run workflow** düğmesine tıkla. Yayın bittiğinde sitenin beklenen adresi:

**https://reapbone.github.io/reapbone/**

GitHub'ın gösterdiği kesin yayın URL'si farklıysa README'deki portfolio bağlantılarını onunla değiştir.

> Profil repository'si kişisel Pages `username.github.io` repository'si değilse, proje Pages URL'si `/Reapbone/` gibi bir klasörle biter. Bu paket tüm site kaynaklarını göreli yollarla kullandığından proje Pages altında çalışır.

## 4. Eğer GitHub kullanıcı adın Reapbone DEĞİLSE

Bu pakette `Reapbone` bir örnek GitHub kullanıcı adı olarak kullanıldı. Gerçek kullanıcı adın farklıysa **yüklemeden önce** tüm içerikteki aşağıdaki bağlantıları kendi kullanıcı adına ve repository adına göre düzenle:

- `README.md`: `github.com/Reapbone`, `raw.githubusercontent.com/Reapbone/reapbone` ve `reapbone.github.io/Reapbone`
- `docs/index.html`: `<meta name="github-user" content="Reapbone" />` ve Open Graph görsel URL'si
- `scripts/update_stats.py`: varsayılan `GITHUB_USERNAME` (GitHub Actions çalışırken repo sahibi otomatik alınır)

GitHub profilinde görünen isim veya marka `Reapbone` olarak kalabilir; sadece teknik kullanıcı adı/URL'leri eşleşmek zorundadır.

## 5. Yerel test (Windows)

Ek bir JavaScript paketi veya `npm install` gerekmez. Python yüklüyse:

```powershell
cd "C:\dosyalar\Reapbone-GitHub-Profile"
py -m http.server 8000 --directory docs
```

Tarayıcıdan `http://localhost:8000` aç. Live repo listesi için internet bağlantısı gerekir. GitHub Public API'nin oturum açmadan kullanım sınırları vardır; API kısıtlandığında site bilgilendirme gösterir. Site, **asla hayalî proje kartları göstermez**.

## 6. Kişiselleştirilecek alanlar

- **README metni:** `README.md`
- **Profil banner / logo:** `assets/hero.svg`
- **Terminal animasyonu:** `assets/terminal.svg`
- **Site metinleri / Türkçe ve İngilizce:** `docs/script.js` içindeki `dictionary`
- **Renkler, tipografi, boşluklar:** `docs/styles.css` başındaki `:root`
- **Site tarayıcı ikonu:** `docs/favicon.svg`

Site JavaScript'i dışarıdan hiçbir gizli bilgi veya API anahtarı kullanmaz. **Token, şifre veya özel API key'i bu dosyalara koyma.** GitHub Actions, kendi otomatik `GITHUB_TOKEN` yetkisini kullanır.

## 7. Teknik ayrıntılar

- Yalnızca `README.md` README profilinde açılır. `docs/` ayrı bir Pages sitesidir.
- JavaScript, terminalden alınan girdileri `eval` etmez; sadece belirlenmiş güvenli komutları uygular.
- Proje kartları doğrudan GitHub API'den gelir. Açık repolardan en fazla 12'si aynı anda listelenir; filtreler ve arama bu görünümü değiştirir.
- GitHub Pages kaynakları **statiktir**. Hosting, sunucu, veritabanı veya özel alan adı zorunlu değildir.
- `prefers-reduced-motion` tercihi olan ziyaretçiler için efektler azaltılır.
- İstatistik kartları Actions ilk kez çalışıncaya kadar `—` işareti gösterir.

**Lisans:** Projenin bu pakette özgün hazırlanan görsel ve kodları üzerinde dilediğin gibi değişiklik yapabilirsin. Kullanılan üçüncü taraf GitHub Actions kendi lisans ve kullanım koşullarına tabidir.
