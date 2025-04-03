import { supabaseStorage } from './server/supabase-storage';
import { randomUUID } from 'crypto';

/**
 * Bu betik, örnek testleri veritabanına ekler
 */
async function addExampleTests() {
  try {
    // Farklı kategorilerde örnek testler
    const testsData = [
      {
        title: "Edebiyat Dünyası",
        description: "Edebiyat dünyasının ünlü eserleri ve yazarları hakkında bilginizi test edin.",
        category_id: 1, // Edebiyat kategorisi
        creator_id: 1, // Admin kullanıcı ID'si
        difficulty: 2,
        duration: 10, // dakika cinsinden
        image_url: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&h=250",
        questions: [
          {
            question: "Aşağıdakilerden hangisi Franz Kafka'nın eseri değildir?",
            options: ["Dönüşüm", "Dava", "Şato", "Suç ve Ceza"],
            correctAnswer: 3,
            explanation: "Suç ve Ceza, Franz Kafka'nın değil Fyodor Dostoyevski'nin eseridir."
          },
          {
            question: "Aşağıdaki yazarlardan hangisi Nobel Edebiyat Ödülü almamıştır?",
            options: ["Orhan Pamuk", "Yaşar Kemal", "Nazım Hikmet", "Gabriel Garcia Marquez"],
            correctAnswer: 2,
            explanation: "Nazım Hikmet Nobel Edebiyat Ödülü almamıştır."
          },
          {
            question: "Küçük Prens kitabının yazarı kimdir?",
            options: ["Jules Verne", "Antoine de Saint-Exupéry", "Victor Hugo", "Albert Camus"],
            correctAnswer: 1,
            explanation: "Küçük Prens, Antoine de Saint-Exupéry tarafından yazılmıştır."
          }
        ],
        approved: true,
        is_public: true,
        is_anonymous: false,
        featured: true
      },
      {
        title: "Dünya Coğrafyası",
        description: "Dünya ülkeleri, başkentleri ve önemli özellikleri hakkında bilgi testi.",
        category_id: 2, // Coğrafya kategorisi
        creator_id: 1, // Admin kullanıcı ID'si
        difficulty: 1,
        duration: 5, // dakika cinsinden
        image_url: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&h=250",
        questions: [
          {
            question: "Aşağıdakilerden hangisi Fransa'nın başkentidir?",
            options: ["Londra", "Berlin", "Paris", "Madrid"],
            correctAnswer: 2,
            explanation: "Paris, Fransa'nın başkentidir."
          },
          {
            question: "Dünyanın en büyük okyanusu hangisidir?",
            options: ["Hint Okyanusu", "Atlantik Okyanusu", "Pasifik Okyanusu", "Arktik Okyanusu"],
            correctAnswer: 2,
            explanation: "Pasifik Okyanusu, dünyanın en büyük okyanusudur."
          }
        ],
        approved: true,
        is_public: true,
        is_anonymous: false,
        featured: false
      },
      {
        title: "Video Oyunları Testi",
        description: "Popüler video oyunları hakkında eğlenceli bir test.",
        category_id: 5, // Oyunlar kategorisi
        creator_id: 1, // Admin kullanıcı ID'si
        difficulty: 3,
        duration: 8, // dakika cinsinden
        image_url: "/attached_assets/ba1f50f644077acc8bedb8b0634c1af8.jpg",
        questions: [
          {
            question: "Super Mario serisinin yaratıcısı kimdir?",
            options: ["Hideo Kojima", "Shigeru Miyamoto", "Satoru Iwata", "Todd Howard"],
            correctAnswer: 1,
            explanation: "Super Mario, Shigeru Miyamoto tarafından yaratılmıştır."
          },
          {
            question: "Aşağıdaki oyun konsollarından hangisi Microsoft tarafından üretilmektedir?",
            options: ["PlayStation", "Nintendo Switch", "Xbox", "Sega Genesis"],
            correctAnswer: 2,
            explanation: "Xbox, Microsoft tarafından üretilen bir oyun konsoludur."
          },
          {
            question: "Minecraft oyunu hangi şirket tarafından satın alınmıştır?",
            options: ["Google", "Microsoft", "Sony", "Apple"],
            correctAnswer: 1,
            explanation: "Minecraft, 2014 yılında Microsoft tarafından 2.5 milyar dolara satın alınmıştır."
          },
          {
            question: "Fortnite oyunu hangi şirket tarafından geliştirilmiştir?",
            options: ["Valve", "Epic Games", "Activision Blizzard", "EA Games"],
            correctAnswer: 1,
            explanation: "Fortnite, Epic Games tarafından geliştirilmiştir."
          }
        ],
        approved: true,
        is_public: true,
        is_anonymous: false,
        featured: true
      }
    ];

    console.log('Örnek test verileri ekleniyor...');
    
    for (const testData of testsData) {
      const test = await supabaseStorage.createTest(testData);
      console.log(`Test eklendi: ${test.title} (ID: ${test.id})`);
    }

    console.log('Tüm örnek test verileri başarıyla eklendi.');
  } catch (error) {
    console.error('Test eklenirken hata oluştu:', error);
  }
}

async function main() {
  try {
    await addExampleTests();
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

main();