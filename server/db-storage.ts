import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { v4 as uuidv4 } from "uuid";
import {
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  images, type Image, type InsertImage,
  tests, type Test, type InsertTest,
  testComments, type TestComment, type InsertTestComment,
  gameScores, type GameScore, type InsertGameScore
} from "@shared/schema";
import { IStorage } from "./storage";
import { log } from "./vite";
import { eq, desc, asc } from "drizzle-orm";

// PostgreSQL bağlantısı
const connectionString = process.env.DATABASE_URL || '';
const client = postgres(connectionString);
const db = drizzle(client);

export class PostgresStorage implements IStorage {
  constructor() {
    log("PostgreSQL storage initialized", "database");
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values({
      ...user,
      score: 0,
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  async updateUserScore(id: number, scoreToAdd: number): Promise<User | undefined> {
    const userRecord = await this.getUser(id);
    if (!userRecord) return undefined;
    
    const newScore = (userRecord.score || 0) + scoreToAdd;
    
    const results = await db.update(users)
      .set({ score: newScore })
      .where(eq(users.id, id))
      .returning();
    
    return results[0];
  }
  
  // Admin user operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const results = await db.update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    
    return results[0];
  }

  async updateUserBanStatus(id: number, banned: boolean): Promise<User | undefined> {
    const results = await db.update(users)
      .set({ banned })
      .where(eq(users.id, id))
      .returning();
    
    return results[0];
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const results = await db.select().from(categories).where(eq(categories.id, id));
    return results[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const results = await db.insert(categories).values({
      ...category
    }).returning();
    return results[0];
  }

  async updateCategory(id: number, category: InsertCategory): Promise<Category | undefined> {
    const results = await db.update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    
    return results[0];
  }

  // Image operations
  async getAllImages(): Promise<Image[]> {
    return await db.select().from(images);
  }

  async getImage(id: number): Promise<Image | undefined> {
    const results = await db.select().from(images).where(eq(images.id, id));
    return results[0];
  }

  async getImagesByCategory(categoryId: number): Promise<Image[]> {
    return await db.select().from(images).where(eq(images.categoryId, categoryId));
  }

  async createImage(image: InsertImage): Promise<Image> {
    const results = await db.insert(images).values({
      ...image,
      playCount: 0,
      likeCount: 0
    }).returning();
    return results[0];
  }

  async incrementPlayCount(id: number): Promise<void> {
    const imageRecord = await this.getImage(id);
    if (!imageRecord) return;
    
    const newPlayCount = (imageRecord.playCount || 0) + 1;
    
    await db.update(images)
      .set({ playCount: newPlayCount })
      .where(eq(images.id, id));
  }

  async incrementLikeCount(id: number): Promise<void> {
    const imageRecord = await this.getImage(id);
    if (!imageRecord) return;
    
    const newLikeCount = (imageRecord.likeCount || 0) + 1;
    
    await db.update(images)
      .set({ likeCount: newLikeCount })
      .where(eq(images.id, id));
  }

  async getTopPlayedImages(limit: number): Promise<Image[]> {
    return await db.select().from(images).orderBy(desc(images.playCount)).limit(limit);
  }

  async getTopLikedImages(limit: number): Promise<Image[]> {
    return await db.select().from(images).orderBy(desc(images.likeCount)).limit(limit);
  }

  // Test operations
  async getAllTests(): Promise<Test[]> {
    return await db.select().from(tests);
  }

  async getTest(id: number): Promise<Test | undefined> {
    const results = await db.select().from(tests).where(eq(tests.id, id));
    return results[0];
  }

  async getTestByUuid(uuid: string): Promise<Test | undefined> {
    const results = await db.select().from(tests).where(eq(tests.uuid, uuid));
    return results[0];
  }

  async getTestsByCategory(categoryId: number): Promise<Test[]> {
    return await db.select().from(tests).where(eq(tests.categoryId, categoryId));
  }

  async createTest(test: InsertTest): Promise<Test> {
    // UUID oluştur, eğer verilmemişse
    const testWithUuid = {
      ...test,
      uuid: test.uuid || uuidv4(),
      playCount: 0,
      likeCount: 0,
      createdAt: new Date()
    };
    
    const results = await db.insert(tests).values(testWithUuid).returning();
    return results[0];
  }
  
  async updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined> {
    const results = await db.update(tests)
      .set(test)
      .where(eq(tests.id, id))
      .returning();
    
    return results[0];
  }
  
  async deleteTest(id: number): Promise<boolean> {
    // Test yorumlarını sil
    await db.delete(testComments).where(eq(testComments.testId, id));
    
    // Testi sil
    const result = await db.delete(tests).where(eq(tests.id, id)).returning();
    return result.length > 0;
  }

  async incrementTestPlayCount(id: number): Promise<void> {
    const testRecord = await this.getTest(id);
    if (!testRecord) return;
    
    const newPlayCount = (testRecord.playCount || 0) + 1;
    
    await db.update(tests)
      .set({ playCount: newPlayCount })
      .where(eq(tests.id, id));
  }

  async incrementTestLikeCount(id: number): Promise<void> {
    const testRecord = await this.getTest(id);
    if (!testRecord) return;
    
    const newLikeCount = (testRecord.likeCount || 0) + 1;
    
    await db.update(tests)
      .set({ likeCount: newLikeCount })
      .where(eq(tests.id, id));
  }
  
  async updateTestApproval(id: number, approved: boolean): Promise<Test | undefined> {
    const results = await db.update(tests)
      .set({ approved })
      .where(eq(tests.id, id))
      .returning();
    
    return results[0];
  }
  
  async updateTestPublishedStatus(id: number, published: boolean): Promise<Test | undefined> {
    const results = await db.update(tests)
      .set({ published })
      .where(eq(tests.id, id))
      .returning();
    
    return results[0];
  }

  async getPopularTests(limit: number): Promise<Test[]> {
    return await db.select().from(tests).orderBy(desc(tests.playCount)).limit(limit);
  }

  async getNewestTests(limit: number): Promise<Test[]> {
    return await db.select().from(tests).orderBy(desc(tests.createdAt)).limit(limit);
  }

  async getFeaturedTests(limit: number): Promise<Test[]> {
    // Şu an için, featuredlar karışık sıralama kullanıyor
    const popularTests = await this.getPopularTests(Math.ceil(limit / 2));
    const newestTests = await this.getNewestTests(limit);
    
    // Duplicate'leri kaldır ve sınırla
    const combinedTests = [...popularTests];
    
    for (const test of newestTests) {
      if (!combinedTests.some(t => t.id === test.id)) {
        combinedTests.push(test);
      }
      
      if (combinedTests.length >= limit) {
        break;
      }
    }
    
    return combinedTests.slice(0, limit);
  }

  // Test comment operations
  async getTestComments(testId: number): Promise<TestComment[]> {
    return await db.select()
      .from(testComments)
      .where(eq(testComments.testId, testId))
      .orderBy(desc(testComments.createdAt));
  }

  async createTestComment(comment: InsertTestComment): Promise<TestComment> {
    const results = await db.insert(testComments).values({
      ...comment,
      createdAt: new Date()
    }).returning();
    return results[0];
  }

  // Game score operations
  async saveGameScore(score: InsertGameScore): Promise<GameScore> {
    const results = await db.insert(gameScores).values({
      ...score,
      createdAt: new Date()
    }).returning();
    
    // Test play count'u artır
    if (score.testId) {
      await this.incrementTestPlayCount(score.testId);
    }
    
    // Kullanıcı skorunu güncelle
    if (score.userId) {
      await this.updateUserScore(score.userId, score.score);
    }
    
    return results[0];
  }

  async getUserScores(userId: number): Promise<GameScore[]> {
    return await db.select()
      .from(gameScores)
      .where(eq(gameScores.userId, userId))
      .orderBy(desc(gameScores.createdAt));
  }

  async getTopScores(limit: number, gameMode?: string): Promise<GameScore[]> {
    // TODO: gameMode filtreleme eklenebilir
    return await db.select()
      .from(gameScores)
      .orderBy(desc(gameScores.score))
      .limit(limit);
  }
}

// Tek bir veritabanı bağlantısı kullan
export const pgStorage = new PostgresStorage();