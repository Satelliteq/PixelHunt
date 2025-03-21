import { IStorage } from './storage';
import { db, recordUserActivity, storage } from './supabase';
import * as schema from '../shared/schema';
import { and, count, desc, eq, gt, lt, gte, lte, isNull, like, asc } from 'drizzle-orm';
import type {
  User, InsertUser,
  Category, InsertCategory,
  Image, InsertImage,
  Test, InsertTest,
  TestComment, InsertTestComment,
  GameScore, InsertGameScore,
  UserActivity, InsertUserActivity
} from '../shared/schema';
import { createId } from '@paralleldrive/cuid2';

export class SupabaseStorage implements IStorage {
  // Kullanıcı işlemleri
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return users[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = await db.insert(schema.users).values(user).returning();
    return newUser[0];
  }

  async updateUserScore(id: number, scoreToAdd: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = await db
      .update(schema.users)
      .set({ score: user.score + scoreToAdd })
      .where(eq(schema.users.id, id))
      .returning();

    if (scoreToAdd > 0) {
      await recordUserActivity(id, 'score_update', undefined, undefined, { scoreAdded: scoreToAdd });
    }

    return updatedUser[0];
  }

  // Admin kullanıcı işlemleri
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const updatedUser = await db
      .update(schema.users)
      .set({ role })
      .where(eq(schema.users.id, id))
      .returning();
    
