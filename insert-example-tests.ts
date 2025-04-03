import { createClient } from '@supabase/supabase-js';
import { createId } from '@paralleldrive/cuid2';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Supabase clientını oluştur
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Bu betik, örnek testleri veritabanına ekler
 */
async function addExampleTests() {
  console.log("🧪 Örnek testler ekleniyor...");

  // Örnek test soruları
  const exampleQuestions1 = [
    {
      id: 1,
      imageUrl: "/attached_assets/6c161a984b072640f8d7cde4b759f0a8.jpg",
      question: "Bu ünlü resim hangisine aittir?",
      options: ["Picasso", "Leonardo da Vinci", "Van Gogh", "Monet"],
      correctAnswer: "Leonardo da Vinci",
      hint: "İtalyan Rönesans döneminin en önemli eserlerinden biridir.",
      explanation: "Mona Lisa, Leonardo da Vinci'nin 1503-1519 yılları arasında yaptığı ünlü portre tablosudur."
    },
    {
      id: 2,
      imageUrl: "/attached_assets/86b4065a7c34a1c78de57b71078b4f5b.jpg",
      question: "Bu tarihi yapı hangi şehirde bulunmaktadır?",
      options: ["Roma", "Atina", "İstanbul", "Paris"],
      correctAnswer: "Roma",
      hint: "İtalya'nın başkentindedir.",
      explanation: "Kolezyum, İtalya'nın başkenti Roma'da bulunan antik bir amfi tiyatrodur."
    },
    {
      id: 3,
      imageUrl: "/attached_assets/ba1f50f644077acc8bedb8b0634c1af8.jpg",
      question: "Bu ünlü köprü hangi şehirdedir?",
      options: ["New York", "Londra", "Sydney", "San Francisco"],
      correctAnswer: "San Francisco",
      hint: "ABD'nin batı kıyısında bulunan bir şehirde yer alır.",
      explanation: "Golden Gate Köprüsü, San Francisco Körfezi'nin girişinde yer alan ve San Francisco ile Marin County'yi birbirine bağlayan asma köprüdür."
    }
  ];

  const exampleQuestions2 = [
    {
      id: 1,
      imageUrl: "/attached_assets/6c161a984b072640f8d7cde4b759f0a8.jpg",
      question: "Bu tablonun adı nedir?",
      options: ["Çığlık", "Mona Lisa", "Son Akşam Yemeği", "Yıldızlı Gece"],
      correctAnswer: "Mona Lisa",
      hint: "Louvre Müzesi'nde sergilenmektedir.",
      explanation: "Mona Lisa, Leonardo da Vinci'nin en tanınmış eseridir ve dünya çapında bir sanat ikonu haline gelmiştir."
    },
    {
      id: 2,
      imageUrl: "/attached_assets/86b4065a7c34a1c78de57b71078b4f5b.jpg",
      question: "Bu yapının asıl adı nedir?",
      options: ["Colosseum", "Parthenon", "Pantheon", "Circus Maximus"],
      correctAnswer: "Colosseum",
      hint: "MS 72-80 yılları arasında inşa edilmiştir.",
      explanation: "Flavian Amfitiyatrosu olarak da bilinen Kolezyum, Roma İmparatorluğu döneminde inşa edilmiş devasa bir amfi tiyatrodur."
    }
  ];

  // Örnek testleri oluştur
  const exampleTests = [
    {
      uuid: createId(),
      title: "Dünya Kültür Mirasları Testi",
      description: "Dünya çapında tanınan kültürel miraslar ve sanat eserleri hakkında bilginizi test edin.",
      category_id: 1, // Sanat ve Kültür kategorisi
      image_url: "/attached_assets/6c161a984b072640f8d7cde4b759f0a8.jpg",
      questions: exampleQuestions1,
      play_count: 32,
      like_count: 14,
      is_public: true,
      approved: true,
      featured: true
    },
    {
      uuid: createId(),
      title: "Sanat Eserleri Testi",
      description: "Ünlü sanat eserleri hakkında ne kadar bilgilisiniz?",
      category_id: 1, // Sanat ve Kültür kategorisi
      image_url: "/attached_assets/ba1f50f644077acc8bedb8b0634c1af8.jpg",
      questions: exampleQuestions2,
      play_count: 21,
      like_count: 7,
      is_public: true,
      approved: true,
      featured: false
    }
  ];

  try {
    // Her test için ekle
    for (const test of exampleTests) {
      const { data: existingTest, error: checkError } = await supabase
        .from('tests')
        .select('id')
        .eq('title', test.title)
        .maybeSingle();

      if (checkError) {
        console.error('Test kontrolü sırasında hata:', checkError);
        continue;
      }

      if (existingTest) {
        console.log(`"${test.title}" isimli test zaten mevcut, güncelleniyor...`);
        const { error: updateError } = await supabase
          .from('tests')
          .update({
            description: test.description,
            category_id: test.category_id,
            image_url: test.image_url,
            questions: test.questions,
            play_count: test.play_count,
            like_count: test.like_count,
            featured: test.featured
          })
          .eq('id', existingTest.id);

        if (updateError) {
          console.error(`"${test.title}" güncellenirken hata:`, updateError);
        } else {
          console.log(`"${test.title}" başarıyla güncellendi.`);
        }
      } else {
        console.log(`"${test.title}" isimli test ekleniyor...`);
        const { error: insertError } = await supabase
          .from('tests')
          .insert([test]);

        if (insertError) {
          console.error(`"${test.title}" eklenirken hata:`, insertError);
        } else {
          console.log(`"${test.title}" başarıyla eklendi.`);
        }
      }
    }

    console.log("✅ Örnek testler başarıyla eklendi.");
  } catch (error) {
    console.error("❌ Testler eklenirken hata oluştu:", error);
  }
}

// Ana fonksiyon
async function main() {
  try {
    await addExampleTests();
    console.log("✅ Tüm işlemler tamamlandı.");
  } catch (error) {
    console.error("❌ İşlem sırasında hata oluştu:", error);
  } finally {
    process.exit(0);
  }
}

main();