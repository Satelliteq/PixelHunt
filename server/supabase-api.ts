import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Supabase istemcisini oluştur
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test oluşturma fonksiyonu
 * Bu fonksiyon test verilerini ve ilgili soruları Supabase'e kaydeder
 */
export async function createTest(testData: any) {
  try {
    console.log('Creating test with data:', JSON.stringify(testData, null, 2));
    
    // Test verilerini hazırla
    const { images, ...testInfo } = testData;
    const uuid = uuidv4();
    
    // Testimizi oluştur
    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert([{
        ...testInfo,
        uuid,
        createdAt: new Date().toISOString(),
        playCount: 0,
        likeCount: 0,
        approved: true, // Varsayılan olarak onaylı olsun
        published: true // Varsayılan olarak yayınlı olsun
      }])
      .select()
      .single();
    
    if (testError) {
      console.error('Error creating test:', testError);
      throw new Error('Test oluşturulurken bir hata oluştu');
    }
    
    // Test soruları için kayıt oluştur
    if (images && Array.isArray(images) && images.length > 0) {
      const testQuestions = images.map((img: any, index: number) => ({
        testId: test.id,
        imageUrl: img.imageUrl,
        answers: img.answers,
        order: index,
        createdAt: new Date().toISOString()
      }));
      
      const { error: questionsError } = await supabase
        .from('test_questions')
        .insert(testQuestions);
      
      if (questionsError) {
        console.error('Error saving test questions:', questionsError);
        // Test başarıyla oluşturuldu ancak sorularda hata var
        // Ana kayıt olduğu için tam hata vermiyoruz
      }
    }
    
    return test;
  } catch (error) {
    console.error('Error in createTest:', error);
    throw error;
  }
}

/**
 * Test sorgulama fonksiyonu
 * Bu fonksiyon bir testi ve ilgili sorularını Supabase'den alır
 */
export async function getTestById(id: number) {
  try {
    // Testi getir
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (testError || !test) {
      console.error('Error fetching test:', testError);
      return null;
    }
    
    // Test sorularını getir
    const { data: questions, error: questionsError } = await supabase
      .from('test_questions')
      .select('*')
      .eq('testId', id)
      .order('order', { ascending: true });
    
    if (questionsError) {
      console.error('Error fetching test questions:', questionsError);
      // Soruları alamadık ama en azından testi döndürelim
      return test;
    }
    
    // Testi ve sorularını birleştirip döndür
    return {
      ...test,
      questions: questions || []
    };
  } catch (error) {
    console.error('Error in getTestById:', error);
    return null;
  }
}

/**
 * Test arama fonksiyonu
 * Bu fonksiyon filtrelere göre testleri Supabase'den alır
 */
export async function searchTests(options: {
  categoryId?: number,
  query?: string,
  limit?: number,
  orderBy?: string,
  orderDirection?: 'asc' | 'desc'
}) {
  try {
    let query = supabase
      .from('tests')
      .select('*')
      .eq('published', true);
    
    // Kategori filtrelemesi
    if (options.categoryId) {
      query = query.eq('categoryId', options.categoryId);
    }
    
    // Metin araması (başlık içinde)
    if (options.query) {
      query = query.ilike('title', `%${options.query}%`);
    }
    
    // Sıralama
    const orderBy = options.orderBy || 'createdAt';
    const orderDirection = options.orderDirection || 'desc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });
    
    // Limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error searching tests:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in searchTests:', error);
    return [];
  }
}

/**
 * Popüler testleri getir
 */
export async function getPopularTests(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('published', true)
      .eq('approved', true)
      .order('playCount', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching popular tests:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getPopularTests:', error);
    return [];
  }
}

/**
 * En yeni testleri getir
 */
export async function getNewestTests(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('published', true)
      .eq('approved', true)
      .order('createdAt', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching newest tests:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getNewestTests:', error);
    return [];
  }
}

/**
 * Kategorileri getir
 */
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getCategories:', error);
    return [];
  }
}

/**
 * Test puanı kaydet
 */
export async function saveGameScore(scoreData: {
  userId: number | null;
  testId: number;
  score: number;
  attemptsCount: number;
  completionTime: number | null;
  completed: boolean;
}) {
  try {
    const { data, error } = await supabase
      .from('game_scores')
      .insert([{
        ...scoreData,
        createdAt: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving game score:', error);
      throw new Error('Puan kaydedilirken bir hata oluştu');
    }
    
    return data;
  } catch (error) {
    console.error('Error in saveGameScore:', error);
    throw error;
  }
}

/**
 * Test beğeni sayısını artır
 */
export async function incrementTestLikeCount(id: number) {
  try {
    // Mevcut beğeni sayısını al
    const { data: existingTest, error: getError } = await supabase
      .from('tests')
      .select('likeCount')
      .eq('id', id)
      .single();
    
    if (getError || !existingTest) {
      console.error('Error fetching test for like increment:', getError);
      return false;
    }
    
    // Beğeni sayısını artır
    const currentLikeCount = existingTest.likeCount || 0;
    
    const { error: updateError } = await supabase
      .from('tests')
      .update({ likeCount: currentLikeCount + 1 })
      .eq('id', id);
    
    if (updateError) {
      console.error('Error incrementing test like count:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in incrementTestLikeCount:', error);
    return false;
  }
}

/**
 * Test oynanma sayısını artır
 */
export async function incrementTestPlayCount(id: number) {
  try {
    // Mevcut oynanma sayısını al
    const { data: existingTest, error: getError } = await supabase
      .from('tests')
      .select('playCount')
      .eq('id', id)
      .single();
    
    if (getError || !existingTest) {
      console.error('Error fetching test for play increment:', getError);
      return false;
    }
    
    // Oynanma sayısını artır
    const currentPlayCount = existingTest.playCount || 0;
    
    const { error: updateError } = await supabase
      .from('tests')
      .update({ playCount: currentPlayCount + 1 })
      .eq('id', id);
    
    if (updateError) {
      console.error('Error incrementing test play count:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in incrementTestPlayCount:', error);
    return false;
  }
}