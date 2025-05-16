# PixelHunt - Görsel Bilgi Testi Platformu (Teknik Dokümantasyon)

PixelHunt, React ve Firebase teknolojileri kullanılarak geliştirilmiş, görseller üzerinden bilgi testi yapmaya olanak tanıyan bir web uygulamasıdır. Bu doküman, projenin teknik yapısını, kurulum adımlarını ve veritabanı şemasını açıklamaktadır.

## Proje Amacı ve Kapsamı

Projenin temel amacı, kullanıcıların çeşitli kategorilerdeki görsellerle ilgili bilgilerini test edebilecekleri, kendi testlerini oluşturup paylaşabilecekleri interaktif bir platform sunmaktır.

## Temel Fonksiyonellikler

-   **Kullanıcı Kimlik Doğrulama**: Firebase Authentication ile e-posta/şifre ve Google OAuth2.
-   **Test Çözme Mekanizması**: Farklı oyun modları (Klasik, Hızlı, Zamanlı) ve kullanıcı tanımlı testler.
-   **Test Oluşturma**: Kullanıcıların kendi görsellerini yükleyip, cevaplarını tanımlayarak test oluşturabilmesi.
-   **Veri Yönetimi**: Testler, kategoriler, kullanıcı skorları ve profil bilgilerinin Firestore üzerinde saklanması.
-   **Görsel Depolama**: Test görselleri ve kullanıcı avatarlarının Firebase Storage üzerinde barındırılması.
-   **Kullanıcı Arayüzü**: Tailwind CSS ve Shadcn UI ile oluşturulmuş, duyarlı ve modern bir arayüz.
-   **Durum Yönetimi ve Veri Çekme**: React Query (@tanstack/react-query) ile asenkron veri işlemleri ve sunucu durumu yönetimi.
-   **Form Yönetimi**: React Hook Form ve Zod ile şema tabanlı form validasyonu.

## Teknolojik Mimarisi

-   **Frontend**:
    -   Framework/Kütüphane: React 18 (Hooks, Context API)
    -   Dil: TypeScript
    -   Build Aracı: Vite
    -   Styling: Tailwind CSS, Shadcn UI
    -   Animasyon: Framer Motion
    -   Routing: Wouter
    -   State Management (Server): React Query (@tanstack/react-query)
    -   Form Yönetimi: React Hook Form
    -   Şema Validasyonu: Zod
-   **Backend ve Altyapı (Firebase Suite)**:
    -   Kimlik Doğrulama: Firebase Authentication
    -   Veritabanı: Firestore Database (NoSQL Belge Veritabanı)
    -   Dosya Depolama: Firebase Storage
    -   Hosting: (Opsiyonel: Firebase Hosting)
-   **Geliştirme Araçları**:
    -   Versiyon Kontrolü: Git, GitHub
    -   Kod Formatlama/Linting: ESLint, Prettier

## Kurulum ve Geliştirme Ortamı

Yerel geliştirme ortamını kurmak için aşağıdaki adımları izleyin:

1.  **Depoyu Klonlayın**:
    ```bash
    git clone https://github.com/Satelliteq/Pixelhunt-web-app.git
    cd Pixelhunt-web-app
    ```

2.  **Bağımlılıkları Yükleyin**:
    Node.js (LTS) ve npm (veya yarn) gereklidir.
    ```bash
    npm install
    # veya
    # yarn install
    ```

