import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertCategorySchema, 
  insertImageSchema, 
  insertGameScoreSchema,
  gameModesEnum
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
      
      // Validate game mode
      gameModesEnum.parse(gameScoreInput.gameMode);
      
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
      const gameMode = req.query.gameMode as string | undefined;
      
      if (gameMode) {
        try {
          gameModesEnum.parse(gameMode);
        } catch (error) {
          return res.status(400).json({ message: "Invalid game mode" });
        }
      }
      
      const topScores = await storage.getTopScores(limit, gameMode);
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
  
  const httpServer = createServer(app);
  return httpServer;
}
