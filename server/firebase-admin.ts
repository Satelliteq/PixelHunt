import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK yapılandırması
// Notlar: 1) .env dosyasındaki FIREBASE_SERVICE_ACCOUNT değişkenini kullanıyoruz
//         2) Eğer bu çalışmazsa, JSON key dosyasını yükleyip kullanmalıyız

let app: admin.app.App;

try {
  // Servis hesabı bilgilerini çevresel değişkenden almaya çalış
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (serviceAccount) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin SDK başarıyla yapılandırıldı (env değişkenleri ile)');
  } else {
    // Varsayılan olarak başlat (Google Cloud üzerinde deploy edildiğinde otomatik kimlik doğrulama ile çalışır)
    app = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin SDK varsayılan kimlik bilgileri ile başlatıldı');
  }
} catch (error: any) {
  console.error('Firebase Admin SDK yapılandırma hatası:', error);
  console.log('Firebase Admin SDK başlatılamadı. Servis hesabı ayarlarını kontrol edin.');
  
  // Geliştirme ortamında devam etmek için boş bir uygulama başlat
  if (process.env.NODE_ENV === 'development') {
    console.log('Geliştirme modunda devam ediliyor, ancak Firebase Admin SDK çalışmayacak');
    // @ts-ignore - Bu sadece geliştirme amaçlı
    app = { firestore: () => ({}) } as admin.app.App;
  } else {
    throw error;
  }
}

export const db = getFirestore(app);
export const auth = admin.auth(app);
export const storage = admin.storage(app);

export default app;