require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase bağlantısı
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Kategori verilerini ekle
async function addSampleCategories() {
  try {
    // Önce mevcut kategorileri kontrol et
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('name');
    
    if (existingCategories && existingCategories.length > 0) {
      console.log('Categories already exist. Skipping insertion.');
      return;
    }
    
    // Örnek kategori verileri
    const categories = [
      {
        name: 'Arabalar',
        description: 'Araba markaları ve modelleri',
        icon_name: 'car',
        color: '#FF5722',
        active: true
      },
      {
        name: 'Filmler',
        description: 'Film karakterleri ve sahneler',
        icon_name: 'film',
        color: '#4F46E5',
        active: true
      },
      {
        name: 'Sanat',
        description: 'Sanat eserleri ve sanatçılar',
        icon_name: 'palette',
        color: '#10B981',
        active: true
      },
      {
        name: 'Coğrafya',
        description: 'Ülkeler, şehirler ve doğal yapılar',
        icon_name: 'globe',
        color: '#3B82F6',
        active: true
      },
      {
        name: 'Oyunlar',
        description: 'Video oyunları ve karakterler',
        icon_name: 'gamepad',
        color: '#8B5CF6',
        active: true
      }
    ];
    
    // Verileri ekle
    const { data, error } = await supabase
      .from('categories')
      .insert(categories);
      
    if (error) {
      console.error('Error adding categories:', error);
    } else {
      console.log('Categories added successfully');
    }
    
  } catch (error) {
    console.error('Error in addSampleCategories:', error);
  }
}

// Görüntü verilerini ekle
async function addSampleImages() {
  try {
    // Önce mevcut görüntüleri kontrol et
    const { data: existingImages } = await supabase
      .from('images')
      .select('title');
    
    if (existingImages && existingImages.length > 0) {
      console.log('Images already exist. Skipping insertion.');
      return;
    }
    
    // Kategori ID'lerini al
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name');
      
    if (!categories || categories.length === 0) {
      console.error('No categories found. Please add categories first.');
      return;
    }
    
    // Kategori ID'lerini eşleştir
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    // Örnek görüntü verileri
    const images = [
      {
        title: 'Ferrari 458',
        image_url: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500',
        category_id: categoryMap['Arabalar'] || 1,
        answers: ['Ferrari', 'Ferrari 458', '458 Italia'],
        difficulty: 2,
        play_count: 120,
        like_count: 45,
        active: true
      },
      {
        title: 'İstanbul Boğazı',
        image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=500',
        category_id: categoryMap['Coğrafya'] || 4,
        answers: ['İstanbul', 'Istanbul', 'Boğaz', 'Bogazici', 'Bosphorus'],
        difficulty: 1,
        play_count: 200,
        like_count: 78,
        active: true
      },
      {
        title: 'Star Wars - Darth Vader',
        image_url: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=500',
        category_id: categoryMap['Filmler'] || 2,
        answers: ['Star Wars', 'Darth Vader', 'Vader'],
        difficulty: 2,
        play_count: 180,
        like_count: 95,
        active: true
      },
      {
        title: 'Mona Lisa',
        image_url: 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=500',
        category_id: categoryMap['Sanat'] || 3,
        answers: ['Mona Lisa', 'Leonardo da Vinci', 'da Vinci'],
        difficulty: 1,
        play_count: 150,
        like_count: 67,
        active: true
      },
      {
        title: 'Minecraft',
        image_url: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=500',
        category_id: categoryMap['Oyunlar'] || 5,
        answers: ['Minecraft', 'Mine Craft'],
        difficulty: 1,
        play_count: 250,
        like_count: 120,
        active: true
      }
    ];
    
    // Verileri ekle
    const { data, error } = await supabase
      .from('images')
      .insert(images);
      
    if (error) {
      console.error('Error adding images:', error);
    } else {
      console.log('Images added successfully');
    }
    
  } catch (error) {
    console.error('Error in addSampleImages:', error);
  }
}

// Test verilerini ekle
async function addSampleTests() {
  try {
    // Önce mevcut testleri kontrol et
    const { data: existingTests } = await supabase
      .from('tests')
      .select('title');
    
    if (existingTests && existingTests.length > 0) {
      console.log('Tests already exist. Skipping insertion.');
      return;
    }
    
    // Görüntü ID'lerini al
    const { data: images } = await supabase
      .from('images')
      .select('id, title');
      
    if (!images || images.length === 0) {
      console.error('No images found. Please add images first.');
      return;
    }
    
    // Görüntü ID'lerini eşleştir
    const imageMap = {};
    images.forEach(img => {
      imageMap[img.title] = img.id;
    });
    
    // Örnek test verileri
    const tests = [
      {
        uuid: '2f1e1193-cbff-44e6-a130-342655f34685',
        title: 'Arabalar Testi',
        description: 'Otomobil markaları ve modelleri hakkında bilginizi test edin',
        image_ids: [imageMap['Ferrari 458']],
        play_count: 50,
        like_count: 21,
        is_public: true,
        approved: true,
        featured: true,
        difficulty: 2,
        thumbnail: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500'
      },
      {
        uuid: 'b4f72c20-8139-4159-b5da-5175eece79a8',
        title: 'Film Karakterleri',
        description: 'Popüler film karakterlerini ne kadar iyi tanıyorsunuz?',
        image_ids: [imageMap['Star Wars - Darth Vader']],
        play_count: 75,
        like_count: 35,
        is_public: true,
        approved: true,
        featured: true,
        difficulty: 2,
        thumbnail: 'https://images.unsplash.com/photo-1608889175638-9322300c87e8?w=500'
      },
      {
        uuid: 'a1ae1b89-7cac-47f9-8c9d-5affb50d87af',
        title: 'Sanat Eserleri',
        description: 'Ünlü sanat eserleri ve sanatçılar hakkında bilginizi test edin',
        image_ids: [imageMap['Mona Lisa']],
        play_count: 40,
        like_count: 15,
        is_public: true,
        approved: true,
        featured: true,
        difficulty: 1,
        thumbnail: 'https://images.unsplash.com/photo-1423742774270-6884aac775fa?w=500'
      }
    ];
    
    // Verileri ekle
    const { data, error } = await supabase
      .from('tests')
      .insert(tests);
      
    if (error) {
      console.error('Error adding tests:', error);
    } else {
      console.log('Tests added successfully');
    }
    
  } catch (error) {
    console.error('Error in addSampleTests:', error);
  }
}

// Ana fonksiyon
async function main() {
  try {
    // Örnek verileri ekle
    await addSampleCategories();
    await addSampleImages();
    await addSampleTests();
    
    console.log('All sample data has been added successfully.');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Script'i çalıştır
main();