import {
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  images, type Image, type InsertImage,
  tests, type Test, type InsertTest,
  testComments, type TestComment, type InsertTestComment,
  gameScores, type GameScore, type InsertGameScore
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserScore(id: number, scoreToAdd: number): Promise<User | undefined>;
  
  // Admin user operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  updateUserBanStatus(id: number, banned: boolean): Promise<User | undefined>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: InsertCategory): Promise<Category | undefined>;
  
  // Image operations
  getAllImages(): Promise<Image[]>;
  getImage(id: number): Promise<Image | undefined>;
  getImagesByCategory(categoryId: number): Promise<Image[]>;
  createImage(image: InsertImage): Promise<Image>;
  incrementPlayCount(id: number): Promise<void>;
  incrementLikeCount(id: number): Promise<void>;
  getTopPlayedImages(limit: number): Promise<Image[]>;
  getTopLikedImages(limit: number): Promise<Image[]>;
  
  // Test operations
  getAllTests(): Promise<Test[]>;
  getTest(id: number): Promise<Test | undefined>;
  getTestByUuid(uuid: string): Promise<Test | undefined>;
  getTestsByCategory(categoryId: number): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: number): Promise<boolean>;
  incrementTestPlayCount(id: number): Promise<void>;
  incrementTestLikeCount(id: number): Promise<void>;
  updateTestApproval(id: number, approved: boolean): Promise<Test | undefined>;
  updateTestPublishedStatus(id: number, published: boolean): Promise<Test | undefined>;
  getPopularTests(limit: number): Promise<Test[]>;
  getNewestTests(limit: number): Promise<Test[]>;
  getFeaturedTests(limit: number): Promise<Test[]>;
  
  // Test comment operations
  getTestComments(testId: number): Promise<TestComment[]>;
  createTestComment(comment: InsertTestComment): Promise<TestComment>;
  
  // Game score operations
  saveGameScore(score: InsertGameScore): Promise<GameScore>;
  getUserScores(userId: number): Promise<GameScore[]>;
  getTopScores(limit: number, gameMode?: string): Promise<GameScore[]>;
}

