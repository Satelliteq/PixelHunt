import {
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  images, type Image, type InsertImage,
  gameScores, type GameScore, type InsertGameScore
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserScore(id: number, scoreToAdd: number): Promise<User | undefined>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Image operations
  getAllImages(): Promise<Image[]>;
  getImage(id: number): Promise<Image | undefined>;
  getImagesByCategory(categoryId: number): Promise<Image[]>;
  createImage(image: InsertImage): Promise<Image>;
  incrementPlayCount(id: number): Promise<void>;
  incrementLikeCount(id: number): Promise<void>;
  getTopPlayedImages(limit: number): Promise<Image[]>;
  getTopLikedImages(limit: number): Promise<Image[]>;
  
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
  private gameScoresMap: Map<number, GameScore>;
  
  private currentUserId: number;
  private currentCategoryId: number;
  private currentImageId: number;
  private currentGameScoreId: number;
  
  constructor() {
    this.usersMap = new Map();
    this.categoriesMap = new Map();
    this.imagesMap = new Map();
    this.gameScoresMap = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentImageId = 1;
    this.currentGameScoreId = 1;

    // Initialize with sample categories
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

  // Game score operations
  async saveGameScore(score: InsertGameScore): Promise<GameScore> {
    const id = this.currentGameScoreId++;
    const newScore = { 
      ...score, 
      id, 
      createdAt: new Date() 
    };
    this.gameScoresMap.set(id, newScore);
    
    // Update image play count
    await this.incrementPlayCount(score.imageId);
    
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
    
    if (gameMode) {
      scores = scores.filter(score => score.gameMode === gameMode);
    }
    
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
