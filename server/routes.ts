import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import admin from 'firebase-admin';
import { z } from "zod";
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

// Get Firestore instance
const db = admin.apps.length ? admin.firestore() : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Route to safely expose environment variables to the client
  app.get("/api/env", (_req: Request, res: Response) => {
    // Only expose specific environment variables needed for client-side
    const clientEnv = {
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID
    };
    
    res.json(clientEnv);
  });

  // API routes - these are now handled directly by the client using Firebase SDK
  // We'll keep minimal server-side API routes for operations that require admin privileges

  // Admin routes
  // Middleware function to check if user is admin
  const isAdmin = async (req: Request, res: Response, next: Function) => {
    if (!db) {
      return res.status(500).json({ message: "Firebase not initialized" });
    }
    
    try {
      // Get the authorization token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const token = authHeader.split('Bearer ')[1];
      
      // Verify the token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Check if user is admin
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (!userDoc.exists) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const userData = userDoc.data();
      if (userData?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Add user to request
      (req as any).user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: userData.role
      };
      
      next();
    } catch (error) {
      console.error('Admin authentication error:', error);
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
  
  // Admin - Get all users
  app.get("/api/admin/users", isAdmin, async (_req: Request, res: Response) => {
    if (!db) {
      return res.status(500).json({ message: "Firebase not initialized" });
    }
    
    try {
      const usersSnapshot = await db.collection('users').get();
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Admin - Update user role
  app.post("/api/admin/users/:id/role", isAdmin, async (req: Request, res: Response) => {
    if (!db) {
      return res.status(500).json({ message: "Firebase not initialized" });
    }
    
    try {
      const userId = req.params.id;
      const { role } = req.body;
      
      if (!role || (role !== 'admin' && role !== 'user')) {
        return res.status(400).json({ message: "Valid role (admin or user) is required" });
      }
      
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await userRef.update({ role });
      
      const updatedUserDoc = await userRef.get();
      const userData = updatedUserDoc.data();
      
      res.json({
        id: updatedUserDoc.id,
        ...userData
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Admin - Ban/unban user
  app.post("/api/admin/users/:id/ban", isAdmin, async (req: Request, res: Response) => {
    if (!db) {
      return res.status(500).json({ message: "Firebase not initialized" });
    }
    
    try {
      const userId = req.params.id;
      const { banned } = req.body;
      
      if (typeof banned !== 'boolean') {
        return res.status(400).json({ message: "Banned status (true/false) is required" });
      }
      
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await userRef.update({ banned });
      
      const updatedUserDoc = await userRef.get();
      const userData = updatedUserDoc.data();
      
      res.json({
        id: updatedUserDoc.id,
        ...userData
      });
    } catch (error) {
      console.error('Error updating user ban status:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Admin - Get all activities
  app.get("/api/admin/activities", isAdmin, async (req: Request, res: Response) => {
    if (!db) {
      return res.status(500).json({ message: "Firebase not initialized" });
    }
    
    try {
      const limit = parseInt(req.query.limit as string || "50", 10);
      
      const activitiesSnapshot = await db.collection('userActivities')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const activities = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Admin - Get activities for a specific user
  app.get("/api/admin/users/:id/activities", isAdmin, async (req: Request, res: Response) => {
    if (!db) {
      return res.status(500).json({ message: "Firebase not initialized" });
    }
    
    try {
      const userId = req.params.id;
      const limit = parseInt(req.query.limit as string || "50", 10);
      
      const activitiesSnapshot = await db.collection('userActivities')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const activities = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      res.json(activities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}