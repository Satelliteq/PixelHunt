import { execSync } from 'child_process';

/**
 * Bu betik, tüm örnek verileri eklemek için diğer betikleri sırayla çalıştırır
 */
async function setupAllExamples() {
  try {
    console.log('Örnek verileri yükleme işlemi başlatılıyor...');
    
    // 1. Önce kullanıcıları yükle
    console.log('\n1. Örnek kullanıcılar yükleniyor...');
    execSync('npx tsx insert-example-users.ts', { stdio: 'inherit' });
    
    // 2. Kategorileri yükle
    console.log('\n2. Örnek kategoriler yükleniyor...');
    execSync('npx tsx insert-example-categories.ts', { stdio: 'inherit' });
    
    // 3. Görselleri yükle
    console.log('\n3. Örnek görseller yükleniyor...');
    execSync('npx tsx insert-example-images.ts', { stdio: 'inherit' });
    
    // 4. Testleri yükle
    console.log('\n4. Örnek testler yükleniyor...');
    execSync('npx tsx insert-example-tests.ts', { stdio: 'inherit' });
    
    console.log('\nTüm örnek veriler başarıyla yüklendi!');
  } catch (error) {
    console.error('Örnek veriler yüklenirken hata oluştu:', error);
  }
}

setupAllExamples();