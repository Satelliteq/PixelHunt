import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Bu betik, tüm örnek verileri eklemek için diğer betikleri sırayla çalıştırır
 */
async function setupAllExamples() {
  try {
    console.log("🚀 Tüm örnek veriler yükleniyor...");
    
    // 1. Önce kategorileri oluştur
    console.log("\n📁 Örnek kategoriler ekleniyor...");
    await execAsync('npx tsx insert-example-categories.ts');
    
    // 2. Kullanıcıları ekle
    console.log("\n👤 Örnek kullanıcılar ekleniyor...");
    await execAsync('npx tsx insert-example-users.ts');
    
    // 3. Resimleri ekle
    console.log("\n🖼️ Örnek resimler ekleniyor...");
    await execAsync('npx tsx insert-example-images.ts');
    
    // 4. Testleri ekle
    console.log("\n🧪 Örnek testler ekleniyor...");
    await execAsync('npx tsx insert-example-tests.ts');
    
    console.log("\n✅ Tüm örnek veriler başarıyla yüklendi!");
  } catch (error) {
    console.error("❌ Örnek veriler yüklenirken hata oluştu:", error);
  }
}

// Çalıştır
setupAllExamples();