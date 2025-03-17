import { supabase } from './supabase-setup';
import { categories, type Category, type InsertCategory, tests, Test, gameModesEnum } from '../shared/schema';
import { getNewestTests as directGetNewestTests, 
         getPopularTests as directGetPopularTests, 
         getFeaturedTests as directGetFeaturedTests } from './direct-db';

/**
 * Supabase API uzerinden dogrudan islem yapmak icin yardimci fonksiyonlar
 * Bu fonksiyonlar direct-db.ts'nin Supabase versiyonu olarak dusunulebilir
 */

/**
 * Veritabanından doğrudan SQL sorgusu çalıştıran yardımcı fonksiyon
 */
async function executeRawSql<T>(sqlQuery: string): Promise<T[]> {
  try {
    // Try to use the PostgreSQL connection directly
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    const result = await pool.query(sqlQuery);
    await pool.end();
    
    if (result && result.rows) {
      return result.rows as T[];
    }
    
    return [];
  } catch (directError) {
    console.error('Doğrudan SQL sorgusu çalıştırma hatası:', directError);
    return [];
  }
}

/**
 * Tum kategorileri getir
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    // First try with the Supabase API
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    
    if (!error && data && data.length > 0) {
      console.log('Supabase API ile kategoriler alındı, sayı:', data.length);
      return data.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        iconUrl: category.icon_url
      }));
    }
    
    if (error) {
      console.error('Supabase ile kategori getirme hatası:', error);
    }
    
    // Fallback to direct SQL
    console.log('Doğrudan SQL sorgusu ile kategoriler alınıyor...');
    const categories = await executeRawSql<any>('SELECT * FROM categories');
    
    if (categories.length > 0) {
      console.log('SQL ile kategoriler alındı, sayı:', categories.length);
      return categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        iconUrl: category.icon_url
      }));
    }
    
    console.log('Kategori bulunamadı.');
    return [];
  } catch (error) {
    console.error('Kategori getirme işleminde beklenmeyen hata:', error);
    return [];
  }
}

/**
 * Belirli bir kategori getir
 */
export async function getCategoryById(id: number): Promise<Category | null> {
  try {
    // First try with Supabase API
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!error && data) {
      console.log(`ID ${id} olan kategori Supabase API ile bulundu`);
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        iconUrl: data.icon_url
      };
    }
    
    if (error) {
      console.error(`ID ${id} olan kategori getirme hatası:`, error);
    }
    
    // Fallback to direct SQL
    console.log(`ID ${id} olan kategori doğrudan SQL ile aranıyor...`);
    const categories = await executeRawSql<any>(`SELECT * FROM categories WHERE id = ${id}`);
    
    if (categories.length > 0) {
      console.log(`ID ${id} olan kategori SQL ile bulundu`);
      return {
        id: categories[0].id,
        name: categories[0].name,
        description: categories[0].description,
        iconUrl: categories[0].icon_url
      };
    }
    
    console.log(`ID ${id} olan kategori bulunamadı`);
    return null;
  } catch (error) {
    console.error(`ID ${id} olan kategori getirmede beklenmeyen hata:`, error);
    return null;
  }
}

/**
 * Yeni kategori olustur
 */
export async function createCategory(category: InsertCategory): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        description: category.description || null,
        icon_url: category.iconUrl || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Kategori olusturma hatasi:', error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      iconUrl: data.icon_url
    };
  } catch (error) {
    console.error('Kategori olusturmada beklenmeyen hata:', error);
    return null;
  }
}

/**
 * Kategori guncelle
 */
export async function updateCategory(id: number, category: InsertCategory): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: category.name,
        description: category.description || null,
        icon_url: category.iconUrl || null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`ID ${id} olan kategori guncelleme hatasi:`, error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      iconUrl: data.icon_url
    };
  } catch (error) {
    console.error(`ID ${id} olan kategori guncellemede beklenmeyen hata:`, error);
    return null;
  }
}

/**
 * En popüler testleri getir
 */