3.  **Firebase Projesi Yapılandırması**:
    -   [Firebase Console](https://console.firebase.google.com/) üzerinden yeni bir proje oluşturun veya mevcut bir projeyi kullanın.
    -   Projenize bir "Web uygulaması" ekleyin.
    -   Elde ettiğiniz Firebase yapılandırma bilgilerini (`apiKey`, `authDomain` vb.) proje kök dizininde `.env.local` adlı bir dosyaya aşağıdaki formatta kaydedin:
        ```env
        VITE_FIREBASE_API_KEY=your_api_key
        VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
        VITE_FIREBASE_PROJECT_ID=your_project_id
        VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
        VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
        VITE_FIREBASE_APP_ID=your_app_id
        # VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id (opsiyonel)
        ```
        *(Not: Vite, çevre değişkenlerinin `VITE_` önekiyle başlamasını gerektirir.)*
    -   Firebase Konsolu'nda:
        -   **Authentication** servisini etkinleştirin (E-posta/Şifre ve Google oturum açma yöntemlerini aktif edin).
        -   **Firestore Database**'i oluşturun (Geliştirme için test modunda başlatılabilir). Güvenlik kurallarını projenizin gereksinimlerine göre yapılandırın.
        -   **Storage** servisini oluşturun. Güvenlik kurallarını, yetkilendirilmiş kullanıcıların dosya yükleyebilmesi ve okuyabilmesi için yapılandırın.

4.  **Geliştirme Sunucusunu Başlatın**:
    ```bash
    npm run dev
    # veya
    # yarn dev
    ```
    Uygulama varsayılan olarak `http://localhost:5173` (veya Vite tarafından atanan başka bir port) üzerinde çalışacaktır.

## Firestore Veri Modeli

Aşağıda projenin temel Firestore koleksiyonları ve içerdikleri alanlar listelenmiştir:

-   **`users`**
    -   *Belge ID*: Firebase Auth `uid`
    -   `username`: String
    -   `email`: String (Firebase Auth'dan senkronize)
    -   `avatarUrl`: String (Firebase Storage'a yüklenen dosyanın URL'i)
    -   `role`: String (`user` | `admin`)
    -   `totalScore`: Number
    -   `createdAt`: Timestamp
    -   `lastLoginAt`: Timestamp
    -   `isBanned`: Boolean

-   **`categories`**
    -   *Belge ID*: Otomatik oluşturulan ID veya özel bir slug
    -   `name`: String (Kategori adı, örn: "Filmler")
    -   `description`: String (Opsiyonel)
    -   `coverImageUrl`: String (Firebase Storage URL'i, opsiyonel)
    -   `testCount`: Number (Bu kategorideki aktif test sayısı, denormalizasyon için)

-   **`tests`**
    -   *Belge ID*: `cuid2` ile oluşturulan benzersiz ID
    -   `title`: String
    -   `description`: String (Opsiyonel)
    -   `categoryId`: String (`categories` koleksiyonundaki bir belge ID'sine referans)
    -   `creatorUid`: String (`users` koleksiyonundaki bir belge ID'sine referans)
    -   `creatorUsername`: String (Okuma kolaylığı için `users`'dan denormalize edilmiş)
    -   `thumbnailUrl`: String (Firebase Storage URL'i, testin kapak görseli)
    -   `isPublic`: Boolean (Herkesin erişimine açık mı?)
    -   `isAnonymous`: Boolean (Oluşturan kullanıcı gizli mi?)
    -   `status`: String (`draft` | `published` | `pending_approval` | `rejected`)
    -   `questions`: Array<Object>
        -   `imageUrl`: String (Firebase Storage URL'i)
        -   `answers`: Array<String> (Kabul edilebilir doğru cevaplar)
        -   `questionText`: String (Opsiyonel, görsel için ek soru metni)
    -   `playCount`: Number
    -   `likeCount`: Number
    -   `createdAt`: Timestamp
    -   `updatedAt`: Timestamp
    -   `tags`: Array<String> (Opsiyonel, arama ve filtreleme için)

-   **`testPlays`** (Bir kullanıcının bir testi oynamasına dair kayıtlar)
    -   *Belge ID*: Otomatik oluşturulan ID
    -   `testId`: String (`tests` koleksiyonuna referans)
    -   `userId`: String (`users` koleksiyonuna referans)
    -   `score`: Number (Bu oynayıştan elde edilen skor)
    -   `timeTakenSeconds`: Number (Opsiyonel, testi tamamlama süresi)
    -   `completedAt`: Timestamp
    -   `userAnswers`: Array<Object> (Opsiyonel, detaylı cevap kaydı için)
        -   `questionIndex`: Number
        -   `selectedAnswer`: String
        -   `isCorrect`: Boolean
        -   `pointsEarned`: Number

-   **`testLikes`** (Kullanıcıların testleri beğenme durumu)
    -   *Belge ID*: `${userId}_${testId}` (Kompozit ID veya otomatik ID)
    -   `userId`: String
    -   `testId`: String
    -   `likedAt`: Timestamp
    *(Alternatif: `tests` belgeleri içinde `likedBy: Array<string>` veya sadece `likeCount` artırımı.)*

-   **`testComments`** (Testler için kullanıcı yorumları)
    -   *Belge ID*: Otomatik oluşturulan ID
    -   `testId`: String
    -   `userId`: String
    -   `username`: String (Denormalize)
    -   `userAvatarUrl`: String (Denormalize)
    -   `commentText`: String
    -   `createdAt`: Timestamp
    -   `updatedAt`: Timestamp (Eğer düzenleme varsa)

*(Not: Bu yapı, projenin ihtiyaçlarına göre evrilebilir. Firestore güvenlik kuralları, bu koleksiyonlara erişimi ve veri bütünlüğünü sağlamak için kritik öneme sahiptir.)*

## Kod Yapısı ve Mimarisi (Özet)

-   **`src/components`**: Yeniden kullanılabilir UI bileşenleri.
    -   **`ui`**: Shadcn UI'dan alınan veya özelleştirilen temel UI elemanları.
    -   **`layout`**: Sayfa düzeni bileşenleri (Navbar, Footer, Sidebar vb.).
    -   **`features`**: Belirli özelliklere (örn: test çözme, test oluşturma) ait bileşen grupları.
-   **`src/pages`**: Uygulamanın farklı sayfalarını temsil eden bileşenler.
-   **`src/lib`**: Yardımcı fonksiyonlar, Firebase yapılandırması, Context API tanımları.
    -   `firebase.ts`: Firebase SDK başlatma ve export etme.
    -   `AuthContext.tsx`: Kullanıcı oturum durumunu yöneten context.
    -   `firebaseHelpers.ts`: Firestore ve Storage ile etkileşim kuran soyutlanmış fonksiyonlar (veri çekme, yazma, dosya yükleme).
    -   `queryClient.ts`: React Query client instance'ı ve varsayılan ayarları.
-   **`src/hooks`**: Özel React hook'ları (custom hooks).
-   **`src/contexts`**: (Eğer AuthContext dışında varsa) Uygulama genelinde state paylaşımı için context'ler.
-   **`src/assets`**: Statik varlıklar (görseller, fontlar vb.).
-   **`src/routes`**: Wouter ile tanımlanan uygulama rotaları.
-   **`src/styles`**: Global CSS veya Tailwind CSS yapılandırması.
-   **`src/types`**: TypeScript tip tanımları ve arayüzleri.

## Gelecekteki Geliştirmeler ve Olası İyileştirmeler

-   **Firestore Güvenlik Kurallarının Detaylandırılması**: Daha granüler erişim kontrolü.
-   **Cloud Functions Entegrasyonu**: Sunucu taraflı mantıklar için (örn: `testCount` gibi denormalize verilerin otomatik güncellenmesi, bildirim gönderme).
-   **Test Kapsamının Artırılması**: Birim ve entegrasyon testleri.
-   **Performans Optimizasyonları**: Büyük veri setleri için Firestore sorgu optimizasyonları, React bileşenlerinde memoization.
-   **CI/CD Pipeline Kurulumu**: Otomatik build ve deploy süreçleri.

## Katkıda Bulunma Yönergeleri

Bu proje şu anda aktif olarak geliştirilmektedir. Katkıda bulunmak isteyen geliştiriciler için:

1.  Bu depoyu fork edin.
2.  Yeni bir özellik veya hata düzeltmesi için ayrı bir dal (`feature/ABC` veya `fix/XYZ`) oluşturun.
3.  Kodlama standartlarına (ESLint, Prettier) uyun.
4.  Değişikliklerinizi açıklayıcı commit mesajları ile kaydedin.
5.  Kendi fork'unuza push yapın ve ana depoya bir Pull Request oluşturun.
6.  Pull Request'inizde yaptığınız değişiklikleri ve motivasyonunuzu net bir şekilde açıklayın.

## Lisans

Bu proje MIT Lisansı altında dağıtılmaktadır. Detaylar için `LICENSE` dosyasına bakınız.
