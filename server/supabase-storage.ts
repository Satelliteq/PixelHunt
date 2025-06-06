import { IStorage } from './storage';
import { supabase, recordUserActivity, storage } from './supabase';
import { createId } from '@paralleldrive/cuid2';

// Tipler için interfaceler (Drizzle ORM yerine doğrudan Supabase tiplerini kullanacağız)
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  role: string;
  score: number;
  profile_image_url?: string;
  banned: boolean;
  created_at: string;
  updated_at?: string;
}

export interface InsertUser {
  username: string;
  email: string;
  password_hash?: string;
  role?: string;
  score?: number;
  profile_image_url?: string;
  banned?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  icon_name?: string;
  color?: string;
  background_color?: string;
  image_url?: string;
  active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface InsertCategory {
  name: string;
  description: string;
  icon_name?: string;
  color?: string;
  background_color?: string;
  image_url?: string;
  active?: boolean;
}

export interface Image {
  id: number;
  title: string;
  image_url: string;
  storage_key?: string;
  category_id: number;
  answers: string[];
  hints?: string[];
  difficulty: number;
  play_count: number;
  like_count: number;
  active: boolean;
  created_at: string;
  created_by?: number;
  updated_at?: string;
  category?: Category;
}

export interface InsertImage {
  title: string;
  image_url: string;
  storage_key?: string;
  category_id: number;
  answers: string[];
  hints?: string[];
  difficulty: number;
  play_count?: number;
  like_count?: number;
  active?: boolean;
  created_by?: number;
}

export interface Test {
  id: number;
  uuid: string;
  title: string;
  description: string;
  category_id: number;
  creator_id: number;
  difficulty: number;
  duration?: number;
  image_url?: string;
  questions: any[];
  play_count: number;
  like_count: number;
  approved: boolean;
  is_public: boolean;
  is_anonymous: boolean;
  featured: boolean;
  created_at: string;
  updated_at?: string;
  category?: Category;
  createdBy?: User;
}

export interface InsertTest {
  title: string;
  description: string;
  category_id: number;
  creator_id: number;
  difficulty: number;
  duration?: number;
  image_url?: string;
  questions: any[];
  play_count?: number;
  like_count?: number;
  approved?: boolean;
  is_public?: boolean;
  is_anonymous?: boolean;
  isAnonymous?: boolean; // For compatibility with frontend
  featured?: boolean;
}

export interface TestComment {
  id: number;
  test_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at?: string;
  user?: User;
}

export interface InsertTestComment {
  test_id: number;
  user_id: number;
  content: string;
}

export interface GameScore {
  id: number;
  user_id: number;
  game_mode: string;
  score: number;
  details?: any;
  created_at: string;
  user?: User;
}

export interface InsertGameScore {
  user_id: number;
  game_mode: string;
  score: number;
  details?: any;
}

export interface UserActivity {
  id: number;
  user_id: number;
  user_name?: string;
  activity_type: string;
  details?: string;
  entity_id?: number;
  entity_type?: string;
  metadata?: any;
  created_at: string;
}

export interface InsertUserActivity {
  user_id: number;
  user_name?: string;
  activity_type: string;
  details?: string;
  entity_id?: number;
  entity_type?: string;
  metadata?: any;
}

export class SupabaseStorage implements IStorage {
  // Kullanıcı işlemleri
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .limit(1)
      .single();
      
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1)
      .single();
      
    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error creating user:', error);
      throw new Error(`User creation failed: ${error.message}`);
    }
    
    return data as User;
  }

  async updateUserScore(id: number, scoreToAdd: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const currentScore = user.score || 0;
    const newScore = currentScore + scoreToAdd;
    
    const { data, error } = await supabase
      .from('users')
      .update({ score: newScore })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating user score:', error);
      return undefined;
    }
    
    if (scoreToAdd > 0) {
      await recordUserActivity(
        id, 
        'score_update', 
        `Skor güncellendi: +${scoreToAdd} puan`,
        undefined, 
        undefined, 
        { scoreAdded: scoreToAdd }
      );
    }

    return data as User;
  }

  // Admin kullanıcı işlemleri
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    return data as User[];
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating user role:', error);
      return undefined;
    }
    
    return data as User;
  }

  async updateUserBanStatus(id: number, banned: boolean): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .update({ banned })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating user ban status:', error);
      return undefined;
    }
    
    return data as User;
  }

  // Kategori işlemleri
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    
    return data as Category[];
  }

  async getAllCategoriesAdmin(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching all categories for admin:', error);
      return [];
    }
    
    return data as Category[];
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .limit(1)
      .single();
      
    if (error || !data) return undefined;
    return data as Category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    // Sütun adlarını Supabase'in beklediği formata uyarla
    const formattedCategory = {
      name: category.name,
      description: category.description,
      iconname: category.iconname,
      color: category.color,
      backgroundcolor: category.backgroundcolor,
      imageurl: category.imageurl,
      active: category.active
    };
    
    const { data, error } = await supabase
      .from('categories')
      .insert(formattedCategory)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error creating category:', error);
      throw new Error(`Category creation failed: ${error.message}`);
    }
    
    return data as Category;
  }

  async updateCategory(id: number, category: InsertCategory): Promise<Category | undefined> {
    // Sütun adlarını Supabase'in beklediği formata uyarla
    const formattedCategory = {
      name: category.name,
      description: category.description,
      iconname: category.iconname,
      color: category.color,
      backgroundcolor: category.backgroundcolor,
      imageurl: category.imageurl,
      active: category.active
    };
    
    const { data, error } = await supabase
      .from('categories')
      .update(formattedCategory)
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating category:', error);
      return undefined;
    }
    
    return data as Category;
  }

  // Görüntü işlemleri
  async getAllImages(): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching images:', error);
      return [];
    }
    
    return data as Image[];
  }

  async getImage(id: number): Promise<Image | undefined> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .limit(1)
      .single();
      
    if (error || !data) return undefined;
    return data as Image;
  }

  async getImagesByCategory(categoryId: number): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('category_id', categoryId)
      .eq('active', true)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching images by category:', error);
      return [];
    }
    
    return data as Image[];
  }

  async createImage(image: InsertImage): Promise<Image> {
    const { data, error } = await supabase
      .from('images')
      .insert(image)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error creating image:', error);
      throw new Error(`Image creation failed: ${error.message}`);
    }
    
    if (image.created_by) {
      await recordUserActivity(
        image.created_by, 
        'create_image', 
        `Yeni resim oluşturuldu: ${image.title}`,
        data.id, 
        'image'
      );
    }
    
    return data as Image;
  }

  async incrementPlayCount(id: number): Promise<void> {
    const image = await this.getImage(id);
    if (!image) return;
    
    const currentPlayCount = image.play_count || 0;
    const { error } = await supabase
      .from('images')
      .update({ 
        play_count: currentPlayCount + 1 
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error incrementing play count:', error);
    }
  }

  async incrementLikeCount(id: number): Promise<void> {
    const image = await this.getImage(id);
    if (!image) return;
    
    const currentLikeCount = image.like_count || 0;
    const { error } = await supabase
      .from('images')
      .update({ 
        like_count: currentLikeCount + 1 
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error incrementing like count:', error);
    }
  }

  async getTopPlayedImages(limit: number): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('active', true)
      .order('play_count', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching top played images:', error);
      return [];
    }
    
    return data as Image[];
  }

  async getTopLikedImages(limit: number): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('active', true)
      .order('like_count', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching top liked images:', error);
      return [];
    }
    
    return data as Image[];
  }

  // Test işlemleri
  async getAllTests(): Promise<Test[]> {
    console.log('Fetching all tests');
    
    try {
      // İlişki adını belirtiyoruz burada
      const { data, error } = await supabase
        .from('tests')
        .select('*, category:categories!tests_category_id_fkey(*)')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching all tests:', error);
        return [];
      }
      
      console.log(`Found ${data?.length || 0} tests`);
      return data as Test[];
    } catch (err) {
      console.error('Exception in getAllTests:', err);
      return [];
    }
  }

  async getAllTestsAdmin(): Promise<Test[]> {
    console.log('Fetching all tests for admin');
    
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*, category:categories!tests_category_id_fkey(*)')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching all tests for admin:', error);
        return [];
      }
      
      console.log(`Found ${data?.length || 0} tests for admin`);
      return data as Test[];
    } catch (err) {
      console.error('Exception in getAllTestsAdmin:', err);
      return [];
    }
  }

  async getTest(id: number): Promise<Test | undefined> {
    console.log(`Fetching test by ID: ${id}`);
    
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*, category:categories!tests_category_id_fkey(*)')
        .eq('id', id)
        .limit(1)
        .single();
        
      if (error) {
        console.error('Error fetching test by ID:', error);
        return undefined;
      }
      
      console.log('Test found by ID:', data ? data.id : 'None');
      return data as Test;
    } catch (err) {
      console.error('Exception in getTest:', err);
      return undefined;
    }
  }

  async getTestByUuid(uuid: string): Promise<Test | undefined> {
    console.log(`Fetching test by UUID: ${uuid}`);
    
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*, category:categories!tests_category_id_fkey(*)')
        .eq('uuid', uuid)
        .limit(1)
        .single();
        
      if (error) {
        console.error('Error fetching test by UUID:', error);
        return undefined;
      }
      
      console.log('Test found by UUID:', data ? data.id : 'None');
      return data as Test;
    } catch (err) {
      console.error('Exception in getTestByUuid:', err);
      return undefined;
    }
  }

  async getTestsByCategory(categoryId: number): Promise<Test[]> {
    console.log(`Fetching tests by category ID: ${categoryId}`);
    
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*, category:categories!tests_category_id_fkey(*)')
        .eq('category_id', categoryId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching tests by category:', error);
        return [];
      }
      
      console.log(`Found ${data?.length || 0} tests for category ${categoryId}`);
      return data as Test[];
    } catch (err) {
      console.error('Exception in getTestsByCategory:', err);
      return [];
    }
  }

  async createTest(test: InsertTest): Promise<Test> {
    try {
      // UUID oluştur
      const testUuid = createId();
      
      // Test verisini hazırla
      const testData = {
        ...test,
        uuid: testUuid,
        difficulty: test.difficulty || 2, // Varsayılan zorluk seviyesi
        play_count: 0,
        like_count: 0,
        approved: true,
        featured: false,
        created_at: new Date().toISOString()
      };

      console.log("Veritabanına kaydedilecek test verisi:", testData);

      const { data, error } = await supabase
        .from('tests')
        .insert(testData)
        .select('*, category:categories(*)')
        .single();
        
      if (error) {
        console.error('Error creating test:', error);
        throw new Error(`Test creation failed: ${error.message}`);
      }
      
      console.log("Test başarıyla oluşturuldu:", data);
      
      // Kullanıcı aktivitesini kaydet
      if (test.creator_id) {
        await recordUserActivity(
          test.creator_id, 
          'create_test', 
          `Yeni test oluşturuldu: ${test.title}`,
          data.id, 
          'test'
        );
      }
      
      return data as Test;
    } catch (error) {
      console.error('Error in createTest:', error);
      throw error;
    }
  }

  async updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined> {
    // Schema cache sorunu nedeniyle rename ediyoruz
    const testData = { ...test };
    
    // isAnonymous -> is_anonymous dönüşümü
    if (testData.isAnonymous !== undefined) {
      testData.is_anonymous = testData.isAnonymous;
      delete testData.isAnonymous;
    }
    
    const { data, error } = await supabase
      .from('tests')
      .update({
        ...testData,
        updated_at: new Date()
      })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating test:', error);
      return undefined;
    }
    
    return data as Test;
  }

  async deleteTest(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting test:', error);
      return false;
    }
    
    return true;
  }

  async incrementTestPlayCount(id: number): Promise<void> {
    const test = await this.getTest(id);
    if (!test) return;
    
    const currentPlayCount = test.play_count || 0;
    const { error } = await supabase
      .from('tests')
      .update({ 
        play_count: currentPlayCount + 1 
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error incrementing test play count:', error);
    }
  }

  async incrementTestLikeCount(id: number): Promise<void> {
    const test = await this.getTest(id);
    if (!test) return;
    
    const currentLikeCount = test.like_count || 0;
    const { error } = await supabase
      .from('tests')
      .update({ 
        like_count: currentLikeCount + 1 
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error incrementing test like count:', error);
    }
  }

  async updateTestApproval(id: number, approved: boolean): Promise<Test | undefined> {
    const { data, error } = await supabase
      .from('tests')
      .update({ approved })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating test approval:', error);
      return undefined;
    }
    
    return data as Test;
  }

  async updateTestPublishedStatus(id: number, published: boolean): Promise<Test | undefined> {
    const { data, error } = await supabase
      .from('tests')
      .update({ is_public: published })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating test published status:', error);
      return undefined;
    }
    
    return data as Test;
  }

  async getPopularTests(limit: number): Promise<Test[]> {
    const { data, error } = await supabase
      .from('tests')
      .select('*, category:categories!tests_category_id_fkey(*)')
      .eq('is_public', true)
      .eq('approved', true)
      .order('play_count', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching popular tests:', error);
      return [];
    }
    
    return data as Test[];
  }

  async getNewestTests(limit: number): Promise<Test[]> {
    const { data, error } = await supabase
      .from('tests')
      .select('*, category:categories!tests_category_id_fkey(*)')
      .eq('is_public', true)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching newest tests:', error);
      return [];
    }
    
    return data as Test[];
  }

  async getFeaturedTests(limit: number): Promise<Test[]> {
    const { data, error } = await supabase
      .from('tests')
      .select('*, category:categories!tests_category_id_fkey(*)')
      .eq('is_public', true)
      .eq('approved', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching featured tests:', error);
      return [];
    }
    
    return data as Test[];
  }

  // Test yorumları
  async getTestComments(testId: number): Promise<TestComment[]> {
    // Profile_image_url sütunu hata veriyor, sadece id ve username alalım
    const { data, error } = await supabase
      .from('test_comments')
      .select('*, user:users(id, username)')
      .eq('test_id', testId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching test comments:', error);
      return [];
    }
    
    return data as TestComment[];
  }

  async createTestComment(comment: InsertTestComment): Promise<TestComment> {
    const { data, error } = await supabase
      .from('test_comments')
      .insert(comment)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error creating test comment:', error);
      throw new Error(`Test comment creation failed: ${error.message}`);
    }
    
    // Get test for better details
    const test = await this.getTest(comment.test_id);
    const testTitle = test ? test.title : `Test #${comment.test_id}`;
    
    await recordUserActivity(
      comment.user_id, 
      'comment_test', 
      `Yorum eklendi: "${comment.content.substring(0, 30)}${comment.content.length > 30 ? '...' : ''}" (${testTitle})`,
      comment.test_id, 
      'test_comment'
    );
    
    return data as TestComment;
  }

  // Oyun puanları
  async saveGameScore(score: InsertGameScore): Promise<GameScore> {
    const { data, error } = await supabase
      .from('game_scores')
      .insert(score)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error saving game score:', error);
      throw new Error(`Game score saving failed: ${error.message}`);
    }
    
    if (score.user_id) {
      // Kullanıcı puanını artır
      await this.updateUserScore(score.user_id, score.score);
      
      await recordUserActivity(
        score.user_id, 
        'game_score', 
        `Oyun skoru: ${score.score} puan, mod: ${score.game_mode}`,
        undefined, 
        'game'
      );
    }
    
    return data as GameScore;
  }

  async getUserScores(userId: number): Promise<GameScore[]> {
    const { data, error } = await supabase
      .from('game_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching user scores:', error);
      return [];
    }
    
    return data as GameScore[];
  }

  async getTopScores(limit: number, gameMode?: string): Promise<GameScore[]> {
    // Supabase sorgusu oluştur
    let query = supabase
      .from('game_scores')
      .select('*, user:users(id, username)')
      .order('score', { ascending: false })
      .limit(limit);
      
    // Eğer oyun modu belirtilmişse filtrele
    if (gameMode) {
      query = query.eq('game_mode', gameMode);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching top scores:', error);
      return [];
    }
    
    return data as GameScore[];
  }

  // Kullanıcı aktivitelerini listeleme (admin için)
  async getUserActivities(userId: number, limit: number = 50): Promise<UserActivity[]> {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
    
    return data as UserActivity[];
  }

  async getLatestActivities(limit: number = 50): Promise<UserActivity[]> {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching latest activities:', error);
      return [];
    }
    
    return data as UserActivity[];
  }

  // Arama fonksiyonu
  async searchTests(query: string, categoryId?: number, limit: number = 20): Promise<Test[]> {
    console.log(`Searching tests with query: "${query}", categoryId: ${categoryId || 'all'}`);
    
    let supabaseQuery = supabase
      .from('tests')
      .select('*, category:categories!tests_category_id_fkey(*), createdBy:users(id, username)')
      .filter('is_public', 'eq', true);
      
    // Eğer kategori ID belirtilmişse, filtreleme yap
    if (categoryId) {
      supabaseQuery = supabaseQuery.filter('category_id', 'eq', categoryId);
    }
    
    // Arama sorgusu: başlık ve açıklamada arama yap (büyük/küçük harf duyarsız)
    if (query && query.trim() !== '') {
      // İTextSearch sorgusu
      const ilike = `%${query.toLowerCase()}%`;
      supabaseQuery = supabaseQuery.or(`title.ilike.${ilike},description.ilike.${ilike}`);
    }
    
    const { data, error } = await supabaseQuery
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error searching tests:', error);
      return [];
    }
    
    return data as Test[];
  }
}

export const supabaseStorage = new SupabaseStorage();