    return updatedUser[0];
  }

  async updateUserBanStatus(id: number, banned: boolean): Promise<User | undefined> {
    const updatedUser = await db
      .update(schema.users)
      .set({ banned })
      .where(eq(schema.users.id, id))
      .returning();
    
    return updatedUser[0];
  }

  // Kategori işlemleri
  async getAllCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.active, true))
      .orderBy(asc(schema.categories.order), asc(schema.categories.name));
  }

  async getAllCategoriesAdmin(): Promise<Category[]> {
    return await db
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.order), asc(schema.categories.name));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);
    
    return categories[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory = await db
      .insert(schema.categories)
      .values(category)
      .returning();
    
    return newCategory[0];
  }

  async updateCategory(id: number, category: InsertCategory): Promise<Category | undefined> {
    const updatedCategory = await db
      .update(schema.categories)
      .set(category)
      .where(eq(schema.categories.id, id))
      .returning();
    
    return updatedCategory[0];
  }

  // Görüntü işlemleri
  async getAllImages(): Promise<Image[]> {
    return await db
      .select()
      .from(schema.images)
      .where(eq(schema.images.active, true))
      .orderBy(desc(schema.images.createdAt));
  }

  async getImage(id: number): Promise<Image | undefined> {
    const images = await db
      .select()
      .from(schema.images)
      .where(eq(schema.images.id, id))
      .limit(1);
    
    return images[0];
  }

  async getImagesByCategory(categoryId: number): Promise<Image[]> {
    return await db
      .select()
      .from(schema.images)
      .where(and(
        eq(schema.images.categoryId, categoryId),
        eq(schema.images.active, true)
      ))
      .orderBy(desc(schema.images.createdAt));
  }

  async createImage(image: InsertImage): Promise<Image> {
    const newImage = await db
      .insert(schema.images)
      .values(image)
      .returning();
    
    if (image.createdBy) {
      await recordUserActivity(
        image.createdBy, 
        'create_image', 
        newImage[0].id, 
        'image'
      );
    }
    
    return newImage[0];
  }

  async incrementPlayCount(id: number): Promise<void> {
    await db
      .update(schema.images)
      .set({ 
        playCount: db.raw('play_count + 1')
      })
      .where(eq(schema.images.id, id));
  }

  async incrementLikeCount(id: number): Promise<void> {
    await db
      .update(schema.images)
      .set({ 
        likeCount: db.raw('like_count + 1')
      })
      .where(eq(schema.images.id, id));
  }

  async getTopPlayedImages(limit: number): Promise<Image[]> {
    return await db
      .select()
      .from(schema.images)
      .where(eq(schema.images.active, true))
      .orderBy(desc(schema.images.playCount))
      .limit(limit);
  }

  async getTopLikedImages(limit: number): Promise<Image[]> {
    return await db
      .select()
      .from(schema.images)
      .where(eq(schema.images.active, true))
      .orderBy(desc(schema.images.likeCount))
      .limit(limit);
  }

  // Test işlemleri
  async getAllTests(): Promise<Test[]> {
    return await db
      .select()
      .from(schema.tests)
      .where(eq(schema.tests.isPublic, true))
      .orderBy(desc(schema.tests.createdAt));
  }

  async getAllTestsAdmin(): Promise<Test[]> {
    return await db
      .select()
      .from(schema.tests)
      .orderBy(desc(schema.tests.createdAt));
  }

  async getTest(id: number): Promise<Test | undefined> {
    const tests = await db
      .select()
      .from(schema.tests)
      .where(eq(schema.tests.id, id))
      .limit(1);
    
    return tests[0];
  }

  async getTestByUuid(uuid: string): Promise<Test | undefined> {
    const tests = await db
      .select()
      .from(schema.tests)
      .where(eq(schema.tests.uuid, uuid))
      .limit(1);
    
    return tests[0];
  }

  async getTestsByCategory(categoryId: number): Promise<Test[]> {
    return await db
      .select()
      .from(schema.tests)
      .where(and(
        eq(schema.tests.categoryId, categoryId),
        eq(schema.tests.isPublic, true)
      ))
      .orderBy(desc(schema.tests.createdAt));
  }

  async createTest(test: InsertTest): Promise<Test> {
    // UUID oluştur
    const testWithUuid = {
      ...test,
      uuid: createId()
    };

    const newTest = await db
      .insert(schema.tests)
      .values(testWithUuid)
      .returning();
    
    if (test.creatorId) {
      await recordUserActivity(
        test.creatorId, 
        'create_test', 
        newTest[0].id, 
        'test'
      );
    }
    
    return newTest[0];
  }

  async updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined> {
    const updatedTest = await db
      .update(schema.tests)
      .set({
        ...test,
        updatedAt: new Date()
      })
      .where(eq(schema.tests.id, id))
      .returning();
    
    return updatedTest[0];
  }

  async deleteTest(id: number): Promise<boolean> {
    const testResult = await db
      .delete(schema.tests)
      .where(eq(schema.tests.id, id))
      .returning({ id: schema.tests.id });
    
    return testResult.length > 0;
  }

  async incrementTestPlayCount(id: number): Promise<void> {
    await db
      .update(schema.tests)
      .set({ 
        playCount: db.raw('play_count + 1') 
      })
      .where(eq(schema.tests.id, id));
  }

  async incrementTestLikeCount(id: number): Promise<void> {
    await db
      .update(schema.tests)
      .set({ 
        likeCount: db.raw('like_count + 1') 
      })
      .where(eq(schema.tests.id, id));
  }

  async updateTestApproval(id: number, approved: boolean): Promise<Test | undefined> {
    const updatedTest = await db
      .update(schema.tests)
      .set({ approved })
      .where(eq(schema.tests.id, id))
      .returning();
    
    return updatedTest[0];
  }

  async updateTestPublishedStatus(id: number, published: boolean): Promise<Test | undefined> {
    const updatedTest = await db
      .update(schema.tests)
      .set({ isPublic: published })
      .where(eq(schema.tests.id, id))
      .returning();
    
    return updatedTest[0];
  }

  async getPopularTests(limit: number): Promise<Test[]> {
    return await db
      .select()
      .from(schema.tests)
      .where(and(
        eq(schema.tests.isPublic, true),
        eq(schema.tests.approved, true)
      ))
      .orderBy(desc(schema.tests.playCount))
      .limit(limit);
  }

  async getNewestTests(limit: number): Promise<Test[]> {
    return await db
      .select()
      .from(schema.tests)
      .where(and(
        eq(schema.tests.isPublic, true),
        eq(schema.tests.approved, true)
      ))
      .orderBy(desc(schema.tests.createdAt))
      .limit(limit);
  }

  async getFeaturedTests(limit: number): Promise<Test[]> {
    return await db
      .select()
      .from(schema.tests)
      .where(and(
        eq(schema.tests.isPublic, true),
        eq(schema.tests.approved, true),
        eq(schema.tests.featured, true)
      ))
      .orderBy(desc(schema.tests.createdAt))
      .limit(limit);
  }

  // Test yorumları
  async getTestComments(testId: number): Promise<TestComment[]> {
    return await db
      .select()
      .from(schema.testComments)
      .where(eq(schema.testComments.testId, testId))
      .orderBy(desc(schema.testComments.createdAt));
  }

  async createTestComment(comment: InsertTestComment): Promise<TestComment> {
    const newComment = await db
      .insert(schema.testComments)
      .values(comment)
      .returning();
    
    await recordUserActivity(
      comment.userId, 
      'comment_test', 
      comment.testId, 
      'test_comment'
    );
    
    return newComment[0];
  }

  // Oyun puanları
  async saveGameScore(score: InsertGameScore): Promise<GameScore> {
    const newScore = await db
      .insert(schema.gameScores)
      .values(score)
      .returning();
    
    if (score.userId) {
      await recordUserActivity(
        score.userId, 
        'game_score', 
        score.testId, 
        'game'
      );

      // Kullanıcı puanını artır
      await this.updateUserScore(score.userId, score.score);
    }
    
    return newScore[0];
  }

  async getUserScores(userId: number): Promise<GameScore[]> {
    return await db
      .select()
      .from(schema.gameScores)
      .where(eq(schema.gameScores.userId, userId))
      .orderBy(desc(schema.gameScores.createdAt));
  }

  async getTopScores(limit: number, gameMode?: string): Promise<GameScore[]> {
    // Burada gameMode'u filtrelemek için gerekli koşulları ekleyebiliriz
    // Şu an için sadece genel sıralamayı alıyoruz
    return await db
      .select()
      .from(schema.gameScores)
      .orderBy(desc(schema.gameScores.score))
      .limit(limit);
  }

  // Kullanıcı aktivitelerini listeleme (admin için)
  async getUserActivities(userId: number, limit: number = 50): Promise<UserActivity[]> {
    return await db
      .select()
      .from(schema.userActivities)
      .where(eq(schema.userActivities.userId, userId))
      .orderBy(desc(schema.userActivities.createdAt))
      .limit(limit);
  }

  async getLatestActivities(limit: number = 50): Promise<UserActivity[]> {
    return await db
      .select()
      .from(schema.userActivities)
      .orderBy(desc(schema.userActivities.createdAt))
      .limit(limit);
  }
}

export const supabaseStorage = new SupabaseStorage();