# PixelHunt - Görsel Bilgi Testi Platformu

PixelHunt (İmgesel), çeşitli kategorilerdeki görselleri tahmin etmeye dayalı interaktif ve eğlenceli bir web ve mobil ortak platformudur. Kullanıcılar hem hazır testleri oynayabilir hem de kendi testlerini oluşturup paylaşabilirler.

## Özellikler

- **Farklı Oyun Modları**:

  - **Klasik Mod**: Bir görselin kademeli olarak açılmasıyla doğru tahmin yapmaya çalışın
  - **Hızlı Mod**: En kısa sürede doğru cevabı bulmaya çalışın
  - **Zamanlı Mod**: Belirli bir süre içinde mümkün olduğunca çok soruyu doğru cevaplayın
  - **Test Modu**: Kullanıcılar tarafından oluşturulan özel testleri çözün

- **Test Oluşturma ve Paylaşma**:

  - Kolay kullanımlı test oluşturma arayüzü
  - Testleri UUID bağlantıları ile paylaşma
  - Test sonuçlarını görüntüleme ve puanlama

- **Sosyal Özellikler**:

  - Testleri beğenme ve yorum yapma
  - Liderlik tablosu ve kullanıcı profilleri
  - Anonim test paylaşımı seçeneği

- **Kullanıcı Dostu Tasarım**:
  - Mobil uyumlu arayüz
  - Karanlık/Aydınlık tema seçeneği
  - Çoklu dil desteği (Türkçe/İngilizce)

## Teknolojiler

- **Frontend**:

  - React 18 with TypeScript
  - Tailwind CSS & Shadcn UI bileşenleri
  - Framer Motion animasyonları

- **Backend**:

  - Node.js & Express
  - PostgreSQL veritabanı (Drizzle ORM)
  - RESTful API mimarisi

- **Bulut Hizmetleri**:
  - Supabase Storage (görsel depolama)
  - Supabase Authentication (kimlik doğrulama)

## Kurulum

Projeyi yerel ortamınızda çalıştırmak için:

```bash
# Projeyi klonlayın
git clone https://github.com/Satelliteq/Pixelhunt-web-app.git
cd Pixelhunt-web-app

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

## Veritabanı Şeması

Proje aşağıdaki temel veritabanı tablolarını kullanmaktadır:

- **users**: Kullanıcı hesapları ve profil bilgileri
- **categories**: Test kategorileri (Sanat, Coğrafya, Film/TV vb.)
- **images**: Tüm görsel içerikler ve cevaplar
- **tests**: Kullanıcılar tarafından oluşturulan testler
- **game_scores**: Oyun puanları ve liderlik tablosu verileri

## Katkıda Bulunma

1. Bu depoyu fork edin
2. Yeni bir özellik dalı oluşturun (`git checkout -b yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik: Açıklama'`)
4. Dalı uzak depoya push edin (`git push origin yeni-ozellik`)
5. Bir Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakın.

## İletişim

Sorularınız veya önerileriniz için lütfen bir issue açın veya doğrudan proje sahibiyle iletişime geçin.

---

&copy; 2025 PixelHunt. Tüm hakları saklıdır.