export async function getPopularTests(limit: number = 10): Promise<Test[]> {
  try {
    console.log('Popüler testler alınıyor, limit:', limit);
    
    // Try Supabase RPC function first
    const { data, error } = await supabase.rpc('get_popular_tests', {
      limit_param: limit
    });
    
    if (!error && data && data.length > 0) {
      console.log('Supabase RPC ile popüler testler alındı, sayı:', data.length);
      return data.map((test: any) => ({
        id: test.id,
        title: test.title,
        description: test.description,
        uuid: test.uuid,
        categoryId: test.category_id,
        creatorId: test.creator_id,
        imageIds: test.image_ids,
        playCount: test.play_count,
        likeCount: test.like_count,
        createdAt: test.created_at,
        isPublic: test.is_public,
        anonymousCreator: test.anonymous_creator,
        thumbnail: test.thumbnail,
        approved: test.approved,
        published: test.published,
        difficulty: test.difficulty
      }));
    }
    
    if (error) {
      console.error('RPC popüler testleri getirme hatası:', error);
    }
    
    // Try direct Supabase query
    const { data: testsData, error: testsError } = await supabase
      .from('tests')
      .select('*')
      .eq('published', true)
      .eq('approved', true)
      .order('play_count', { ascending: false })
      .limit(limit);
    
    if (!testsError && testsData && testsData.length > 0) {
      console.log('Supabase sorgusu ile popüler testler alındı, sayı:', testsData.length);
      return testsData.map(test => ({
        id: test.id,
        title: test.title,
        description: test.description,
        uuid: test.uuid,
        categoryId: test.category_id,
        creatorId: test.creator_id,
        imageIds: test.image_ids,
        playCount: test.play_count,
        likeCount: test.like_count,
        createdAt: test.created_at,
        isPublic: test.is_public,
        anonymousCreator: test.anonymous_creator,
        thumbnail: test.thumbnail,
        approved: test.approved,
        published: test.published,
        difficulty: test.difficulty
      }));
    }
    
    if (testsError) {
      console.error('Supabase popüler testleri getirme hatası:', testsError);
    }
    
    // Try view table if it exists
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('popular_tests')
        .select('*')
        .limit(limit);
      
      if (!viewError && viewData && viewData.length > 0) {
        console.log('Supabase popular_tests view ile testler alındı, sayı:', viewData.length);
        return viewData.map((test: any) => ({
          id: test.id,
          title: test.title,
          description: test.description,
          uuid: test.uuid,
          categoryId: test.category_id,
          creatorId: test.creator_id,
          imageIds: test.image_ids,
          playCount: test.play_count,
          likeCount: test.like_count,
          createdAt: test.created_at,
          isPublic: test.is_public,
          anonymousCreator: test.anonymous_creator,
          thumbnail: test.thumbnail,
          approved: test.approved,
          published: test.published,
          difficulty: test.difficulty
        }));
      }
    } catch (viewErr) {
      console.error('Popular_tests view sorgusu hatası:', viewErr);
    }
    
    // Fallback to direct SQL
    console.log('Doğrudan SQL ile popüler testler alınıyor...');
    try {
      // Use the directGetPopularTests function
      const directTests = await directGetPopularTests(limit);
      if (directTests.length > 0) {
        console.log('Direct DB ile popüler testler alındı, sayı:', directTests.length);
        return directTests.map(test => ({
          id: test.id,
          title: test.title,
          description: test.description || null,
          uuid: test.uuid,
          categoryId: test.categoryId,
          creatorId: test.creatorId,
          imageIds: test.imageIds,
          playCount: test.playCount,
          likeCount: test.likeCount,
          createdAt: test.createdAt,
          isPublic: test.isPublic,
          anonymousCreator: test.anonymousCreator,
          thumbnail: test.thumbnail,
          approved: test.approved,
          published: test.published,
          difficulty: test.difficulty
        }));
      }
    } catch (directError) {
      console.error('Direct DB popüler testleri getirme hatası:', directError);
    }
    
    // All methods failed
    console.error('Tüm yöntemler başarısız oldu, popüler testler alınamadı.');
    return [];
  } catch (error) {
    console.error('Popüler testleri getirmede beklenmeyen hata:', error);
    return [];
  }
}

