import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { insertTestSchema, tests, categories } from './shared/schema';
import dotenv from 'dotenv';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';

// .env dosyasını yükle
dotenv.config();

// Veritabanı bağlantısı
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL bulunamadı!');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

/**
 * Örnek test soruları JSON formatında
 */
const createSampleQuestions = (categoryName: string, count: number = 5) => {
  const questions = [];
  
  for (let i = 1; i <= count; i++) {
    questions.push({
      id: i.toString(),
      question: `${categoryName} ile ilgili soru ${i}?`,
      options: [
        { id: 'a', text: 'Cevap seçeneği A' },
        { id: 'b', text: 'Cevap seçeneği B' },
        { id: 'c', text: 'Cevap seçeneği C' },
        { id: 'd', text: 'Cevap seçeneği D' }
      ],
      correctAnswer: 'a', // Varsayılan olarak A seçeneği doğru
      explanation: `${categoryName} sorusu ${i} için açıklama` 
    });
  }
  
  return questions;
};

/**
 * Örnek testleri oluşturur
 */
async function createSampleTests() {
  try {
    console.log('Mevcut kategorileri alınıyor...');
    const allCategories = await db.select().from(categories);
    
    if (allCategories.length === 0) {
      console.error('Hiç kategori bulunamadı! Önce kategorileri oluşturun.');
      return;
    }
    
    console.log(`${allCategories.length} kategori bulundu.`);
    
    // Örnek test 1 - İlk kategori
    const firstCategory = allCategories[0];
    const test1 = {
      uuid: createId(),
      title: `${firstCategory.name} Testi`,
      description: `${firstCategory.name} hakkında bilgilerinizi test edin`,
      categoryId: firstCategory.id,
      creatorId: 1, // Varsayılan olarak ilk kullanıcı
      difficulty: 2,
      duration: 300, // 5 dakika
      questions: createSampleQuestions(firstCategory.name, 5),
      isPublic: true,
      approved: true,
      featured: true
    };
    
    // Örnek test 2 - İkinci kategori (varsa)
    const secondCategory = allCategories.length > 1 ? allCategories[1] : allCategories[0];
    const test2 = {
      uuid: createId(),
      title: `${secondCategory.name} - Zorlayıcı Test`,
      description: `${secondCategory.name} konusunda kendinizi zorlayın`,
      categoryId: secondCategory.id,
      creatorId: 1,
      difficulty: 4,
      duration: 600, // 10 dakika
      questions: createSampleQuestions(secondCategory.name, 10),
      isPublic: true,
      approved: true,
      featured: false
    };
    
    // Örnek test 3 - Üçüncü kategori (varsa)
    const thirdCategory = allCategories.length > 2 ? allCategories[2] : allCategories[0];
    const test3 = {
      uuid: createId(),
      title: `${thirdCategory.name} Başlangıç Testi`,
      description: `${thirdCategory.name} hakkında temel bilgileri test edin`,
      categoryId: thirdCategory.id,
      creatorId: 1,
      difficulty: 1,
      duration: 180, // 3 dakika
      questions: createSampleQuestions(thirdCategory.name, 3),
      isPublic: true,
      approved: false, // Onaylanmamış test
      featured: false
    };
    
    console.log('Testler oluşturuluyor...');
    
    // Test 1'i ekle
    const testResult1 = await db.insert(tests).values(test1).returning();
    console.log(`Test 1 oluşturuldu: ${testResult1[0].title}`);
    
    // Test 2'yi ekle
    const testResult2 = await db.insert(tests).values(test2).returning();
    console.log(`Test 2 oluşturuldu: ${testResult2[0].title}`);
    
    // Test 3'ü ekle
    const testResult3 = await db.insert(tests).values(test3).returning();
    console.log(`Test 3 oluşturuldu: ${testResult3[0].title}`);
    
    console.log('Tüm örnek testler başarıyla oluşturuldu!');
  } catch (error) {
    console.error('Testler oluşturulurken hata:', error);
  } finally {
    // Bağlantıyı kapat
    await client.end();
  }
}

createSampleTests();