// In-memory implementation
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private categoriesMap: Map<number, Category>;
  private imagesMap: Map<number, Image>;
  private testsMap: Map<number, Test>;
  private testCommentsMap: Map<number, TestComment>;
  private gameScoresMap: Map<number, GameScore>;
  
  private currentUserId: number;
  private currentCategoryId: number;
  private currentImageId: number;
  private currentTestId: number;
  private currentTestCommentId: number;
  private currentGameScoreId: number;
  
  constructor() {
    this.usersMap = new Map();
    this.categoriesMap = new Map();
    this.imagesMap = new Map();
    this.testsMap = new Map();
    this.testCommentsMap = new Map();
    this.gameScoresMap = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentImageId = 1;
    this.currentTestId = 1;
    this.currentTestCommentId = 1;
    this.currentGameScoreId = 1;

    // Initialize with sample data
    this.initSampleData();
  }

  private initSampleData() {
    // Add some sample categories
    const categoriesSample: InsertCategory[] = [
      { name: "Arabalar", description: "Otomobil markaları ve modelleri", iconUrl: "car" },
      { name: "Filmler", description: "Popüler film sahneleri", iconUrl: "film" },
      { name: "Ünlüler", description: "Tanınmış kişiler", iconUrl: "user" },
      { name: "Oyunlar", description: "Video oyunları", iconUrl: "gamepad" },
      { name: "Teknoloji", description: "Teknolojik ürünler", iconUrl: "laptop" }
    ];
    
    categoriesSample.forEach(category => {
      this.createCategory(category);
    });

    // Add sample images with answers
    const imagesSample: InsertImage[] = [
      {
        title: "Spor Araba",
        imageUrl: "car1.jpg",
        categoryId: 1,
        answers: ["Ferrari", "Ferrari 458", "458 Italia"],
        difficulty: 2
      },
      {
        title: "Klasik Film",
        imageUrl: "movie1.jpg",
        categoryId: 2,
        answers: ["The Dark Knight", "Batman", "Kara Şövalye"],
        difficulty: 1
      },
      {
        title: "YouTuber",
        imageUrl: "celebrity1.jpg",
        categoryId: 3,
        answers: ["Enes Batur", "Enes"],
        difficulty: 1
      },
      {
        title: "Popüler Oyun",
        imageUrl: "game1.jpg",
        categoryId: 4,
        answers: ["Red Dead Redemption", "RDR", "Red Dead"],
        difficulty: 3
      }
    ];
    
    imagesSample.forEach(image => {
      this.createImage(image);
    });

    // Add sample tests
    const testsSample: InsertTest[] = [
      {
        uuid: "film-test-001",
        title: "Klasik Filmler Testi",
        description: "Popüler filmler hakkında bilginizi test edin",
        categoryId: 2,
        creatorId: null,
        imageIds: [2],
        difficulty: 1,
        isPublic: true,
        anonymousCreator: false,
        thumbnail: "https://example.com/film-thumbnail.jpg",
        approved: true,
        published: true
      },
      {
        uuid: "car-test-001",
        title: "Spor Arabalar Testi",
        description: "Lüks ve spor arabalar hakkında ne kadar bilgilisiniz?",
        categoryId: 1,
        creatorId: null,
        imageIds: [1],
        difficulty: 2,
        isPublic: true,
        anonymousCreator: false,
        thumbnail: "https://example.com/car-thumbnail.jpg",
        approved: true,
        published: true
      },
      {
        uuid: "youtuber-test-001",
        title: "YouTuberlar Testi",
        description: "Popüler YouTuber'ları ne kadar iyi tanıyorsunuz?",
        categoryId: 3,
        creatorId: null,
        imageIds: [3],
        difficulty: 1,
        isPublic: true,
        anonymousCreator: false,
        thumbnail: "https://example.com/youtuber-thumbnail.jpg",
        approved: true,
        published: true
      },
      {
        uuid: "game-test-001",
        title: "Video Oyunları Testi",
        description: "Video oyunları hakkındaki bilginizi test edin",
        categoryId: 4,
        creatorId: null,
        imageIds: [4],
        difficulty: 3,
        isPublic: true,
        anonymousCreator: false,
        thumbnail: "https://example.com/game-thumbnail.jpg",
        approved: true,
        published: true
      }
    ];
    
    testsSample.forEach(test => {
      const id = this.currentTestId++;
      const newTest = {
        ...test,
        id,
        playCount: 0,
        likeCount: 0,
        createdAt: new Date()
      };
      this.testsMap.set(id, newTest);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser = { ...user, id, score: 0 };
    this.usersMap.set(id, newUser);
    return newUser;
  }

  async updateUserScore(id: number, scoreToAdd: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      score: user.score + scoreToAdd
    };
    
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }
  
  // Admin user operations
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      role
    };
    
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserBanStatus(id: number, banned: boolean): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      banned
    };
    
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categoriesMap.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categoriesMap.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const newCategory = { ...category, id };
    this.categoriesMap.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: number, category: InsertCategory): Promise<Category | undefined> {
    const existing = await this.getCategory(id);
    if (!existing) return undefined;
    
    const updatedCategory = {
      ...existing,
      ...category,
      id
    };
    
    this.categoriesMap.set(id, updatedCategory);
    return updatedCategory;
  }

  // Image operations
  async getAllImages(): Promise<Image[]> {
    return Array.from(this.imagesMap.values());
  }

  async getImage(id: number): Promise<Image | undefined> {
    return this.imagesMap.get(id);
  }

  async getImagesByCategory(categoryId: number): Promise<Image[]> {
    return Array.from(this.imagesMap.values()).filter(
      image => image.categoryId === categoryId
    );
  }

  async createImage(image: InsertImage): Promise<Image> {
    const id = this.currentImageId++;
    const newImage = { 
      ...image, 
      id, 
      playCount: 0, 
      likeCount: 0 
    };
    this.imagesMap.set(id, newImage);
    return newImage;
  }

  async incrementPlayCount(id: number): Promise<void> {
    const image = await this.getImage(id);
    if (image) {
      const updatedImage = {
        ...image,
        playCount: image.playCount + 1
      };
      this.imagesMap.set(id, updatedImage);
    }
  }

  async incrementLikeCount(id: number): Promise<void> {
    const image = await this.getImage(id);
    if (image) {
      const updatedImage = {
        ...image,
        likeCount: image.likeCount + 1
      };
      this.imagesMap.set(id, updatedImage);
    }
  }

  async getTopPlayedImages(limit: number): Promise<Image[]> {
    return Array.from(this.imagesMap.values())
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  }

  async getTopLikedImages(limit: number): Promise<Image[]> {
    return Array.from(this.imagesMap.values())
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit);
  }

  // Test operations
  async getAllTests(): Promise<Test[]> {
    return Array.from(this.testsMap.values());
  }

  async getTest(id: number): Promise<Test | undefined> {
    return this.testsMap.get(id);
  }

  async getTestByUuid(uuid: string): Promise<Test | undefined> {
    return Array.from(this.testsMap.values()).find(
      test => test.uuid === uuid
    );
  }

  async getTestsByCategory(categoryId: number): Promise<Test[]> {
    return Array.from(this.testsMap.values()).filter(
      test => test.categoryId === categoryId
    );
  }

  async createTest(test: InsertTest): Promise<Test> {
    const id = this.currentTestId++;
    const newTest = {
      ...test,
      id,
      playCount: 0,
      likeCount: 0,
      createdAt: new Date()
    };
    this.testsMap.set(id, newTest);
    return newTest;
  }
  
  async updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined> {
    const existing = await this.getTest(id);
    if (!existing) return undefined;
    
    const updatedTest = {
      ...existing,
      ...test,
      id
    };
    
    this.testsMap.set(id, updatedTest);
    return updatedTest;
  }
  
  async deleteTest(id: number): Promise<boolean> {
    const test = await this.getTest(id);
    if (!test) return false;
    
    // Remove the test
    this.testsMap.delete(id);
    
    // Also remove all comments associated with this test
    const comments = await this.getTestComments(id);
    for (const comment of comments) {
      this.testCommentsMap.delete(comment.id);
    }
    
    return true;
  }

  async incrementTestPlayCount(id: number): Promise<void> {
    const test = await this.getTest(id);
    if (test) {
      const updatedTest = {
        ...test,
        playCount: test.playCount + 1
      };
      this.testsMap.set(id, updatedTest);
    }
  }

  async incrementTestLikeCount(id: number): Promise<void> {
    const test = await this.getTest(id);
    if (test) {
      const updatedTest = {
        ...test,
        likeCount: test.likeCount + 1
      };
      this.testsMap.set(id, updatedTest);
    }
  }
  
  async updateTestApproval(id: number, approved: boolean): Promise<Test | undefined> {
    const test = await this.getTest(id);
    if (!test) return undefined;
    
    const updatedTest = {
      ...test,
      approved
    };
    
    this.testsMap.set(id, updatedTest);
    return updatedTest;
  }
  
  async updateTestPublishedStatus(id: number, published: boolean): Promise<Test | undefined> {
    const test = await this.getTest(id);
    if (!test) return undefined;
    
    const updatedTest = {
      ...test,
      published
    };
    
    this.testsMap.set(id, updatedTest);
    return updatedTest;
  }

  async getPopularTests(limit: number): Promise<Test[]> {
    return Array.from(this.testsMap.values())
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  }

  async getNewestTests(limit: number): Promise<Test[]> {
    return Array.from(this.testsMap.values())
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);
  }

  async getFeaturedTests(limit: number): Promise<Test[]> {
    // For now, featured tests are a mix of popular and newest tests
    const popular = await this.getPopularTests(Math.ceil(limit / 2));
    const newest = await this.getNewestTests(limit);
    
    // Combine and remove duplicates
    const combinedTests = [...popular];
    
    for (const test of newest) {
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
    return Array.from(this.testCommentsMap.values())
      .filter(comment => comment.testId === testId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async createTestComment(comment: InsertTestComment): Promise<TestComment> {
    const id = this.currentTestCommentId++;
    const newComment = {
      ...comment,
      id,
      createdAt: new Date()
    };
    this.testCommentsMap.set(id, newComment);
    return newComment;
  }

  // Game score operations
  async saveGameScore(score: InsertGameScore): Promise<GameScore> {
    const id = this.currentGameScoreId++;
    const newScore = { 
      ...score, 
      id, 
      createdAt: new Date() 
    };
    this.gameScoresMap.set(id, newScore);
    
    // Update test play count if testId is provided
    if (score.testId) {
      await this.incrementTestPlayCount(score.testId);
    }
    
    // Update user score if userId is provided
    if (score.userId) {
      await this.updateUserScore(score.userId, score.score);
    }
    
    return newScore;
  }

  async getUserScores(userId: number): Promise<GameScore[]> {
    return Array.from(this.gameScoresMap.values())
      .filter(score => score.userId === userId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getTopScores(limit: number, gameMode?: string): Promise<GameScore[]> {
    let scores = Array.from(this.gameScoresMap.values());
    
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// PostgreSQL storage
import { pgStorage } from './db-storage';

// Veritabanı bağlantısını kontrol et ve hata durumunda memory storage'a dön
let storage: IStorage;
try {
  // PostgreSQL kullan
  storage = pgStorage;
  console.log("Using PostgreSQL storage");
} catch (error) {
  // Hata durumunda MemStorage'a geri dön
  console.error("Error connecting to PostgreSQL, falling back to MemStorage:", error);
  storage = new MemStorage();
}

export { storage };
