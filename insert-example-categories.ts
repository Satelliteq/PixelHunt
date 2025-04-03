import { supabaseStorage } from './server/supabase-storage';

/**
 * Bu betik, örnek kategorileri veritabanına ekler
 */
async function addExampleCategories() {
  try {
    // Farklı icon ve renklerle kategoriler
    const categoriesData = [
      {
        name: "Edebiyat",
        description: "Kitaplar, yazarlar ve edebi eserler hakkında testler",
        iconname: "book-open",
        color: "#3B82F6", // blue-500
        backgroundcolor: "#EFF6FF", // blue-50
        active: true
      },
      {
        name: "Coğrafya", 
        description: "Dünya coğrafyası, ülkeler ve yerler hakkında testler",
        iconname: "globe",
        color: "#10B981", // green-500
        backgroundcolor: "#ECFDF5", // green-50
        active: true
      },
      {
        name: "Film ve TV", 
        description: "Filmler, TV şovları ve sinema hakkında testler",
        iconname: "film",
        color: "#8B5CF6", // purple-500
        backgroundcolor: "#F5F3FF", // purple-50
        active: true
      },
      {
        name: "Sanat",
        description: "Sanat, resim ve heykel hakkında testler",
        iconname: "palette",
        color: "#F59E0B", // yellow-500
        backgroundcolor: "#FFFBEB", // yellow-50
        active: true
      },
      {
        name: "Oyunlar", 
        description: "Video oyunları ve oyun karakterleri hakkında testler",
        iconname: "gamepad-2",
        color: "#EF4444", // red-500
        backgroundcolor: "#FEF2F2", // red-50
        active: true
      },
      {
        name: "Müzik",
        description: "Müzik, sanatçılar ve şarkılar hakkında testler",
        iconname: "music",
        color: "#EC4899", // pink-500
        backgroundcolor: "#FDF2F8", // pink-50
        active: true
      },
      {
        name: "Bilim",
        description: "Bilim, fizik, kimya ve biyoloji hakkında testler",
        iconname: "flask-conical",
        color: "#6366F1", // indigo-500
        backgroundcolor: "#EEF2FF", // indigo-50
        active: true
      },
      {
        name: "Tarih",
        description: "Tarih, önemli olaylar ve kişiler hakkında testler",
        iconname: "landmark",
        color: "#D97706", // amber-600
        backgroundcolor: "#FFFBEB", // amber-50
        active: true
      }
    ];

    console.log('Örnek kategori verileri ekleniyor...');
    
    for (const categoryData of categoriesData) {
      const category = await supabaseStorage.createCategory(categoryData);
      console.log(`Kategori eklendi: ${category.name} (ID: ${category.id})`);
    }

    console.log('Tüm örnek kategori verileri başarıyla eklendi.');
  } catch (error) {
    console.error('Kategori eklenirken hata oluştu:', error);
  }
}

async function main() {
  try {
    await addExampleCategories();
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

main();