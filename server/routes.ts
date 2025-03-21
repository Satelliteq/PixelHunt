import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertCategorySchema, 
  insertImageSchema, 
  insertTestSchema,
  insertTestCommentSchema,
  insertGameScoreSchema,
  gameModesEnum
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Route to safely expose environment variables to the client
  app.get("/api/env", (_req: Request, res: Response) => {
    // Only expose specific environment variables needed for client-side
    const clientEnv = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    };
    
    res.json(clientEnv);
  });
  // API routes
  
  // User routes
  app.post("/api/users/register", async (req: Request, res: Response) => {
    try {
      const userInput = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userInput.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(userInput);
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/users/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Category routes
  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Image routes
  app.get("/api/images", async (_req: Request, res: Response) => {
    try {
      const images = await storage.getAllImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/images/category/:categoryId", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const images = await storage.getImagesByCategory(categoryId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/images/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }
      
      const image = await storage.getImage(id);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.json(image);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/images/popular", async (_req: Request, res: Response) => {
    try {
      const limit = 5;
      const topPlayedImages = await storage.getTopPlayedImages(limit);
      res.json(topPlayedImages);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/images/favorites", async (_req: Request, res: Response) => {
    try {
      const limit = 5;
      const topLikedImages = await storage.getTopLikedImages(limit);
      res.json(topLikedImages);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/images/:id/like", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }
      
      const image = await storage.getImage(id);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      await storage.incrementLikeCount(id);
      const updatedImage = await storage.getImage(id);
      
      res.json(updatedImage);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Game routes
  app.post("/api/game/check-answer", async (req: Request, res: Response) => {
    try {
      const { imageId, answer } = req.body;
      
      if (!imageId || !answer) {
        return res.status(400).json({ message: "Image ID and answer are required" });
      }
      
      const id = parseInt(imageId);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }
      
      const image = await storage.getImage(id);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      const answers = image.answers as string[];
      const isCorrect = answers.some(
        a => a.toLowerCase() === answer.toLowerCase()
      );
      
      res.json({ isCorrect });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/game/scores", async (req: Request, res: Response) => {
    try {
      const gameScoreInput = insertGameScoreSchema.parse(req.body);
      
      const newScore = await storage.saveGameScore(gameScoreInput);
      res.status(201).json(newScore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid score data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/game/scores/top", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const topScores = await storage.getTopScores(limit);
      res.json(topScores);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/game/scores/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const userScores = await storage.getUserScores(userId);
      res.json(userScores);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Random image for gameplay
  app.get("/api/game/random-image", async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      let images = await storage.getAllImages();
      
      if (categoryId && !isNaN(categoryId)) {
        images = await storage.getImagesByCategory(categoryId);
      }
      
      if (images.length === 0) {
        return res.status(404).json({ message: "No images found" });
      }
      
      const randomIndex = Math.floor(Math.random() * images.length);
      const randomImage = images[randomIndex];
      
      res.json(randomImage);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Test routes
  app.get("/api/tests", async (_req: Request, res: Response) => {
    try {
      const tests = await storage.getAllTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/tests/popular", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const popularTests = await storage.getPopularTests(limit);
      res.json(popularTests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/tests/newest", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const newestTests = await storage.getNewestTests(limit);
      res.json(newestTests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/tests/featured", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const featuredTests = await storage.getFeaturedTests(limit);
      res.json(featuredTests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/tests/category/:categoryId", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const tests = await storage.getTestsByCategory(categoryId);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/tests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }
      
      const test = await storage.getTest(id);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json(test);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/tests", async (req: Request, res: Response) => {
    try {
      const testInput = insertTestSchema.parse(req.body);
      const newTest = await storage.createTest(testInput);
      res.status(201).json(newTest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/tests/:id/like", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }
      
      const test = await storage.getTest(id);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      await storage.incrementTestLikeCount(id);
      const updatedTest = await storage.getTest(id);
      
      res.json(updatedTest);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Test comment routes
  app.get("/api/tests/:testId/comments", async (req: Request, res: Response) => {
    try {
      const testId = parseInt(req.params.testId);
      
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }
      
      const comments = await storage.getTestComments(testId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/tests/:testId/comments", async (req: Request, res: Response) => {
    try {
      const testId = parseInt(req.params.testId);
      
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }
      
      const test = await storage.getTest(testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      const commentInput = insertTestCommentSchema.parse({
        ...req.body,
        testId
      });
      
      const comment = await storage.createTestComment(commentInput);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin routes
  // Middleware function to check if user is admin
  const isAdmin = async (req: Request, res: Response, next: Function) => {
    // Admin kullanıcıları kontrol et - oturum bilgilerinden
    // Veya req.user ile kullanıcı bilgilerine erişilebilir
    
    try {
      // İstek kimlik doğrulaması için bir oturum kullanılabilir
      // const userId = req.session?.userId;
      
      // Geliştirme ve test amacıyla 'x-admin-token' başlığını da kabul edelim
      const adminTokenHeader = req.headers['x-admin-token'];
      
      if (adminTokenHeader === 'admin-secret-token') {
        return next();
      }
      
      // Kullanıcı oturumunu kontrol edin
      if (req.headers['x-user-id']) {
        const userId = Number(req.headers['x-user-id']);
        if (!isNaN(userId)) {
          const user = await storage.getUser(userId);
          
          if (user && user.role === 'admin') {
            return next();
          }
        }
      }
      
      return res.status(403).json({ message: "Access denied: Admin privileges required" });
    } catch (error) {
      console.error('Admin authentication error:', error);
      return res.status(500).json({ message: "Server error during authentication" });
    }
  };
  
  // Get all users (admin only)
  app.get("/api/admin/users", isAdmin, async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from the response
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update user role (admin only)
  app.post("/api/admin/users/:id/role", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      if (!role || (role !== 'admin' && role !== 'user')) {
        return res.status(400).json({ message: "Valid role (admin or user) is required" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Ban/unban user (admin only)
  app.post("/api/admin/users/:id/ban", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { banned } = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      if (typeof banned !== 'boolean') {
        return res.status(400).json({ message: "Banned status (true/false) is required" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUserBanStatus(userId, banned);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // CRUD operations for categories (admin only)
  app.post("/api/categories", isAdmin, async (req: Request, res: Response) => {
    try {
      const categoryInput = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(categoryInput);
      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/categories/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const categoryInput = insertCategorySchema.parse(req.body);
      const updatedCategory = await storage.updateCategory(id, categoryInput);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // CRUD operations for tests (admin only)
  app.put("/api/tests/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }
      
      const testInput = insertTestSchema.parse(req.body);
      const updatedTest = await storage.updateTest(id, testInput);
      
      if (!updatedTest) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json(updatedTest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/tests/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }
      
      const deleted = await storage.deleteTest(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Admin - Get all activities
  app.get("/api/admin/activities", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || "50", 10);
      
      // Try direct SQL query 
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
      });
      
      await client.connect();
      
      try {
        const query = 'SELECT * FROM user_activities ORDER BY created_at DESC LIMIT $1';
        const result = await client.query(query, [limit]);
        console.log('Activity query result:', { rows: result.rows.length, sample: result.rows[0] });
        return res.json(result.rows);
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // If direct query fails, return empty array rather than error
        return res.json([]);
      } finally {
        await client.end();
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Server error while fetching activities" });
    }
  });
  
  // Admin - Get activities for a specific user
  app.get("/api/admin/users/:id/activities", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const limit = parseInt(req.query.limit as string || "50", 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Try direct SQL query
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
      });
      
      await client.connect();
      
      try {
        const query = 'SELECT * FROM user_activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2';
        const result = await client.query(query, [userId, limit]);
        console.log('User activity query result:', { userId, rows: result.rows.length });
        return res.json(result.rows);
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // If direct query fails, return empty array rather than error
        return res.json([]);
      } finally {
        await client.end();
      }
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Server error while fetching user activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
