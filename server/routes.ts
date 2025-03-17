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
      try {
        // Supabase ile kategorileri alalım
        const { supabase } = await import('./supabase-setup');
        
        const { data, error } = await supabase
          .from('categories')
          .select('*');
        
        if (error) {
          console.error("Error getting all categories:", error);
        } else if (data && data.length > 0) {
          // Veriyi frontend formatına dönüştürüyoruz
          const formattedCategories = data.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            iconUrl: category.icon_url
          }));
          
          console.log("Categories fetched from Supabase:", formattedCategories.length);
          return res.json(formattedCategories);
        }
      } catch (supabaseError) {
        console.error("Supabase categories error:", supabaseError);
      }
      
      // Fallback: storage kullan
      const categories = await storage.getAllCategories();
      console.log("Categories fetched from storage:", categories.length);
      res.json(categories);
    } catch (error) {
      console.error("Error getting all categories:", error);
      res.status(500).json([]);
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
      
      try {
        // Sadece Supabase API kullan
        const { supabase } = await import('./supabase-setup');
        
        // Önce prosedürü çağırmayı dene
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_popular_tests', { 
            limit_param: limit 
          });
          
          if (!rpcError && rpcData && rpcData.length > 0) {
            console.log("Using Supabase RPC for popular tests");
            return res.json(rpcData);
          } else if (rpcError) {
            console.error("Error executing RPC for popular tests:", rpcError);
          }
        } catch (rpcCallError) {
          console.error("Error calling RPC for popular tests:", rpcCallError);
        }
        
        // Prosedür başarısız olursa doğrudan sorgu yap
        try {
          const { data, error } = await supabase
            .from('tests')
            .select('*')
            .eq('published', true)
            .eq('approved', true)
            .order('play_count', { ascending: false })
            .limit(limit);
          
          if (!error && data) {
            console.log("Using Supabase query for popular tests");
            return res.json(data);
          } else if (error) {
            console.error("Error fetching popular tests:", error);
          }
        } catch (queryError) {
          console.error("Error executing query for popular tests:", queryError);
        }
        
        // View kullanmayı dene
        try {
          const { data: viewData, error: viewError } = await supabase
            .from('popular_tests')
            .select('*')
            .limit(limit);
          
          if (!viewError && viewData) {
            console.log("Using Supabase view for popular tests");
            return res.json(viewData);
          } else {
            console.error("All methods failed to fetch tests:", viewError);
          }
        } catch (viewQueryError) {
          console.error("Error querying view for popular tests:", viewQueryError);
        }
      } catch (supabaseError) {
        console.error("Supabase connection error:", supabaseError);
      }
      
      // Verileri bulamazsak boş dizi döndür
      res.json([]);
    } catch (error) {
      console.error("Error in popular tests route:", error);
      res.status(500).json([]);
    }
  });
  
  app.get("/api/tests/newest", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      try {
        // Sadece Supabase API kullan
        const { supabase } = await import('./supabase-setup');
        
        // Önce prosedürü çağırmayı dene
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_newest_tests', { 
            limit_param: limit 
          });
          
          if (!rpcError && rpcData && rpcData.length > 0) {
            console.log("Using Supabase RPC for newest tests");
            return res.json(rpcData);
          } else if (rpcError) {
            console.error("Error executing RPC for newest tests:", rpcError);
          }
        } catch (rpcCallError) {
          console.error("Error calling RPC for newest tests:", rpcCallError);
        }
        
        // Prosedür başarısız olursa doğrudan sorgu yap
        try {
          const { data, error } = await supabase
            .from('tests')
            .select('*')
            .eq('published', true)
            .eq('approved', true)
            .order('created_at', { ascending: false })
            .limit(limit);
          
          if (!error && data) {
            console.log("Using Supabase query for newest tests");
            return res.json(data);
          } else if (error) {
            console.error("Error fetching newest tests:", error);
          }
        } catch (queryError) {
          console.error("Error executing query for newest tests:", queryError);
        }
        
        // View kullanmayı dene
        try {
          const { data: viewData, error: viewError } = await supabase
            .from('newest_tests')
            .select('*')
            .limit(limit);
          
          if (!viewError && viewData) {
            console.log("Using Supabase view for newest tests");
            return res.json(viewData);
          } else {
            console.error("All methods failed to fetch tests:", viewError);
          }
        } catch (viewQueryError) {
          console.error("Error querying view for newest tests:", viewQueryError);
        }
      } catch (supabaseError) {
        console.error("Supabase connection error:", supabaseError);
      }
      
      // Verileri bulamazsak boş dizi döndür
      res.json([]);
    } catch (error) {
      console.error("Error in newest tests route:", error);
      res.status(500).json([]);
    }
  });
  
  app.get("/api/tests/featured", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      try {
        // Sadece Supabase API kullan
        const { supabase } = await import('./supabase-setup');
        
        // Doğrudan sorgu yap
        try {
          const { data, error } = await supabase
            .from('tests')
            .select('*')
            .eq('published', true)
            .eq('approved', true)
            .order('play_count', { ascending: false })
            .order('like_count', { ascending: false })
            .limit(limit);
          
          if (!error && data) {
            console.log("Using Supabase query for featured tests");
            return res.json(data);
          } else if (error) {
            console.error("Error fetching featured tests:", error);
          }
        } catch (queryError) {
          console.error("Error executing query for featured tests:", queryError);
        }
        
        // View kullanmayı dene
        try {
          const { data: viewData, error: viewError } = await supabase
            .from('featured_tests')
            .select('*')
            .limit(limit);
          
          if (!viewError && viewData) {
            console.log("Using Supabase view for featured tests");
            return res.json(viewData);
          } else {
            console.error("All methods failed to fetch tests:", viewError);
          }
        } catch (viewQueryError) {
          console.error("Error querying view for featured tests:", viewQueryError);
        }
      } catch (supabaseError) {
        console.error("Supabase connection error:", supabaseError);
      }
      
      // Verileri bulamazsak boş dizi döndür
      res.json([]);
    } catch (error) {
      console.error("Error in featured tests route:", error);
      res.status(500).json([]);
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
      
      try {
        // Try using storage first
        const test = await storage.getTest(id);
        if (test) {
          console.log('Using storage for test details');
          return res.json(test);
        }
      } catch (storageError) {
        console.log('Storage error for test details, trying direct DB:', storageError);
      }
      
      // Fallback to direct database access
      try {
        const { getTestById } = await import('./direct-db');
        const test = await getTestById(id);
        
        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }
        
        console.log('Using direct DB for test details');
        return res.json(test);
      } catch (directDbError) {
        console.error('Direct DB error for test details:', directDbError);
        return res.status(404).json({ message: "Test not found" });
      }
    } catch (error) {
      console.error('Error getting test by ID:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/tests", async (req: Request, res: Response) => {
    try {
      console.log("Received test creation request:", req.body);
      
      try {
        // Try using Supabase API first
        const { createTest } = await import('./supabase-api');
        const newTest = await createTest(req.body);
        if (newTest) {
          console.log('Using Supabase API for test creation');
          return res.status(201).json(newTest);
        }
      } catch (supabaseError) {
        console.log('Supabase API error for test creation, trying direct DB:', supabaseError);
      }
      
      // Fallback to direct database access
      try {
        const { createTest } = await import('./direct-db');
        const newTest = await createTest(req.body);
        
        if (!newTest) {
          throw new Error('Failed to create test');
        }
        
        console.log('Using direct DB for test creation');
        return res.status(201).json(newTest);
      } catch (directDbError) {
        console.error('Direct DB error for test creation:', directDbError);
      }
      
      // Last resort, try using storage
      const testInput = insertTestSchema.parse(req.body);
      const newTest = await storage.createTest(testInput);
      console.log('Using storage for test creation');
      return res.status(201).json(newTest);
    } catch (error) {
      console.error("Test creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", details: error instanceof Error ? error.message : String(error) });
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
  const isAdmin = (req: Request, res: Response, next: Function) => {
    // In a real app, this would verify the authenticated user has admin role
    // For our demo, we'll use a simple approach
    // Geliştirme aşamasında admin kontrolünü devre dışı bırakıyoruz
    // const isAdminUser = req.headers['x-admin-token'] === 'admin-secret-token';
    
    // if (!isAdminUser) {
    //   return res.status(403).json({ message: "Access denied: Admin privileges required" });
    // }
    
    // Her isteğe izin ver (geliştirme aşamasında)
    next();
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
      console.log("Received category creation request:", req.body);
      const categoryInput = insertCategorySchema.parse(req.body);
      
      try {
        // Supabase ile kategori ekleyelim
        const { supabase } = await import('./supabase-setup');
        
        const { data, error } = await supabase
          .from('categories')
          .insert({
            name: categoryInput.name,
            description: categoryInput.description || null,
            icon_url: categoryInput.iconUrl || null
          })
          .select()
          .single();
        
        if (error) {
          console.error("Kategori işlemi sırasında hata:", error);
          throw error;
        }
        
        if (data) {
          // Veriyi frontend formatına dönüştürüyoruz
          const formattedCategory = {
            id: data.id,
            name: data.name,
            description: data.description,
            iconUrl: data.icon_url
          };
          
          console.log("Yeni kategori oluşturuldu:", formattedCategory);
          return res.status(201).json(formattedCategory);
        }
      } catch (supabaseError) {
        console.error("Supabase kategori ekleme hatası:", supabaseError);
      }
      
      // Fallback: storage kullan
      const newCategory = await storage.createCategory(categoryInput);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Kategori işlemi sırasında hata:", error);
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

  const httpServer = createServer(app);
  return httpServer;
}
