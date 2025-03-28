import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { supabaseStorage } from "./supabase-storage";
import { pgStorage } from "./db-storage";
import { storage as memStorage } from "./storage"; // Memory storage'ı ekleyelim
import { z } from "zod";
import pkg from 'pg';
const { Pool } = pkg;
import { 
  insertUserSchema, 
  insertCategorySchema, 
  insertImageSchema, 
  insertTestSchema,
  insertTestCommentSchema,
  insertGameScoreSchema,
  gameModesEnum,
  userActivities
} from "@shared/schema";
import { db } from './supabase';

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
      const existingUser = await supabaseStorage.getUserByUsername(userInput.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const newUser = await supabaseStorage.createUser(userInput);
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
      
      const user = await supabaseStorage.getUserByUsername(username);
      
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
      // Supabase yerine memory storage kullanarak kategorileri getir
      console.log("Fetching categories using supabaseStorage");
      const categories = await supabaseStorage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await supabaseStorage.getCategory(id);
      
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
      const images = await supabaseStorage.getAllImages();
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
      
      const images = await supabaseStorage.getImagesByCategory(categoryId);
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
      
      const image = await supabaseStorage.getImage(id);
      
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
      const topPlayedImages = await supabaseStorage.getTopPlayedImages(limit);
      res.json(topPlayedImages);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/images/favorites", async (_req: Request, res: Response) => {
    try {
      const limit = 5;
      const topLikedImages = await supabaseStorage.getTopLikedImages(limit);
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
      
      const image = await supabaseStorage.getImage(id);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      await supabaseStorage.incrementLikeCount(id);
      const updatedImage = await supabaseStorage.getImage(id);
      
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
      
      const image = await supabaseStorage.getImage(id);
      
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
      
      const newScore = await supabaseStorage.saveGameScore(gameScoreInput);
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
      const topScores = await supabaseStorage.getTopScores(limit);
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
      
      const userScores = await supabaseStorage.getUserScores(userId);
      res.json(userScores);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Random image for gameplay
  app.get("/api/game/random-image", async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      let images = await supabaseStorage.getAllImages();
      
      if (categoryId && !isNaN(categoryId)) {
        images = await supabaseStorage.getImagesByCategory(categoryId);
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
  app.get("/api/tests", async (req: Request, res: Response) => {
    try {
      // Eğer query parametresi varsa, arama yap
      const searchQuery = req.query.q as string;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      if (searchQuery || categoryId) {
        console.log(`Received search request: query="${searchQuery}", categoryId=${categoryId}`);
        const searchResults = await supabaseStorage.searchTests(searchQuery || "", categoryId);
        return res.json(searchResults);
      }
      
      // Arama sorgusu yoksa tüm testleri getir
      const tests = await supabaseStorage.getAllTests();
      res.json(tests);
    } catch (error) {
      console.error("Test listesi veya arama hatası:", error);
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  });
  
  app.get("/api/tests/popular", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      console.log("Fetching popular tests using supabaseStorage");
      const popularTests = await supabaseStorage.getPopularTests(limit);
      res.json(popularTests);
    } catch (error) {
      console.error("Error fetching popular tests:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/tests/newest", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      console.log("Fetching newest tests using supabaseStorage");
      const newestTests = await supabaseStorage.getNewestTests(limit);
      res.json(newestTests);
    } catch (error) {
      console.error("Error fetching newest tests:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/tests/featured", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      console.log("Fetching featured tests using supabaseStorage");
      const featuredTests = await supabaseStorage.getFeaturedTests(limit);
      res.json(featuredTests);
    } catch (error) {
      console.error("Error fetching featured tests:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/tests/category/:categoryId", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const tests = await supabaseStorage.getTestsByCategory(categoryId);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/tests/:id", async (req: Request, res: Response) => {
    try {
      // ID'nin sayı olup olmadığını kontrol et
      const idParam = req.params.id;
      let test = null;
      
      if (!isNaN(parseInt(idParam))) {
        const id = parseInt(idParam);
        test = await supabaseStorage.getTest(id);
      }
      
      // Eğer ID sayı değilse veya test bulunamadıysa, UUID olarak dene
      if (!test && idParam.length > 8) {
        console.log("ID sayı olarak bulunamadı, UUID olarak deneniyor:", idParam);
        test = await supabaseStorage.getTestByUuid(idParam);
      }
      
      if (!test) {
        console.log("Test bulunamadı - ID:", idParam);
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json(test);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/tests", async (req: Request, res: Response) => {
    try {
      console.log("Test oluşturma isteği:", req.body);
      
      // Check if this is an anonymous test
      const isAnonymous = req.body.isAnonymous === true;
      
      // Transform data - rename properties to match database schema
      // Don't include is_anonymous field here as it causes issues with Supabase schema cache
      const transformedData = {
        title: req.body.title,
        description: req.body.description || "",
        category_id: req.body.categoryId || req.body.category_id,
        creator_id: typeof req.body.creator_id === 'string' ? 1 : (req.body.creator_id || req.body.creatorId || 1), // Ensure creator_id is not a string/UUID
        difficulty: req.body.difficulty || 3, // Default to medium difficulty
        duration: req.body.duration || null,
        image_url: req.body.thumbnail || req.body.image_url || null,
        questions: req.body.images || req.body.questions || [],
        approved: true, // Auto-approve for now
        is_public: req.body.isPublic !== undefined ? req.body.isPublic : true,
        featured: false
      };
      
      console.log("Dönüştürülmüş veri:", transformedData);
      
      // Create the test first - excluding the problematic is_anonymous field
      let createdTest: any = null;
      
      try {
        // Try using PostgreSQL storage first (more reliable)
        createdTest = await pgStorage.createTest(transformedData);
        console.log("Test PostgreSQL storage'a kaydedildi:", createdTest);
      } catch (pgError) {
        console.error("PostgreSQL kaydetme hatası:", pgError);
        
        try {
          // Try with Supabase storage next
          createdTest = await supabaseStorage.createTest(transformedData);
          console.log("Test Supabase'e kaydedildi:", createdTest);
        } catch (supabaseError) {
          console.error("Supabase kaydetme hatası:", supabaseError);
          
          // Last resort - in-memory storage
          createdTest = await memStorage.createTest(transformedData);
          console.log("Test memory storage'a kaydedildi:", createdTest);
        }
      }
      
      // Now if this was supposed to be anonymous, update it using our SQL function
      if (isAnonymous && createdTest && createdTest.id) {
        console.log(`Test created (ID: ${createdTest.id}), now setting anonymous status...`);
        
        try {
          // Direct approach - most reliable
          console.log("Trying direct SQL update for anonymous status");
          const { data, error: directError } = await db
            .from('tests')
            .update({ is_anonymous: true })
            .eq('id', createdTest.id)
            .select()
            .single();
            
          if (directError) {
            console.error("Direct SQL update error:", directError);
            
            // Try RPC approach as fallback
            console.log("Falling back to RPC function");
            const { error: rpcError } = await db.rpc('set_anonymous_from_param', { 
              test_id: createdTest.id,
              should_be_anonymous: true
            });
            
            if (rpcError) {
              console.error("RPC error while setting anonymous status:", rpcError);
              
              // Try a different direct SQL approach as final fallback
              try {
                console.log("Trying alternative direct SQL update for anonymous status");
                const result = await db.from('tests')
                  .update({ is_anonymous: true })
                  .eq('id', createdTest.id)
                  .select()
                  .single();
                  
                if (result.error) {
                  console.error("Alternative direct SQL update error:", result.error);
                } else {
                  console.log("Successfully marked test as anonymous via alternative direct SQL");
                  createdTest = result.data;
                }
              } catch (sqlError) {
                console.error("Failed to set anonymous status via alternative direct SQL:", sqlError);
              }
            } else {
              console.log("Successfully marked test as anonymous via RPC");
              
              // Fetch the updated test
              const { data: updatedTest, error: fetchError } = await db
                .from('tests')
                .select('*')
                .eq('id', createdTest.id)
                .single();
                
              if (fetchError) {
                console.error("Error fetching updated test:", fetchError);
              } else if (updatedTest) {
                console.log("Test updated with anonymous status:", updatedTest.is_anonymous);
                createdTest = updatedTest;
              }
            }
          } else if (data) {
            console.log("Successfully marked test as anonymous via direct update");
            createdTest = data; // Update the test data for return later
          }
        } catch (anonymousError) {
          console.error("Failed to set anonymous status:", anonymousError);
          // Continue with the created test anyway
        }
      }
      
      return res.status(201).json(createdTest);
    } catch (error) {
      console.error("Test oluşturma hatası:", error);
      res.status(500).json({ message: "Test oluşturma hatası", error: String(error) });
    }
  });
  
  app.post("/api/tests/:id/like", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }
      
      const test = await supabaseStorage.getTest(id);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      await supabaseStorage.incrementTestLikeCount(id);
      const updatedTest = await supabaseStorage.getTest(id);
      
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
      
      const comments = await supabaseStorage.getTestComments(testId);
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
      
      const test = await supabaseStorage.getTest(testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      const commentInput = insertTestCommentSchema.parse({
        ...req.body,
        testId
      });
      
      const comment = await supabaseStorage.createTestComment(commentInput);
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
      // Geliştirme aşamasında admin erişimini kolaylaştırmak için her isteği kabul edelim
      // NOT: Üretime geçmeden önce bu kaldırılmalıdır
      console.log("Allowing admin access for development purposes");
      return next();
      
      // İstek kimlik doğrulaması için bir oturum kullanılabilir
      // const userId = req.session?.userId;
      
      // // Geliştirme ve test amacıyla 'x-admin-token' başlığını da kabul edelim
      // const adminTokenHeader = req.headers['x-admin-token'];
      
      // if (adminTokenHeader === 'admin-secret-token') {
      //   return next();
      // }
      
      // // Kullanıcı oturumunu kontrol edin
      // if (req.headers['x-user-id']) {
      //   const userId = Number(req.headers['x-user-id']);
      //   if (!isNaN(userId)) {
      //     const user = await supabaseStorage.getUser(userId);
      //     
      //     if (user && user.role === 'admin') {
      //       return next();
      //     }
      //   }
      // }
      
      // return res.status(403).json({ message: "Access denied: Admin privileges required" });
    } catch (error) {
      console.error('Admin authentication error:', error);
      return res.status(500).json({ message: "Server error during authentication" });
    }
  };
  
  // Get all users (admin only)
  app.get("/api/admin/users", isAdmin, async (_req: Request, res: Response) => {
    try {
      const users = await supabaseStorage.getAllUsers();
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
      
      const user = await supabaseStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await supabaseStorage.updateUserRole(userId, role);
      
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
      
      const user = await supabaseStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await supabaseStorage.updateUserBanStatus(userId, banned);
      
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
      console.log("Allowing admin access for development purposes");
      // Log request data for debugging
      console.log("Request body for category:", req.body);
      
      // Try to parse with Zod schema
      let categoryInput;
      try {
        categoryInput = insertCategorySchema.parse(req.body);
        console.log("Validated category input:", categoryInput);
      } catch (zodError) {
        console.log("Zod validation failed, using fallback approach");
        // Fallback - manually extract fields
        categoryInput = {
          name: req.body.name,
          description: req.body.description || "",
          icon_name: req.body.iconName === "none" ? null : (req.body.icon_name || req.body.iconName),
          color: req.body.color,
          background_color: req.body.background_color || req.body.backgroundColor,
          active: req.body.active !== false // Default to true if not provided
        };
      }
      
      // Try different storage methods until one works
      let newCategory;
      try {
        console.log("Attempting to create category with supabaseStorage");
        newCategory = await supabaseStorage.createCategory(categoryInput);
      } catch (supabaseError) {
        console.error("Supabase error:", supabaseError);
        console.log("Falling back to pgStorage");
        
        try {
          newCategory = await pgStorage.createCategory(categoryInput);
        } catch (pgError) {
          console.error("PostgreSQL error:", pgError);
          console.log("Falling back to memory storage");
          
          // Final fallback to in-memory storage
          try {
            newCategory = await memStorage.createCategory(categoryInput);
          } catch (memoryError) {
            console.error("Memory storage error:", memoryError);
            throw new Error("Failed to create category using all available storage methods");
          }
        }
      }
      
      console.log("Category created successfully:", newCategory);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Server error", details: String(error) });
    }
  });
  
  app.put("/api/categories/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      let categoryInput: any;
      try {
        // Try to parse with Zod schema
        const parsedData = insertCategorySchema.parse(req.body);
        categoryInput = {
          ...parsedData,
          // Handle iconName conversion to icon_name
          icon_name: req.body.iconName === "none" ? null : req.body.iconName
        };
      } catch (zodError) {
        console.log("Zod validation failed, using manual field extraction:", zodError);
        // Fallback - manually extract fields
        categoryInput = {
          name: req.body.name,
          description: req.body.description || "",
          icon_name: req.body.iconName === "none" ? null : (req.body.icon_name || req.body.iconName),
          color: req.body.color,
          background_color: req.body.background_color || req.body.backgroundColor,
          active: req.body.active !== false // Default to true if not provided
        };
      }
      
      console.log("Updating category with data:", categoryInput);
      
      // Try with supabase first, then fallback
      let updatedCategory;
      try {
        updatedCategory = await supabaseStorage.updateCategory(id, categoryInput);
      } catch (supabaseError) {
        console.error("Supabase error:", supabaseError);
        console.log("Falling back to pgStorage");
        updatedCategory = await pgStorage.updateCategory(id, categoryInput);
      }
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", details: String(error) });
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
      const updatedTest = await supabaseStorage.updateTest(id, testInput);
      
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
      
      const deleted = await supabaseStorage.deleteTest(id);
      
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
      
      // Access user activities through the storage interface
      try {
        // Use supabaseStorage if it has the method, otherwise fall back to memory storage
        const activities = await supabaseStorage.getLatestActivities(limit);
        console.log('Activity query result:', { count: activities.length });
        return res.json(activities);
      } catch (dbError: any) {
        console.error('Database query error:', dbError);
        return res.status(500).json({ message: "Database error while fetching activities", error: dbError.message });
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
      
      // Access user activities through the storage interface
      try {
        const activities = await supabaseStorage.getUserActivities(userId, limit);
        console.log('User activity query result:', { userId, count: activities.length });
        return res.json(activities);
      } catch (dbError: any) {
        console.error('Database query error:', dbError);
        return res.status(500).json({ message: "Database error while fetching user activities", error: dbError.message });
      }
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Server error while fetching user activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
