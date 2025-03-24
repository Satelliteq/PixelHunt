import { createClient } from '@supabase/supabase-js';
import { createId } from '@paralleldrive/cuid2';
import dotenv from 'dotenv';

// .env dosyasını yükle
dotenv.config();

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY bulunamadı!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { data: allCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true);
    
    if (categoriesError) {
      console.error('Kategorileri alırken hata:', categoriesError);
      return;
    }
    
    if (!allCategories || allCategories.length === 0) {
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
      category_id: firstCategory.id,
      creator_id: 1, // Varsayılan olarak ilk kullanıcı
      difficulty: 2,
      duration: 300, // 5 dakika
      questions: createSampleQuestions(firstCategory.name, 5),
      is_public: true,
      approved: true,
      featured: true,
      play_count: 0,
      like_count: 0
    };
    
    // Örnek test 2 - İkinci kategori (varsa)
    const secondCategory = allCategories.length > 1 ? allCategories[1] : allCategories[0];
    const test2 = {
      uuid: createId(),
      title: `${secondCategory.name} - Zorlayıcı Test`,
      description: `${secondCategory.name} konusunda kendinizi zorlayın`,
      category_id: secondCategory.id,
      creator_id: 1,
      difficulty: 4,
      duration: 600, // 10 dakika
      questions: createSampleQuestions(secondCategory.name, 10),
      is_public: true,
      approved: true,
      featured: false,
      play_count: 0,
      like_count: 0
    };
    
    // Örnek test 3 - Üçüncü kategori (varsa)
    const thirdCategory = allCategories.length > 2 ? allCategories[2] : allCategories[0];
    const test3 = {
      uuid: createId(),
      title: `${thirdCategory.name} Başlangıç Testi`,
      description: `${thirdCategory.name} hakkında temel bilgileri test edin`,
      category_id: thirdCategory.id,
      creator_id: 1,
      difficulty: 1,
      duration: 180, // 3 dakika
      questions: createSampleQuestions(thirdCategory.name, 3),
      is_public: true,
      approved: false, // Onaylanmamış test
      featured: false,
      play_count: 0,
      like_count: 0
    };
    
    console.log('Testler oluşturuluyor...');
    
    // Test 1'i ekle
    const { data: testResult1, error: error1 } = await supabase
      .from('tests')
      .insert(test1)
      .select();
      
    if (error1) {
      console.error('Test 1 oluşturulurken hata:', error1);
    } else {
      console.log(`Test 1 oluşturuldu: ${testResult1?.[0]?.title}`);
    }
    
    // Test 2'yi ekle
    const { data: testResult2, error: error2 } = await supabase
      .from('tests')
      .insert(test2)
      .select();
      
    if (error2) {
      console.error('Test 2 oluşturulurken hata:', error2);
    } else {
      console.log(`Test 2 oluşturuldu: ${testResult2?.[0]?.title}`);
    }
    
    // Test 3'ü ekle
    const { data: testResult3, error: error3 } = await supabase
      .from('tests')
      .insert(test3)
      .select();
      
    if (error3) {
      console.error('Test 3 oluşturulurken hata:', error3);
    } else {
      console.log(`Test 3 oluşturuldu: ${testResult3?.[0]?.title}`);
    }
    
    console.log('Tüm örnek testler oluşturulma işlemi tamamlandı!');
  } catch (error) {
    console.error('Testler oluşturulurken hata:', error);
  }
}

createSampleTests();