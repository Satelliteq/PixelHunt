import { supabaseStorage } from './server/supabase-storage';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

/**
 * Bu betik, örnek test görsellerini veritabanına ekler
 */
async function addExampleImages() {
  try {
    // Eğer görsel dosyaları attached_assets klasöründeyse
    const imagesData = [
      {
        title: "Nintendo Switch Oyun Kartları",
        image_url: "/attached_assets/ba1f50f644077acc8bedb8b0634c1af8.jpg",
        storage_key: "ba1f50f644077acc8bedb8b0634c1af8.jpg",
        category_id: 5, // Oyunlar kategorisi
        answers: ["nintendo switch", "switch", "nintendo", "oyun", "konsol", "video oyunu"],
        hints: ["Bir oyun konsoludur", "Nintendo tarafından üretilir", "Taşınabilir bir cihazdır"],
        difficulty: 2,
        active: true,
        created_by: 1
      },
      {
        title: "Robin & Cleopatra Oyunu",
        image_url: "/attached_assets/86b4065a7c34a1c78de57b71078b4f5b.jpg",
        storage_key: "86b4065a7c34a1c78de57b71078b4f5b.jpg",
        category_id: 5, // Oyunlar kategorisi
        answers: ["oyun", "video oyunu", "kumar", "slot", "casino", "bahis"],
        hints: ["Şans oyunudur", "Çevrimiçi oynanır", "Para ile oynanabilir"],
        difficulty: 3,
        active: true,
        created_by: 1
      },
      {
        title: "Dövüş Oyun Koleksiyonu",
        image_url: "/attached_assets/6c161a984b072640f8d7cde4b759f0a8.jpg", 
        storage_key: "6c161a984b072640f8d7cde4b759f0a8.jpg",
        category_id: 5, // Oyunlar kategorisi
        answers: ["oyun", "video oyunu", "kumar", "slot", "casino", "bahis"],
        hints: ["Şans oyunlarıdır", "Çevrimiçi oynanır", "Para kazanma amaçlıdır"],
        difficulty: 3,
        active: true,
        created_by: 1
      }
    ];

    console.log('Örnek görsel verileri ekleniyor...');
    
    for (const imageData of imagesData) {
      const image = await supabaseStorage.createImage(imageData);
      console.log(`Görsel eklendi: ${image.title} (ID: ${image.id})`);
    }

    console.log('Tüm örnek görsel verileri başarıyla eklendi.');
  } catch (error) {
    console.error('Görsel eklenirken hata oluştu:', error);
  }
}

async function main() {
  try {
    await addExampleImages();
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

main();