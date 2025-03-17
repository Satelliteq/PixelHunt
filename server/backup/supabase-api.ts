import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Supabase istemcisini oluştur
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Supabase tablolarını oluştur
 * Bu fonksiyon projenin ilk başlatılması sırasında tabloların varlığını kontrol eder
 * ve gerekirse yeni tablolar oluşturur.
 */
export async function initializeSupabaseTables() {
  console.log('Initializing Supabase tables...');
  
  try {
    // Tests tablosunu oluştur
    const { error: testsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'tests',
      table_definition: `
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        uuid TEXT NOT NULL UNIQUE,
        category_id INTEGER,
        creator_id INTEGER,
        image_ids JSONB DEFAULT '[]',
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_public BOOLEAN DEFAULT TRUE,
        anonymous_creator BOOLEAN DEFAULT FALSE,
        thumbnail TEXT,
        approved BOOLEAN DEFAULT FALSE,
        published BOOLEAN DEFAULT FALSE,
        difficulty INTEGER DEFAULT 1
      `
    });
    
    if (testsError) {
      console.error('Error creating tests table:', testsError);
    } else {
      console.log('Tests table created or already exists');
    }
    
    // Test sorularını oluştur
    const { error: questionsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'test_questions',
      table_definition: `
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        answers JSONB NOT NULL,
        order_num INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    
    if (questionsError) {
      console.error('Error creating test_questions table:', questionsError);
    } else {
      console.log('Test_questions table created or already exists');
    }
    
    // Test yorumları oluştur
    const { error: commentsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'test_comments',
      table_definition: `
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        user_id INTEGER,
        comment TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    
    if (commentsError) {
      console.error('Error creating test_comments table:', commentsError);
    } else {
      console.log('Test_comments table created or already exists');
    }
    
    // Oyun skorları oluştur
    const { error: scoresError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'game_scores',
      table_definition: `
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        test_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        attempts_count INTEGER NOT NULL,
        completion_time INTEGER,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    
    if (scoresError) {
      console.error('Error creating game_scores table:', scoresError);
    } else {
      console.log('Game_scores table created or already exists');
    }
    
    // Kategoriler oluştur
    const { error: categoriesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'categories',
      table_definition: `
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon_url TEXT
      `
    });
    
    if (categoriesError) {
      console.error('Error creating categories table:', categoriesError);
    } else {
      console.log('Categories table created or already exists');
    }
    
    // Resimler tablosu oluştur
    const { error: imagesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'images',
      table_definition: `
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        category_id INTEGER,
        answers JSONB NOT NULL,
        play_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        difficulty INTEGER DEFAULT 1
      `
    });
    
    if (imagesError) {
      console.error('Error creating images table:', imagesError);
    } else {
      console.log('Images table created or already exists');
    }
    
    console.log('Table initialization completed');
    return true;
  } catch (error) {
    console.error('Error during table initialization:', error);
    return false;
  }
}

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
    
    // Snake_case formatına çevir
    const snakeCaseTest = {
      title: testInfo.title,
      uuid,
      description: testInfo.description,
      category_id: testInfo.categoryId,
      creator_id: testInfo.creatorId,
      image_ids: testInfo.imageIds || [],
      created_at: new Date().toISOString(),
      play_count: 0,
      like_count: 0,
      is_public: testInfo.isPublic,
      anonymous_creator: testInfo.anonymousCreator,
      thumbnail: testInfo.thumbnail,
      approved: true, // Varsayılan olarak onaylı olsun
      published: true, // Varsayılan olarak yayınlı olsun
      difficulty: testInfo.difficulty
    };
    
    // Testimizi oluştur
    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert([snakeCaseTest])
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
    // Debug log added to check Supabase URLs
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase API fetching tests from:', `${supabaseUrl}/rest/v1/tests`);
    
    // Try a simpler query first
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .limit(limit);
    
    if (error) {
      console.error('Error fetching popular tests:', error);
      
      // If we get an error, attempt a raw SQL query through Supabase
      try {
        const { data: sqlData, error: sqlError } = await supabase
          .rpc('get_popular_tests', { limit_param: limit });
        
        if (sqlError) {
          console.error('Error executing RPC for popular tests:', sqlError);
          
          // Last resort: try to execute a direct SQL query
          const { data: directData, error: directError } = await supabase
            .from('tests_view') // Using view name just in case
            .select('*')
            .limit(limit);
          
          if (directError) {
            console.error('All methods failed to fetch tests:', directError);
            return [];
          }
          
          console.log('Got tests via direct query:', directData?.length || 0);
          return formatTestResults(directData);
        }
        
        console.log('Got tests via RPC:', sqlData?.length || 0);
        return formatTestResults(sqlData);
      } catch (innerError) {
        console.error('Error in fallback queries:', innerError);
        return [];
      }
    }
    
    console.log('Got tests via regular query:', data?.length || 0);
    return formatTestResults(data);
  } catch (error) {
    console.error('Error in getPopularTests:', error);
    return [];
  }
}

// Helper function to format test results
function formatTestResults(data: any[] | null) {
  return (data || []).map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    uuid: item.uuid,
    categoryId: item.category_id,
    creatorId: item.creator_id,
    imageIds: item.image_ids,
    playCount: item.play_count,
    likeCount: item.like_count,
    createdAt: item.created_at,
    isPublic: item.is_public,
    anonymousCreator: item.anonymous_creator,
    thumbnail: item.thumbnail,
    approved: item.approved,
    published: item.published,
    difficulty: item.difficulty
  }));
}

/**
 * En yeni testleri getir
 */
export async function getNewestTests(limit: number = 10) {
  try {
    // Try to use RPC function first
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_newest_tests', { limit_param: limit });
      
      if (!rpcError && rpcData) {
        console.log('Got newest tests via RPC:', rpcData.length);
        return formatTestResults(rpcData);
      }
    } catch (rpcErr) {
      console.error('RPC error in getNewestTests:', rpcErr);
      // Continue to fallback
    }
    
    // Fallback to regular query
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('published', true)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching newest tests:', error);
      return [];
    }
    
    console.log('Got newest tests via regular query:', data?.length || 0);
    return formatTestResults(data);
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
      .select('like_count')
      .eq('id', id)
      .single();
    
    if (getError || !existingTest) {
      console.error('Error fetching test for like increment:', getError);
      return false;
    }
    
    // Beğeni sayısını artır
    const currentLikeCount = existingTest.like_count || 0;
    
    const { error: updateError } = await supabase
      .from('tests')
      .update({ like_count: currentLikeCount + 1 })
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
      .select('play_count')
      .eq('id', id)
      .single();
    
    if (getError || !existingTest) {
      console.error('Error fetching test for play increment:', getError);
      return false;
    }
    
    // Oynanma sayısını artır
    const currentPlayCount = existingTest.play_count || 0;
    
    const { error: updateError } = await supabase
      .from('tests')
      .update({ play_count: currentPlayCount + 1 })
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