/**
 * En yeni testleri getir
 */
export async function getNewestTests(limit: number = 10): Promise<Test[]> {
  try {
    console.log('En yeni testler alınıyor, limit:', limit);
    
    // Try Supabase RPC function first
    const { data, error } = await supabase.rpc('get_newest_tests', {
      limit_param: limit
    });
    
    if (!error && data && data.length > 0) {
      console.log('Supabase RPC ile en yeni testler alındı, sayı:', data.length);
      return data.map((test: any) => ({
        id: test.id,
        title: test.title,
        description: test.description,
        uuid: test.uuid,
        categoryId: test.category_id,
        creatorId: test.creator_id,
        imageIds: test.image_ids,
        playCount: test.play_count,
        likeCount: test.like_count,
        createdAt: test.created_at,
        isPublic: test.is_public,
        anonymousCreator: test.anonymous_creator,
        thumbnail: test.thumbnail,
        approved: test.approved,
        published: test.published,
        difficulty: test.difficulty
      }));
    }
    
    if (error) {
      console.error('RPC en yeni testleri getirme hatası:', error);
    }
    
    // Try direct Supabase query
    const { data: testsData, error: testsError } = await supabase
      .from('tests')
      .select('*')
      .eq('published', true)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (!testsError && testsData && testsData.length > 0) {
      console.log('Supabase sorgusu ile en yeni testler alındı, sayı:', testsData.length);
      return testsData.map(test => ({
        id: test.id,
        title: test.title,
        description: test.description,
        uuid: test.uuid,
        categoryId: test.category_id,
        creatorId: test.creator_id,
        imageIds: test.image_ids,
        playCount: test.play_count,
        likeCount: test.like_count,
        createdAt: test.created_at,
        isPublic: test.is_public,
        anonymousCreator: test.anonymous_creator,
        thumbnail: test.thumbnail,
        approved: test.approved,
        published: test.published,
        difficulty: test.difficulty
      }));
    }
    
    if (testsError) {
      console.error('Supabase en yeni testleri getirme hatası:', testsError);
    }
    
    // Try view table if it exists
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('newest_tests')
        .select('*')
        .limit(limit);
      
      if (!viewError && viewData && viewData.length > 0) {
        console.log('Supabase newest_tests view ile testler alındı, sayı:', viewData.length);
        return viewData.map((test: any) => ({
          id: test.id,
          title: test.title,
          description: test.description,
          uuid: test.uuid,
          categoryId: test.category_id,
          creatorId: test.creator_id,
          imageIds: test.image_ids,
          playCount: test.play_count,
          likeCount: test.like_count,
          createdAt: test.created_at,
          isPublic: test.is_public,
          anonymousCreator: test.anonymous_creator,
          thumbnail: test.thumbnail,
          approved: test.approved,
          published: test.published,
          difficulty: test.difficulty
        }));
      }
    } catch (viewErr) {
      console.error('Newest_tests view sorgusu hatası:', viewErr);
    }
    
    // Fallback to direct SQL
    console.log('Doğrudan SQL ile en yeni testler alınıyor...');
    try {
      // Use the directGetNewestTests function
      const directTests = await directGetNewestTests(limit);
      if (directTests.length > 0) {
        console.log('Direct DB ile en yeni testler alındı, sayı:', directTests.length);
        return directTests.map(test => ({
          id: test.id,
          title: test.title,
          description: test.description || null,
          uuid: test.uuid,
          categoryId: test.categoryId,
          creatorId: test.creatorId,
          imageIds: test.imageIds,
          playCount: test.playCount,
          likeCount: test.likeCount,
          createdAt: test.createdAt,
          isPublic: test.isPublic,
          anonymousCreator: test.anonymousCreator,
          thumbnail: test.thumbnail,
          approved: test.approved,
          published: test.published,
          difficulty: test.difficulty
        }));
      }
    } catch (directError) {
      console.error('Direct DB en yeni testleri getirme hatası:', directError);
    }
    
    // All methods failed
    console.error('Tüm yöntemler başarısız oldu, en yeni testler alınamadı.');
    return [];
  } catch (error) {
    console.error('En yeni testleri getirmede beklenmeyen hata:', error);
    return [];
  }
}

