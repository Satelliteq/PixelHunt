import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Temel kategoriler
const sampleCategories = [
  {
    name: 'Genel',
    description: 'Genel bilgi kategorisi',
    iconUrl: 'https://imagingcdn.villagevoice.com/wp-app-theme/village-voice/images/default.png'
  },
  {
    name: 'Sanat',
    description: 'Sanat ve resim kategorisi',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/1200px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg'
  },
  {
    name: 'Film ve TV',
    description: 'Film ve televizyon kategorisi',
    iconUrl: 'https://static.wikia.nocookie.net/starwars/images/c/cc/Star-wars-logo-new-tall.jpg'
  },
  {
    name: 'Müzik',
    description: 'Müzik ve müzisyenler kategorisi',
    iconUrl: 'https://media.npr.org/assets/img/2022/07/14/gettyimages-1393567007_custom-b1ee29c3ab9c970172c9034d5309f4fd8d42f2ba-s1100-c50.jpg'
  }
];

// Kategori ekleme fonksiyonu
async function addCategories() {
  console.log('Kategoriler ekleniyor...');
  
  try {
    // Şu anda veritabanında olan kategorileri kontrol edelim
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('name');
    
    if (fetchError) {
      console.error('Kategori verilerini alma hatası:', fetchError);
      return;
    }
    
    const existingNames = existingCategories ? existingCategories.map(cat => cat.name) : [];
    console.log('Mevcut kategoriler:', existingNames);
    
    // Yeni kategorileri ekleyelim
    for (const category of sampleCategories) {
      if (!existingNames.includes(category.name)) {
        const { data, error } = await supabase
          .from('categories')
          .insert([{
            name: category.name,
            description: category.description,
            icon_url: category.iconUrl
          }]);
        
        if (error) {
          console.error(`"${category.name}" kategorisi eklenirken hata:`, error);
        } else {
          console.log(`"${category.name}" kategorisi başarıyla eklendi`);
        }
      } else {
        console.log(`"${category.name}" kategorisi zaten mevcut`);
      }
    }
    
    console.log('Kategori ekleme işlemi tamamlandı');
  } catch (error) {
    console.error('Kategori ekleme hatası:', error);
  }
}

// Betiği çalıştır
addCategories().catch(console.error);