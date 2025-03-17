import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { Json } from '@supabase/supabase-js';

import type {
  User, InsertUser,
  Category, InsertCategory,
  Image, InsertImage,
  Test, InsertTest,
  TestComment, InsertTestComment,
  GameScore, InsertGameScore,
  IStorage
} from './storage';

// Supabase istemcisini oluşturuyoruz
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseStorage implements IStorage {
  constructor() {
    console.log('Supabase storage initialized');
    this.initTables();
  }

  // Supabase ile tabloları oluşturma veya kontrol etme
  private async initTables() {
    try {
      // Supabase'de tabloların var olup olmadığını kontrol ediyoruz
      // RLS (Row Level Security) politikalarını ayarlamamız gerekebilir
      console.log('Supabase tables are being checked...');
      
      // Örnek olarak tabloları kontrol ediyoruz
      const { data: usersTable, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (usersError) {
        console.error('Users table error:', usersError);
      } else {
        console.log('Users table exists');
      }
      
      // Diğer tabloları da kontrol edebiliriz
    } catch (error) {
      console.error('Error initializing Supabase tables:', error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Error getting user:', error);
      return undefined;
    }
    
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
    
    return data as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...user,
        createdAt: new Date().toISOString(), 
        score: user.score || 0
      }])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error creating user:', error);
      throw new Error('Could not create user');
    }
    
    return data as User;
  }

  async updateUserScore(id: number, scoreToAdd: number): Promise<User | undefined> {
    // Önce mevcut kullanıcıyı alalım
    const { data: existingUser, error: getUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (getUserError || !existingUser) {
      console.error('Error getting user for score update:', getUserError);
      return undefined;
    }
    
    // Puanı güncelleyelim
    const currentScore = existingUser.score || 0;
    const newScore = currentScore + scoreToAdd;
    
    const { data, error } = await supabase
      .from('users')
      .update({ score: newScore })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating user score:', error);
      return undefined;
    }
    
    return data as User;
  }

  // Admin user operations
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('id', { ascending: true });
    
    if (error || !data) {
      console.error('Error getting all users:', error);
      return [];
    }
    
    return data as User[];
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
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
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating user ban status:', error);
      return undefined;
    }
    
    return data as User;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });
    
    if (error || !data) {
      console.error('Error getting all categories:', error);
      return [];
    }
    
    return data as Category[];
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Error getting category:', error);
      return undefined;
    }
    
    return data as Category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error creating category:', error);
      throw new Error('Could not create category');
    }
    
    return data as Category;
  }

  async updateCategory(id: number, category: InsertCategory): Promise<Category | undefined> {
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating category:', error);
      return undefined;
    }
    
    return data as Category;
  }

  // Image operations
  async getAllImages(): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('id', { ascending: true });
    
    if (error || !data) {
      console.error('Error getting all images:', error);
      return [];
    }
    
    return data as Image[];
  }

  async getImage(id: number): Promise<Image | undefined> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Error getting image:', error);
      return undefined;
    }
    
    return data as Image;
  }

  async getImagesByCategory(categoryId: number): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('categoryId', categoryId)
      .order('id', { ascending: true });
    
    if (error || !data) {
      console.error('Error getting images by category:', error);
      return [];
    }
    
    return data as Image[];
  }

  async createImage(image: InsertImage): Promise<Image> {
    const { data, error } = await supabase
      .from('images')
      .insert([{
        ...image,
        playCount: 0,
        likeCount: 0,
        createdAt: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error creating image:', error);
      throw new Error('Could not create image');
    }
    
    return data as Image;
  }

  async incrementPlayCount(id: number): Promise<void> {
    const { data: existingImage, error: getImageError } = await supabase
      .from('images')
      .select('playCount')
      .eq('id', id)
      .single();
    
    if (getImageError || !existingImage) {
      console.error('Error getting image for play count update:', getImageError);
      return;
    }
    
    const currentPlayCount = existingImage.playCount || 0;
    
    const { error } = await supabase
      .from('images')
      .update({ playCount: currentPlayCount + 1 })
      .eq('id', id);
    
    if (error) {
      console.error('Error incrementing play count:', error);
    }
  }

  async incrementLikeCount(id: number): Promise<void> {
    const { data: existingImage, error: getImageError } = await supabase
      .from('images')
      .select('likeCount')
      .eq('id', id)
      .single();
    
    if (getImageError || !existingImage) {
      console.error('Error getting image for like count update:', getImageError);
      return;
    }
    
    const currentLikeCount = existingImage.likeCount || 0;
    
    const { error } = await supabase
      .from('images')
      .update({ likeCount: currentLikeCount + 1 })
      .eq('id', id);
    
    if (error) {
      console.error('Error incrementing like count:', error);
    }
  }

  async getTopPlayedImages(limit: number): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('playCount', { ascending: false })
      .limit(limit);
    
    if (error || !data) {
      console.error('Error getting top played images:', error);
      return [];
    }
    
    return data as Image[];
  }

  async getTopLikedImages(limit: number): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('likeCount', { ascending: false })
      .limit(limit);
    
    if (error || !data) {
      console.error('Error getting top liked images:', error);
      return [];
    }
    
    return data as Image[];
  }

  // Test operations
  async getAllTests(): Promise<Test[]> {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .order('id', { ascending: true });
    
    if (error || !data) {
      console.error('Error getting all tests:', error);
      return [];
    }
    
    return data as Test[];
  }

  async getTest(id: number): Promise<Test | undefined> {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Error getting test:', error);
      return undefined;
    }
    
    return data as Test;
  }

  async getTestByUuid(uuid: string): Promise<Test | undefined> {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('uuid', uuid)
      .single();
    
    if (error || !data) {
      console.error('Error getting test by uuid:', error);
      return undefined;
    }
    
    return data as Test;
  }

  async getTestsByCategory(categoryId: number): Promise<Test[]> {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('categoryId', categoryId)
      .order('id', { ascending: true });
    
    if (error || !data) {
      console.error('Error getting tests by category:', error);
      return [];
    }
    
    return data as Test[];
  }

  async createTest(test: InsertTest): Promise<Test> {
    // test.uuid yerine uuidv4() kullanarak benzersiz ID oluşturalım
    const uuid = uuidv4();
    
    const { data, error } = await supabase
      .from('tests')
      .insert([{
        ...test,
        uuid,
        playCount: 0,
        likeCount: 0,
        createdAt: new Date().toISOString(),
        approved: false,  // Yeni testler varsayılan olarak onaylanmamış olsun
        published: true   // ve yayınlanmış olsun
      }])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error creating test:', error);
      throw new Error('Could not create test');
    }
    
    // Test soruları için ayrı bir tabloya kayıt ekleme
    if (test.images && Array.isArray(test.images) && test.images.length > 0) {
      const testQuestions = test.images.map((img: any, index: number) => ({
        testId: data.id,
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
        // Ana test kaydı başarılı olduğu için genel bir hata fırlatmak yerine
        // sadece loglama yapıyoruz
      }
    }
    
    return data as Test;
  }

  async updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined> {
    const { data, error } = await supabase
      .from('tests')
      .update(test)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating test:', error);
      return undefined;
    }
    
    // Eğer sorular güncellenmişse, önce eskilerini silelim
    if (test.images && Array.isArray(test.images)) {
      const { error: deleteError } = await supabase
        .from('test_questions')
        .delete()
        .eq('testId', id);
      
      if (deleteError) {
        console.error('Error deleting existing test questions:', deleteError);
        return data as Test; // Ana güncelleme başarılı olduğu için devam ediyoruz
      }
      
      // Sonra yenilerini ekleyelim
      const testQuestions = test.images.map((img: any, index: number) => ({
        testId: id,
        imageUrl: img.imageUrl,
        answers: img.answers,
        order: index,
        createdAt: new Date().toISOString()
      }));
      
      const { error: insertError } = await supabase
        .from('test_questions')
        .insert(testQuestions);
      
      if (insertError) {
        console.error('Error updating test questions:', insertError);
      }
    }
    
    return data as Test;
  }

  async deleteTest(id: number): Promise<boolean> {
    // Önce test sorularını silelim
    const { error: questionsError } = await supabase
      .from('test_questions')
      .delete()
      .eq('testId', id);
    
    if (questionsError) {
      console.error('Error deleting test questions:', questionsError);
      // Hata olsa bile test silmeye devam edelim
    }
    
    // Yorumları silme
    const { error: commentsError } = await supabase
      .from('test_comments')
      .delete()
      .eq('testId', id);
    
    if (commentsError) {
      console.error('Error deleting test comments:', commentsError);
      // Hata olsa bile test silmeye devam edelim
    }
    
    // Puanları silme
    const { error: scoresError } = await supabase
      .from('game_scores')
      .delete()
      .eq('testId', id);
    
    if (scoresError) {
      console.error('Error deleting test scores:', scoresError);
      // Hata olsa bile test silmeye devam edelim
    }
    
    // Son olarak testi silme
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
    const { data: existingTest, error: getTestError } = await supabase
      .from('tests')
      .select('playCount')
      .eq('id', id)
      .single();
    
    if (getTestError || !existingTest) {
      console.error('Error getting test for play count update:', getTestError);
      return;
    }
    
    const currentPlayCount = existingTest.playCount || 0;
    
    const { error } = await supabase
      .from('tests')
      .update({ playCount: currentPlayCount + 1 })
      .eq('id', id);
    
    if (error) {
      console.error('Error incrementing test play count:', error);
    }
  }

  async incrementTestLikeCount(id: number): Promise<void> {
    const { data: existingTest, error: getTestError } = await supabase
      .from('tests')
      .select('likeCount')
      .eq('id', id)
      .single();
    
    if (getTestError || !existingTest) {
      console.error('Error getting test for like count update:', getTestError);
      return;
    }
    
    const currentLikeCount = existingTest.likeCount || 0;
    
    const { error } = await supabase
      .from('tests')
      .update({ likeCount: currentLikeCount + 1 })
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
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating test approval:', error);
      return undefined;
    }
    
    return data as Test;
  }

  async updateTestPublishedStatus(id: number, published: boolean): Promise<Test | undefined> {
    const { data, error } = await supabase
      .from('tests')
      .update({ published })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating test published status:', error);
      return undefined;
    }
    
    return data as Test;
  }

  async getPopularTests(limit: number): Promise<Test[]> {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('published', true)
      .eq('approved', true)
      .order('playCount', { ascending: false })
      .limit(limit);
    
    if (error || !data) {
      console.error('Error getting popular tests:', error);
      return [];
    }
    
    return data as Test[];
  }

  async getNewestTests(limit: number): Promise<Test[]> {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('published', true)
      .eq('approved', true)
      .order('createdAt', { ascending: false })
      .limit(limit);
    
    if (error || !data) {
      console.error('Error getting newest tests:', error);
      return [];
    }
    
    return data as Test[];
  }

  async getFeaturedTests(limit: number): Promise<Test[]> {
    // Bu örnekte, beğenilere göre sıralayarak öne çıkan testleri alıyoruz
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('published', true)
      .eq('approved', true)
      .order('likeCount', { ascending: false })
      .limit(limit);
    
    if (error || !data) {
      console.error('Error getting featured tests:', error);
      return [];
    }
    
    return data as Test[];
  }

  // Test comment operations
  async getTestComments(testId: number): Promise<TestComment[]> {
    const { data, error } = await supabase
      .from('test_comments')
      .select('*')
      .eq('testId', testId)
      .order('createdAt', { ascending: false });
    
    if (error || !data) {
      console.error('Error getting test comments:', error);
      return [];
    }
    
    return data as TestComment[];
  }

  async createTestComment(comment: InsertTestComment): Promise<TestComment> {
    const { data, error } = await supabase
      .from('test_comments')
      .insert([{
        ...comment,
        createdAt: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error creating test comment:', error);
      throw new Error('Could not create test comment');
    }
    
    return data as TestComment;
  }

  // Game score operations
  async saveGameScore(score: InsertGameScore): Promise<GameScore> {
    const { data, error } = await supabase
      .from('game_scores')
      .insert([{
        ...score,
        createdAt: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error saving game score:', error);
      throw new Error('Could not save game score');
    }
    
    return data as GameScore;
  }

  async getUserScores(userId: number): Promise<GameScore[]> {
    const { data, error } = await supabase
      .from('game_scores')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    
    if (error || !data) {
      console.error('Error getting user scores:', error);
      return [];
    }
    
    return data as GameScore[];
  }

  async getTopScores(limit: number, gameMode?: string): Promise<GameScore[]> {
    let query = supabase
      .from('game_scores')
      .select(`
        *,
        users (id, username, avatar, score)
      `)
      .order('score', { ascending: false })
      .limit(limit);
    
    if (gameMode) {
      query = query.eq('gameMode', gameMode);
    }
    
    const { data, error } = await query;
    
    if (error || !data) {
      console.error('Error getting top scores:', error);
      return [];
    }
    
    return data as GameScore[];
  }
}

export const supabaseStorage = new SupabaseStorage();