/**
 * Öne çıkan testleri getir
 */
export async function getFeaturedTests(limit: number = 10): Promise<Test[]> {
  try {
    console.log('Öne çıkan testler alınıyor, limit:', limit);
    
    // Try direct Supabase query first - featured typically combines popularity and recency
    const { data: testsData, error: testsError } = await supabase
      .from('tests')
      .select('*')
      .eq('published', true)
      .eq('approved', true)
      .order('play_count', { ascending: false })
      .order('like_count', { ascending: false })
      .limit(limit);
    
    if (!testsError && testsData && testsData.length > 0) {
      console.log('Supabase sorgusu ile öne çıkan testler alındı, sayı:', testsData.length);
      return testsData.map(test => ({
        id: test.id,
        title: test.title,
        description: test.description,
        uuid: test.uuid,
        categoryId: test.category_id,
        creatorId: test.creator_id,
        imageIds: test.image_ids,
        playCount: test.play_count,
        likeCount: test.like_count,
        createdAt: test.created_at,
        isPublic: test.is_public,
        anonymousCreator: test.anonymous_creator,
        thumbnail: test.thumbnail,
        approved: test.approved,
        published: test.published,
        difficulty: test.difficulty
      }));
    }
    
    if (testsError) {
      console.error('Supabase öne çıkan testleri getirme hatası:', testsError);
    }
    
    // Try view table if it exists
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('featured_tests')
        .select('*')
        .limit(limit);
      
      if (!viewError && viewData && viewData.length > 0) {
        console.log('Supabase featured_tests view ile testler alındı, sayı:', viewData.length);
        return viewData.map((test: any) => ({
          id: test.id,
          title: test.title,
          description: test.description,
          uuid: test.uuid,
          categoryId: test.category_id,
          creatorId: test.creator_id,
          imageIds: test.image_ids,
          playCount: test.play_count,
          likeCount: test.like_count,
          createdAt: test.created_at,
          isPublic: test.is_public,
          anonymousCreator: test.anonymous_creator,
          thumbnail: test.thumbnail,
          approved: test.approved,
          published: test.published,
          difficulty: test.difficulty
        }));
      }
    } catch (viewErr) {
      console.error('Featured_tests view sorgusu hatası:', viewErr);
    }
    
    // Fallback to direct SQL
    console.log('Doğrudan SQL ile öne çıkan testler alınıyor...');
    try {
      // Use the directGetFeaturedTests function
      const directTests = await directGetFeaturedTests(limit);
      if (directTests.length > 0) {
        console.log('Direct DB ile öne çıkan testler alındı, sayı:', directTests.length);
        return directTests.map(test => ({
          id: test.id,
          title: test.title,
          description: test.description || null,
          uuid: test.uuid,
          categoryId: test.categoryId,
          creatorId: test.creatorId,
          imageIds: test.imageIds,
          playCount: test.playCount,
          likeCount: test.likeCount,
          createdAt: test.createdAt,
          isPublic: test.isPublic,
          anonymousCreator: test.anonymousCreator,
          thumbnail: test.thumbnail,
          approved: test.approved,
          published: test.published,
          difficulty: test.difficulty
        }));
      }
    } catch (directError) {
      console.error('Direct DB öne çıkan testleri getirme hatası:', directError);
    }
    
    // All methods failed
    console.error('Tüm yöntemler başarısız oldu, öne çıkan testler alınamadı.');
    return [];
  } catch (error) {
    console.error('Öne çıkan testleri getirmede beklenmeyen hata:', error);
    return [];
  }
}