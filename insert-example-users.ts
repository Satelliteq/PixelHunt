import { supabaseStorage } from './server/supabase-storage';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

/**
 * Bu betik, örnek kullanıcıları veritabanına ekler
 */
async function addExampleUsers() {
  try {
    // Farklı rollerde örnek kullanıcılar
    const usersData = [
      {
        username: "admin",
        email: "admin@testify.com",
        password_hash: await bcrypt.hash("admin123", 10),
        role: "admin",
        score: 1000,
        profile_image_url: "https://i.pravatar.cc/150?u=admin",
        banned: false
      },
      {
        username: "testuser",
        email: "user@testify.com",
        password_hash: await bcrypt.hash("user123", 10),
        role: "user",
        score: 250,
        profile_image_url: "https://i.pravatar.cc/150?u=testuser",
        banned: false
      },
      {
        username: "moderator",
        email: "mod@testify.com",
        password_hash: await bcrypt.hash("mod123", 10),
        role: "moderator",
        score: 500,
        profile_image_url: "https://i.pravatar.cc/150?u=moderator",
        banned: false
      }
    ];

    console.log('Örnek kullanıcı verileri ekleniyor...');
    
    for (const userData of usersData) {
      const user = await supabaseStorage.createUser(userData);
      console.log(`Kullanıcı eklendi: ${user.username} (ID: ${user.id})`);
    }

    console.log('Tüm örnek kullanıcı verileri başarıyla eklendi.');
  } catch (error) {
    console.error('Kullanıcı eklenirken hata oluştu:', error);
  }
}

async function main() {
  try {
    await addExampleUsers();
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

main();